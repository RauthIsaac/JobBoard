import { Component, OnInit, OnDestroy } from '@angular/core';
import { NotificationServices } from '../notification-services';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.html',
  styleUrl: './notification.css',
  imports: [CommonModule] // تأكدي من استيراد NotificationServices هنا
})
export class Notification implements OnInit, OnDestroy {
  notifications: any[] = []; // لتخزين الإشعارات
  private subscription!: Subscription;

  constructor(private notificationServices: NotificationServices) { }

  ngOnInit() {
    // الاشتراك في الإشعارات من SignalR
    this.subscription = this.notificationServices.getNotificationsObservable()
      .subscribe(notification => {
        console.log('New notification received:', notification);
        this.notifications.push(notification); // إضافة الإشعار للقائمة
      });

    // جلب الإشعارات القديمة من الـ API
    this.getNotifications();
  }

  ngOnDestroy() {
    // إلغاء الاشتراك عند تدمير الـ Component
    this.subscription.unsubscribe();
    this.notificationServices.stopConnection();
  }

  /*-------------------------Send Notification------------------------ */
  sendNotification() {
    const notificationData = {
      userId: "6ebec717-a6cd-41c2-b091-f38ebbeb1368",
      message: "Hello srsr",
      link: null // إضافة link إذا كنتِ عايزة
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
        // تحديث حالة الإشعار في الواجهة
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
          notification.isRead = true;
        }
      },
      error: (error: any) => {
        console.error('Error marking notification as read:', error);
      }
    });
  }
}