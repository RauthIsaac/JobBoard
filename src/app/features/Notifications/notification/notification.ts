import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationDto, NotificationService } from '../notification-services';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.html',
  styleUrls: ['./notification.css']
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications = signal<NotificationDto[]>([]);
  connectionStatus = signal<string>('Disconnected');
  unreadCount = signal<number>(0);
  isDropdownOpen = false;
  
  private subscriptions: Subscription[] = [];
  private notificationSound?: HTMLAudioElement;

  constructor(
    private notificationService: NotificationService,
    private elementRef: ElementRef
  ) {
    this.initNotificationSound();
  }

  ngOnInit() {
    this.subscribeToNotifications();
    this.subscribeToRealTimeNotifications();
    this.subscribeToConnectionStatus();
    this.subscribeToUnreadCount();
    this.requestNotificationPermission();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: Event) {
    if (this.isDropdownOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
    }
  }

  private initNotificationSound() {
    try {
      this.notificationSound = new Audio('sounds/notification.mp3');
      this.notificationSound.volume = 0.5;
    } catch (error) {
      console.warn('Could not initialize notification sound:', error);
    }
  }

  private subscribeToNotifications() {
    this.subscriptions.push(
      this.notificationService.notifications.subscribe(notifications => {
        this.notifications.set(notifications);
      })
    );
  }

  private subscribeToUnreadCount() {
    this.subscriptions.push(
      this.notificationService.unreadCount.subscribe(count => this.unreadCount.set(count))
    );
  }

  private subscribeToRealTimeNotifications() {
    this.subscriptions.push(
      this.notificationService.notificationReceived.subscribe(notification => {
        this.playNotificationSound();
        this.showBrowserNotification(notification.message);
      })
    );
  }

  private subscribeToConnectionStatus() {
    this.subscriptions.push(
      this.notificationService.connectionStatus.subscribe(status => {
        this.connectionStatus.set(status);
        if (status === 'Connected') {
          setTimeout(() => this.notificationService.loadUserNotifications(), 1000);
        }
      })
    );
  }

  private playNotificationSound() {
    this.notificationSound?.play().catch(error => console.warn('Could not play sound:', error));
  }

  private showBrowserNotification(message: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notif = new Notification('Job Board Notification', {
        body: message,
        icon: '/assets/icons/notification-icon.png',
        tag: 'job-board-notification'
      });
      setTimeout(() => notif.close(), 5000);
    }
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

  reconnect() {
    this.notificationService.reconnect();
  }

  async clearNotifications() {
    try {
      const notifications = this.notifications();
      
      // Update local state immediately
      this.notifications.set([]);
      this.unreadCount.set(0);
      
      // Then sync with server
      for (const notification of notifications) {
        if (notification.id) {
          await this.notificationService.deleteNotification(notification.id);
        }
      }
    } catch (error) {
      console.error('❌ Error clearing notifications:', error);
    }
  }

  async markAsRead(index: number) {
    const notification = this.notifications()[index];
    if (notification?.id && !notification.isRead) {
      // Update local state immediately
      const updatedNotifications = [...this.notifications()];
      updatedNotifications[index] = { ...notification, isRead: true };
      this.notifications.set(updatedNotifications);
      this.unreadCount.set(this.unreadCount() - 1);
      
      // Then sync with server
      await this.notificationService.markAsRead(notification.id);
    }
  }

  async markAllAsRead() {
    // Update local state immediately
    const updatedNotifications = this.notifications().map(n => ({ ...n, isRead: true }));
    this.notifications.set(updatedNotifications);
    this.unreadCount.set(0);
    
    // Then sync with server
    await this.notificationService.markAllAsRead();
  }

  async deleteNotification(index: number) {
    const notification = this.notifications()[index];
    if (notification?.id) {
      // Update local state immediately
      const updatedNotifications = this.notifications().filter((_, i) => i !== index);
      this.notifications.set(updatedNotifications);
      if (!notification.isRead) {
        this.unreadCount.set(this.unreadCount() - 1);
      }
      
      // Then sync with server
      await this.notificationService.deleteNotification(notification.id);
    }
  }

  viewNotification(link: string) {
    if (link) window.open(link, '_blank');
  }

  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => console.log('Notification permission:', permission));
    }
  }

  getTimeDifference(createdAt: Date | string | null | undefined): string {
    if (!createdAt) {
      console.warn('createdAt is undefined or null, using current date');
      return 'now';
    }

    const notificationTime = createdAt instanceof Date ? createdAt : new Date(createdAt);
    
    if (isNaN(notificationTime.getTime())) {
      console.warn('Invalid createdAt date:', createdAt, 'Type:', typeof createdAt);
      return 'Unknown time';
    }

    const now = new Date();
    const diffMs = now.getTime() - notificationTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'now';
    if (diffMinutes < 60) return `${diffMinutes} m`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} d`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks} w`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} m`;
  }

  async refreshNotifications() {
    await this.notificationService.loadUserNotifications();
  }


}