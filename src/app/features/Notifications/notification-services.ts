import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './../../auth/auth-service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationServices {

  private baseURL = 'http://localhost:5007/api/Notifications';

  constructor(private http: HttpClient, private authService: AuthService) { }

  /*-------------------------Post Notification------------------------ */
  postNotification(notificationData: any) {
    const headers = { 'Authorization': `Bearer ${this.authService.getToken()}` };
    return this.http.post(`${this.baseURL}`, notificationData, { headers });
  }

  /*-------------------------Get Notifications------------------------ */
  userId: string = "6ebec717-a6cd-41c2-b091-f38ebbeb1368"; // Example user ID, replace with actual user ID as needed
  
  getNotifications() {
    const headers = { 'Authorization': `Bearer ${this.authService.getToken()}` };
    return this.http.get(`${this.baseURL}/User/${this.userId}`, { headers });
  }

  /*-----------------------------Mark as Read------------------------------- */
  markAsRead(id: number) {
    const headers = { 'Authorization': `Bearer ${this.authService.getToken()}` };
    return this.http.put(`${this.baseURL}/read/${this.userId}`, id , { headers });
  }


}
