import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:5007';

  constructor(private http: HttpClient) {}

  /*----------------------------- Register --------------------------- */
  register(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/Auth/register`, payload);
  }

  /*----------------------------- Login --------------------------- */
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/Auth/login`, credentials);
  }

  /*----------------------------- Verify Email --------------------------- */
  verifyEmail(data: { email: string; token: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/Auth/confirm-email`, data);
  }

  /*----------------------------- Forget Password --------------------------- */
  forgetPassword(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/Auth/forget-password`, { email });
  }

  /*----------------------------- Reset Password --------------------------- */
  resetPassword(data: { email: string; newPassword: string; token: string }): Observable<any> {
    const payload = {
      email: data.email,
      newPassword: data.newPassword, 
      token: data.token
    };
    
    return this.http.post(`${this.baseUrl}/api/Auth/reset-password`, payload);
  }
}