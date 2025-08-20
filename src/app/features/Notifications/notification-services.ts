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
        accessTokenFactory: () => this.authService.getToken() ?? '' // إضافة الـ JWT token للتوثيق
      })
      .build();

    // بدء الاتصال بـ SignalR
    this.startConnection();

    // الاستماع للإشعارات من الـ Hub
    this.hubConnection.on('ReceiveNotification', (message: string, link: string | null) => {
      const notification = {
        message,
        link,
        isRead: false // افتراضي، لأن الإشعار الجديد بيكون غير مقروء
      };
      this.notificationSubject.next(notification);
    });
  }

  // بدء الاتصال بـ SignalR
  private startConnection() {
    this.hubConnection
      .start()
      .then(() => console.log('SignalR Connected!'))
      .catch(err => console.error('Error connecting to SignalR:', err));
  }

  // إرجاع Observable للإشعارات
  public getNotificationsObservable(): Observable<any> {
    return this.notificationSubject.asObservable();
  }
// `Bearer ${this.authService.getToken()}`
  // إرسال إشعار باستخدام HTTP
  postNotification(notificationData: any) {
    const headers = { 'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6ImEzZWRmOWJiLWYyYzItNDRhNS04MzgxLWIyZDQ2NTUyNjIxOCIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJlbXBsb3llcjEiLCJqdGkiOiJlNTUwNmU4Ni1iY2ZhLTRiMzQtOWEyYS1hOTNmYmE4YzNmNTAiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJFbXBsb3llciIsImV4cCI6MTc1NjI5NjA1NywiaXNzIjoiSm9iQm9hcmRBUEkiLCJhdWQiOiJKb2JCb2FyZFVzZXIifQ.u7EZWBR0iuE-uPwp9ZKQSjjkL6fUnln8Xi9UEu4_Pl8` };
    return this.http.post(`${this.baseURL}`, notificationData, { headers });
  }

  // جلب الإشعارات القديمة باستخدام HTTP
  userId: string = "f810fb62-7284-4dd2-8027-807036a276d7";
  getNotifications() {
    const headers = { 'Authorization': `Bearer ${this.authService.getToken()}` };
    return this.http.get(`${this.baseURL}/user/${this.userId}`, { headers });
  }

  // تحديد الإشعار كـ مقروء
  markAsRead(id: number) {
    const headers = { 'Authorization': `Bearer ${this.authService.getToken()}` };
    return this.http.put(`${this.baseURL}/read/${id}`, {}, { headers });
  }

  // إيقاف الاتصال بـ SignalR (اختياري)
  public stopConnection() {
    this.hubConnection.stop().then(() => console.log('SignalR Disconnected!'));
  }
}