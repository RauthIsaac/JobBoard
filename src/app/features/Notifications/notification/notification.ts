import { Component, OnInit, OnDestroy } from '@angular/core';
import { NotificationServices } from '../notification-services';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.html',
  styleUrl: './notification.css',
  imports: [CommonModule]
})
export class Notification implements OnInit, OnDestroy {
  notifications: any[] = [];
  private subscription!: Subscription;

  constructor(private notificationServices: NotificationServices, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    // الاشتراك في الإشعارات من SignalR
    this.subscription = this.notificationServices.getNotificationsObservable()
      .subscribe(notification => {
        console.log('New notification received via SignalR:', notification);
        // منع التكرار لو الإشعار موجود بالفعل
        if (!this.notifications.some(n => n.id === notification.id && n.id !== null)) {
          this.notifications.push(notification);
        }
        this.cdr.detectChanges(); // تحديث الـ UI
      });

    // جلب الإشعارات القديمة من الـ API
    this.getNotifications();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.notificationServices.stopConnection();
  }

  /*-------------------------Send Notification------------------------ */
  sendNotification() {
    const notificationData = {
      userId: "f810fb62-7284-4dd2-8027-807036a276d7",
      message: "Hello srsr",
      link: null
    };

    this.notificationServices.postNotification(notificationData).subscribe({
      next: (response: any) => {
        console.log('Notification sent successfully:', response);
      },
      error: (error: any) => {
        console.error('Error sending notification:', error);
      }
    });
  }

  /*-------------------------Get Notifications------------------------ */
  getNotifications() {
    this.notificationServices.getNotifications().subscribe({
      next: (response: any) => {
        console.log('Notifications retrieved successfully:', response);
        this.notifications = response; // تخزين الإشعارات القديمة
        console.log('Updated notifications array:', this.notifications);
        this.cdr.detectChanges(); // تحديث الـ UI
      },
      error: (error: any) => {
        console.error('Error retrieving notifications:', error);
      }
    });
  }

  /*-------------------------Mark as Read------------------------ */
  markAsRead(notificationId: number) {
    this.notificationServices.markAsRead(notificationId).subscribe({
      next: (response: any) => {
        console.log('Notification marked as read successfully:', response);
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
          notification.isRead = true;
          this.cdr.detectChanges();
        }
      },
      error: (error: any) => {
        console.error('Error marking notification as read:', error);
      }
    });
  }
}