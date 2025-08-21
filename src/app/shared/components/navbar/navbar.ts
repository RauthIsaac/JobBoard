import { Component, ElementRef, HostListener, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Footer } from "../footer/footer";
import { AuthService } from '../../../auth/auth-service';
import { ChatButton } from "../../../features/AIChat/chat-button/chat-button";
import { NotificationDto, NotificationService } from '../../../features/Notifications/notification-services';
import { Subscription } from 'rxjs';
import { CommonModule, NgIf } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Footer, MatSnackBarModule,ChatButton, CommonModule,NgIf],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit, OnDestroy {

  userType: string | null = null;
  displayName: string = 'User';
  isLoggedIn: boolean = false;

  notifications = signal<NotificationDto[]>([]);
  connectionStatus = signal<string>('Disconnected');
  unreadCount = signal<number>(0);
  isDropdownOpen = false;
  
  private subscriptions: Subscription[] = [];
  private notificationSound?: HTMLAudioElement;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private snackBar: MatSnackBar,
    private notificationService: NotificationService,
    private elementRef: ElementRef
  ) {
    this.initNotificationSound();
  }

  ngOnInit(): void {
    this.userType = this.authService.getUserType();
    this.displayName = this.buildDisplayName();
    this.isLoggedIn = this.authService.isLoggedIn();

    console.log('User Type:', this.userType);
    console.log('Display Name:', this.displayName);
    console.log('Is Logged In:', this.isLoggedIn);


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
        this.notificationSound = new Audio('/assets/sounds/notification.mp3');
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
        for (const notification of notifications) {
          if (notification.id) {
            await this.notificationService.deleteNotification(notification.id);
          }
        }
        // No reload; SignalR will handle updates
      } catch (error) {
        console.error('❌ Error clearing notifications:', error);
      }
    }

    async markAsRead(index: number) {
      const notification = this.notifications()[index];
      if (notification?.id && !notification.isRead) {
        await this.notificationService.markAsRead(notification.id);
        // No local update; SignalR handles it
      }
    }

    async markAllAsRead() {
      await this.notificationService.markAllAsRead();
      // No local update; SignalR handles it
    }

    async deleteNotification(index: number) {
      const notification = this.notifications()[index];
      if (notification?.id) {
        await this.notificationService.deleteNotification(notification.id);
        // No local update; SignalR handles it
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


  logout(): void {
    this.authService.clearAuthData();
    this.isLoggedIn = false;
    
    this.snackBar.open('Logged out successfully', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
    
    this.router.navigate(['/login']);
  }

  isEmployer(): boolean {
    return this.userType === 'Employer';
  }

  isSeeker(): boolean {
    return this.userType === 'Seeker';
  }

  private buildDisplayName(): string {
    const userName = this.authService.getUserName();
    const companyName = this.authService.getCompanyName();

    if (this.isEmployer()) {
      return companyName || 'Company';
    }

    if (this.isSeeker()) {
      return userName || 'User';
    }
       
    
    return 'User';
  }
}
