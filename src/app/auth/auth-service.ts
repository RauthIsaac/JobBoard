import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:5007';

  constructor(private http: HttpClient) {}

  register(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/Auth/register`, payload);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/Auth/login`, credentials);
  }

  verifyEmail(data: { email: string; token: string }): Observable<any> {
    // التأكد من استخدام baseUrl بشكل صحيح
    return this.http.post(`${this.baseUrl}/api/Auth/confirm-email`, data);
  }
}


