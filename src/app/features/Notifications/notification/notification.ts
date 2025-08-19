import { Component } from '@angular/core';
import { CdkAutofill } from "@angular/cdk/text-field";
import { NotificationServices } from '../notification-services';

@Component({
  selector: 'app-notification',
  imports: [],
  templateUrl: './notification.html',
  styleUrl: './notification.css'
})
export class Notification {

  constructor(private notificationServices: NotificationServices) { }



  /*-------------------------Send Notification------------------------ */
  sendNotification(){
    const notificationData = {
      userId:"6ebec717-a6cd-41c2-b091-f38ebbeb1368",
      message : "Hello srsr"
    };

    this.notificationServices.postNotification(notificationData).subscribe({
      next: (response:any) => {
        console.log('Notification sent successfully:', response);
        console.log('Notification data:', notificationData);
      },
      error: (error:any) => {
        console.error('Error sending notification:', error);
      }
    });
  }

  /*-------------------------Get Notifications------------------------ */
  getNotifications() {
    this.notificationServices.getNotifications().subscribe({
      next: (response:any) => {
        console.log('Notifications retrieved successfully:', response);
      },
      error: (error:any) => {
        console.error('Error retrieving notifications:', error);
      }
    });
  }

  /**/
  markAsRead(notificationId: number){
    this.notificationServices.markAsRead(notificationId).subscribe({
      next: (response:any) => {
        console.log('Notification marked as read successfully:', response);
      },
      error: (error:any) => {
        console.error('Error marking notification as read:', error);
      }
    });
  }

}
