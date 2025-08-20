import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './../../auth/auth-service';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationServices {
  private baseURL = 'http://localhost:5007/api/Notifications';
  private hubConnection: HubConnection;
  private notificationSubject = new Subject<any>();

  constructor(private http: HttpClient, private authService: AuthService) {
    // إعداد الاتصال بـ SignalR
    this.hubConnection = new HubConnectionBuilder()
      .withUrl('http://localhost:5007/notifications', {
        accessTokenFactory: () => this.authService.getToken() ?? ''
      })
      .withAutomaticReconnect() // أضفت reconnect logic
      .build();

    // بدء الاتصال بـ SignalR
    this.startConnection();

    // الاستماع للإشعارات من الـ Hub
    this.hubConnection.on('ReceiveNotification', (message: string, link: string | null, id?: number) => {
      const notification = {
        id: id || null, // لو مافيش id، خليه null
        message,
        link,
        isRead: false
      };
      console.log('Received SignalR notification:', notification); // log للتحقق
      this.notificationSubject.next(notification);
    });

    // التحقق من إعادة الاتصال
    this.hubConnection.onreconnected(() => {
      console.log('SignalR Reconnected!');
    });

    this.hubConnection.onclose((error) => {
      console.error('SignalR Connection Closed:', error);
    });
  }

  // بدء الاتصال بـ SignalR
  private startConnection() {
    this.hubConnection
      .start()
      .then(() => console.log('SignalR Connected!'))
      .catch(err => {
        console.error('Error connecting to SignalR:', err);
        // إعادة المحاولة بعد 5 ثوانٍ
        setTimeout(() => this.startConnection(), 5000);
      });
  }

  // إرجاع Observable للإشعارات
  public getNotificationsObservable(): Observable<any> {
    return this.notificationSubject.asObservable();
  }

  // إرسال إشعار باستخدام HTTP
  postNotification(notificationData: any) {
    const headers = { 'Authorization': `Bearer ${this.authService.getToken() ?? ''}` };
    console.log('Sending notification with token:', this.authService.getToken()); // log للتحقق
    return this.http.post(`${this.baseURL}`, notificationData, { headers });
  }

  // جلب الإشعارات القديمة باستخدام HTTP
  userId: string = "f810fb62-7284-4dd2-8027-807036a276d7";
  getNotifications() {
    const headers = { 'Authorization': `Bearer ${this.authService.getToken() ?? ''}` };
    console.log('Fetching notifications for userId:', this.userId); // log للتحقق
    return this.http.get(`${this.baseURL}/user/${this.userId}`, { headers });
  }

  // تحديد الإشعار كـ مقروء
  markAsRead(id: number) {
    const headers = { 'Authorization': `Bearer ${this.authService.getToken() ?? ''}` };
    console.log('Marking notification as read, id:', id); // log للتحقق
    return this.http.put(`${this.baseURL}/read/${id}`, null, { headers });
  }

  // إيقاف الاتصال بـ SignalR
  public stopConnection() {
    this.hubConnection.stop().then(() => console.log('SignalR Disconnected!'));
  }
}