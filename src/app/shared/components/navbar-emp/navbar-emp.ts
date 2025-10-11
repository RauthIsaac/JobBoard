import { Component, ElementRef, HostListener, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { AuthService } from '../../../auth/auth-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationDto, NotificationService } from '../../../features/Notifications/notification-services';
import { Subscription } from 'rxjs';
import { SnackbarService } from '../snackbar/snackbar-service';

@Component({
  selector: 'app-navbar-emp',
  imports: [CommonModule, FormsModule,RouterLink],
  templateUrl: './navbar-emp.html',
  styleUrl: './navbar-emp.css'
})
export class NavbarEmp implements OnInit, OnDestroy{

  isMobileView = false;
  
  constructor(private authService: AuthService, 
    private snackbarService: SnackbarService, 
    private router: Router,
    private notificationService: NotificationService,
    private elementRef: ElementRef) {
      this.initNotificationSound();
      this.checkMobileView();
  }

  @Input() toggleSidebar: () => void = () => {}; // Input to receive toggleSidebar from parent
  @Input() isSidebarOpen: boolean = true; // Input to receive sidebar state
  


  notifications = signal<NotificationDto[]>([]);
  connectionStatus = signal<string>('Disconnected');
  unreadCount = signal<number>(0);
  isDropdownOpen = false;
  
  private subscriptions: Subscription[] = [];
  private notificationSound?: HTMLAudioElement;

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
    
    this.showSuccess('Logged out successfully', 3000);
    
    this.router.navigate(['/login']);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkMobileView();
  }

  private checkMobileView() {
    this.isMobileView = window.innerWidth < 576;
  }




   //#region Snackbar Methods
  showSuccess(message: string = 'Operation successful!', duration: number = 4000, action: string = 'Undo'): void {
    console.log('Showing success snackbar');
    this.snackbarService.show({
      message,
      type: 'success',
      duration,
      action
    });
  }

  showInfo(message: string = 'Information message', duration: number = 5000): void {
    this.snackbarService.show({
      message,
      type: 'info',
      duration
    });
  }

  showError(message: string = 'Something went wrong!', duration: number = 5000): void {
    this.snackbarService.show({
      message,
      type: 'error',
      duration
    });
  }

  //#endregion  



}
