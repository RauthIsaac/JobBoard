import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Subject, firstValueFrom } from 'rxjs';
import { AuthService } from '../../auth/auth-service';

export interface NotificationDto {
  id: number;
  message: string;
  link?: string;
  createdAt: Date;
  isRead: boolean;
}

@Injectable({  
  providedIn: 'root'
})
export class NotificationService {
  private hubConnection!: signalR.HubConnection;
  private readonly apiUrl = 'http://localhost:5007/api';
  private readonly hubUrl = 'http://localhost:5007/notifications';
  
  public notifications = new BehaviorSubject<NotificationDto[]>([]);
  public notificationReceived = new Subject<{ message: string; link: string }>();
  public connectionStatus = new BehaviorSubject<string>('Disconnected');
  public unreadCount = new BehaviorSubject<number>(0);

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {
    this.startConnection();
    this.loadUserNotifications(); // Load once on init
  }

  private async startConnection() {
    try {
      const token = this.authService.getToken();
      if (!token) {
        this.connectionStatus.next('No Token');
        return;
      }

      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(this.hubUrl, { accessTokenFactory: () => token })
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Information)
        .build();

      this.setupEventListeners();
      await this.hubConnection.start();
      this.connectionStatus.next('Connected');
      this.addNotificationListeners();
      
    } catch (error) {
      console.error('❌ SignalR Connection Error:', error);
      this.connectionStatus.next('Error');
      setTimeout(() => this.startConnection(), 5000); // Retry
    }
  }

  private setupEventListeners() {
    this.hubConnection.onreconnecting(() => this.connectionStatus.next('Reconnecting'));
    this.hubConnection.onreconnected(() => {
      this.connectionStatus.next('Connected');
      this.loadUserNotifications(); // Reload only on reconnect
    });
    this.hubConnection.onclose(() => this.connectionStatus.next('Disconnected'));
  }

  private addNotificationListeners() {
    if (this.hubConnection.state !== signalR.HubConnectionState.Connected) return;

    // New notification
    this.hubConnection.on('ReceiveNotification', (message: string, link?: string) => {
      console.log('🔔 New notification received:', { message, link });
      this.notificationReceived.next({ message, link: link || '' });
      this.loadUserNotifications(); // Reload to get full list with ID (simpler than manual add)
    });

    // Updates (fix: use camelCase)
    this.hubConnection.on('NotificationUpdate', (updateData: { action: string; notificationId?: number; notificationIds?: number[] }) => {
      console.log('📝 Notification update received:', updateData);
      
      const currentNotifications = this.notifications.value;
      let updatedNotifications = [...currentNotifications];
      
      switch (updateData.action) {
        case 'MarkAsRead':
          if (updateData.notificationId) {
            updatedNotifications = currentNotifications.map(notif => 
              notif.id === updateData.notificationId ? { ...notif, isRead: true } : notif
            );
          }
          break;
          
        case 'MarkAllAsRead':
          updatedNotifications = currentNotifications.map(notif => ({ ...notif, isRead: true }));
          break;
          
        case 'Delete':
          if (updateData.notificationId) {
            updatedNotifications = currentNotifications.filter(notif => notif.id !== updateData.notificationId);
          }
          break;
          
        default:
          console.warn('Unknown notification update action:', updateData.action);
          return;
      }
      
      this.notifications.next(updatedNotifications);
      this.updateUnreadCount(updatedNotifications);
    });
  }

  async loadUserNotifications(): Promise<void> {
    try {
      const headers = this.getAuthHeaders();
      const userId = this.authService.getUserId();
      if (!userId) return;

      const response = await firstValueFrom(
        this.http.get<NotificationDto[]>(`${this.apiUrl}/notifications/user/${userId}`, { headers })
      );
      
      const notifications = response || [];
      this.notifications.next(notifications);
      this.updateUnreadCount(notifications);
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
    }
  }

  private updateUnreadCount(notifications: NotificationDto[]): void {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    this.unreadCount.next(unreadCount);
  }

  async markAsRead(notificationId: number): Promise<void> {
    try {
      const headers = this.getAuthHeaders();
      await firstValueFrom(
        this.http.put(`${this.apiUrl}/notifications/read/${notificationId}`, {}, { headers, responseType: 'text' })
      );
      // No local update here; rely on SignalR
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      const headers = this.getAuthHeaders();
      const userId = this.authService.getUserId();
      await firstValueFrom(
        this.http.put(`${this.apiUrl}/notifications/user/${userId}/read-all`, {}, { headers, responseType: 'text' })
      );
      // No local update; rely on SignalR
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
    }
  }

  async deleteNotification(notificationId: number): Promise<void> {
    try {
      const headers = this.getAuthHeaders();
      await firstValueFrom(
        this.http.delete(`${this.apiUrl}/notifications/${notificationId}`, { headers, responseType: 'text' })
      );
      // No local update; rely on SignalR
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
    }
  }

  async createNotification(message: string, link?: string, userId?: string): Promise<void> {
    try {
      const headers = this.getAuthHeaders();
      const payload = { message, link: link || '', userId: userId || this.authService.getUserId() };
      await firstValueFrom(this.http.post(`${this.apiUrl}/notifications`, payload, { headers, responseType: 'text' }));
      // No reload; rely on SignalR for new notification
    } catch (error) {
      console.error('❌ Error creating notification:', error);
    }
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  public async reconnect(): Promise<void> {
    try {
      if (this.hubConnection) await this.hubConnection.stop();
      this.connectionStatus.next('Reconnecting');
      await this.startConnection();
    } catch (error) {
      console.error('❌ Error during reconnection:', error);
      this.connectionStatus.next('Error');
    }
  }

  // Other getters remain the same
}