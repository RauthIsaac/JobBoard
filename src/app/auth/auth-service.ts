import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:5007';

  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_TYPE_KEY = 'user_type';
  private readonly USER_NAME_KEY = 'user_name';
  private readonly USER_EMAIL_KEY = 'user_email';

  /*---------------------------- Constructor ----------------------------*/
  constructor(private http: HttpClient) {}

  /*---------------------------- Register ----------------------------*/
  register(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/Auth/register`, payload);
  }

  /*---------------------------- Login ----------------------------*/
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/Auth/login`, credentials);
  }

  /*---------------------------- Save Token & UserName & Email ----------------------------*/
  saveAuthData(token: string, userType: string, userName?: string, userEmail?: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_TYPE_KEY, userType);
    if (userName) {
      localStorage.setItem(this.USER_NAME_KEY, userName);
    }
    if (userEmail) {
      localStorage.setItem(this.USER_EMAIL_KEY, userEmail);
    }
    console.log('Auth data saved:', {
      token,
      userType,
      userName,
      userEmail
    });

  }

  /*---------------------------- Get Token ----------------------------*/
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /*---------------------------- Get User Type ----------------------------*/
  getUserType(): string | null {
    return localStorage.getItem(this.USER_TYPE_KEY);
  }

  /*---------------------------- Get User Name ----------------------------*/
  getUserName(): string {
    return localStorage.getItem(this.USER_NAME_KEY) || 'User';
  }

    /*---------------------------- Get User Name ----------------------------*/
  private empData = signal<any>({});
  
  getCompanyName(): string{
    this.getEmployerProfile().subscribe({
      next: (data:any) => {
        this.empData.set(data);
      }
    });

    return this.empData().companyName || 'Company';
  }

  /*---------------------------- Get User Email ----------------------------*/
  getUserEmail(): string | null {
    return localStorage.getItem(this.USER_EMAIL_KEY);
  }

  /*---------------------------- Clear Token & UserName & Email ----------------------------*/
  clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_TYPE_KEY);
    localStorage.removeItem(this.USER_NAME_KEY);
    localStorage.removeItem(this.USER_EMAIL_KEY);
  }

  /*---------------------------- Check if logged in ----------------------------*/
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp < currentTime) {
        this.clearAuthData();
        return false;
      }
      
      return true;
    } catch {
      this.clearAuthData();
      return false;
    }
  }

  /*---------------------------- Verify Email ----------------------------*/
  verifyEmail(data: { email: string; token: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/Auth/confirm-email`, data);
  }

  /*---------------------------- Forget Password ----------------------------*/
  forgetPassword(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/Auth/forget-password`, { email });
  }

  /*---------------------------- Reset Password ----------------------------*/
  resetPassword(data: { email: string; newPassword: string; token: string }): Observable<any> {
    const payload = {
      email: data.email,
      newPassword: data.newPassword, 
      token: data.token
    };
    
    return this.http.post(`${this.baseUrl}/api/Auth/reset-password`, payload);
  }

  /*---------------------------- Get Seeker Profile ----------------------------*/
  getSeekerProfile(): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });

    return this.http.get(`${this.baseUrl}/api/Seeker/GetMyProfile`, { headers });
  }

  /*---------------------------- Get Employer Profile ----------------------------*/
  getEmployerProfile(): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });

    return this.http.get(`${this.baseUrl}/api/Employer/my-profile`, { headers });
  }

  /*---------------------------- Update Employer Profile ----------------------------*/
  updateEmployerProfile(profileData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json'
    });

    return this.http.put(`${this.baseUrl}/api/Employer`, profileData, { 
      headers,
      responseType: 'text' as 'json' // Handle plain text response
    });
  }

  /*---------------------------- Update Seeker Profile ----------------------------*/
  updateSeekerProfile(profileData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json'
    });

    return this.http.put(`${this.baseUrl}/api/Seeker`, profileData, { headers });
  }

}