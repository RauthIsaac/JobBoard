import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:5007';

  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_TYPE_KEY = 'user_type';
  private readonly USER_NAME_KEY = 'user_name';
  private readonly USER_EMAIL_KEY = 'user_email';
  private readonly User_ID = 'user-id';

  // ================= Default Profile Image =================
  private readonly DEFAULT_PROFILE_IMAGE = '/user.jpg';

  // ================= Cached values =================
  private cachedUserName: string | null = null;
  private cachedUserType: string | null = null;
  private empData = signal<any>({});
  private isEmployerProfileLoaded = false;

  constructor(private http: HttpClient) {
    this.initializeUserId();
  }

  /*---------------------------- Register ----------------------------*/
  register(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/Auth/register`, payload);
  }

  /*---------------------------- Login ----------------------------*/
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/Auth/login`, credentials);
  }

  /*---------------------------- Save Token & UserName & Email ----------------------------*/
  saveAuthData(token: string, userType: string, userName?: string, userEmail?: string, userId?: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_TYPE_KEY, userType);
    if (userName) {
      localStorage.setItem(this.USER_NAME_KEY, userName);
      this.cachedUserName = userName;
    }
    if (userEmail) {
      localStorage.setItem(this.USER_EMAIL_KEY, userEmail);
    }
    if(userId){
      localStorage.setItem(this.User_ID, userId);
    }
    this.cachedUserType = userType;

    console.log('Auth data saved:', {
      token,
      userType,
      userName,
      userEmail,
      userId
    });
  }

  /*---------------------------- Get Token ----------------------------*/
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /*---------------------------- Get userId ----------------------------*/
  private currentUserId = new BehaviorSubject<string>('');

  private initializeUserId(): void {
    // Try to get userId from localStorage
    const storedUserId = localStorage.getItem('userId');
    
    if (storedUserId) {
      this.currentUserId.next(storedUserId);
    } else {
      // Or extract from JWT token if you're using tokens
      const token = localStorage.getItem('authToken');
      if (token) {
        const userId = this.extractUserIdFromToken(token);
        if (userId) {
          this.currentUserId.next(userId);
        }
      }
    }
  }

  // Method to get current userId (synchronous)
  getUserId(): string {
    return this.currentUserId.value;
  }

  // Method to get userId as Observable (reactive)
  getUserId$(): Observable<string> {
    return this.currentUserId.asObservable();
  }

  // Method to set userId (called after successful login)
  setUserId(userId: string): void {
    this.currentUserId.next(userId);
    localStorage.setItem('userId', userId); // Persist to storage
  }

  // Helper method to extract userId from JWT token
  private extractUserIdFromToken(token: string): string | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.userId || payload.id || null;
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  }

  // Method to clear userId (called on logout)
  clearUserId(): void {
    this.currentUserId.next('');
    localStorage.removeItem('userId');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getUserId() !== '';
  }

  /*---------------------------- Get User Name ----------------------------*/
  getUserName(): string {
    if (this.cachedUserName === null) {
      this.cachedUserName = localStorage.getItem(this.USER_NAME_KEY) || 'User';
    }
    return this.cachedUserName;
  }

  /*---------------------------- Get User Type ----------------------------*/
  getUserType(): string | null {
    if (this.cachedUserType === null) {
      this.cachedUserType = localStorage.getItem(this.USER_TYPE_KEY);
    }
    return this.cachedUserType;
  }

  /*---------------------------- Get Company Name ----------------------------*/
  getCompanyName(): string {
    if (!this.isEmployerProfileLoaded) {
      this.isEmployerProfileLoaded = true;

      this.getEmployerProfile().subscribe({
        next: (data: any) => {
          this.empData.set(data);
        },
        error: (err) => {
          console.error('Error loading employer profile for company name:', err);
        }
      });
    }

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
    this.cachedUserName = null;
    this.cachedUserType = null;
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

  /********************************************************************/
  /*------------------- Employer Profile Methods -----------------------*/
  /*---------------------------- Get Employer Profile ----------------------------*/
  getEmployerProfile(): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });

    return this.http.get(`${this.baseUrl}/api/Employer/my-profile`, { headers });
  }

  /*---------------------------- Update Employer Profile ----------------------------*/
  updateEmployerProfile(profileData: any, imageFile?: File): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });

    const formData = new FormData();
    Object.keys(profileData).forEach(key => {
      if (profileData[key] !== null && profileData[key] !== undefined) {
        formData.append(key, profileData[key].toString());
      }
    });
    
    if (imageFile) {
      formData.append('companyImage', imageFile);
    }

    return this.http.put(`${this.baseUrl}/api/Employer`, formData, { 
      headers,
      responseType: 'text' as 'json'
    });
  }

  /********************************************************************/
  /*------------------- Seeker Profile Methods -----------------------*/
  /*---------------------------- Get Seeker Profile ----------------------------*/
  getSeekerProfile(): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });

    return this.http.get(`${this.baseUrl}/api/Seeker/GetMyProfile`, { headers });
  }

  /*---------------------------- Update Seeker Profile ----------------------------*/
  updateSeekerProfile(profileData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json'
    });

    return this.http.put(`${this.baseUrl}/api/Seeker`, profileData, { headers });
  }

  /*---------------------------- Upload Profile Image ----------------------------*/
  uploadProfileImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('ProfileImageUrl', file);
    formData.append('RemoveProfileImage', 'false');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });

    return this.http.post(`${this.baseUrl}/api/Seeker/upload-files`, formData, { headers });
  }

  /*---------------------------- Delete Profile Image ----------------------------*/
  deleteProfileImage(): Observable<any> {
    const formData = new FormData();
    formData.append('RemoveProfileImage', 'true');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });

    return this.http.post(`${this.baseUrl}/api/Seeker/upload-files`, formData, { 
      headers
    });
  }

  /*---------------------------- Get Default Profile Image ----------------------------*/
  getDefaultProfileImage(): string {
    return this.DEFAULT_PROFILE_IMAGE;
  }

  /*---------------------------- Upload Resume ----------------------------*/
  uploadResume(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('CV_Url', file);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });

    return this.http.post(`${this.baseUrl}/api/Seeker/upload-files`, formData, { headers });
  }

  /*---------------------------- Delete Resume ----------------------------*/
  deleteResume(): Observable<any> {
    const formData = new FormData();
    formData.append('RemoveCV', 'true');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });

    return this.http.post(`${this.baseUrl}/api/Seeker/upload-files`, formData, { 
      headers,
      responseType: 'text' as 'json'
    });
  }

  /*---------------------------- Get Resume URL ----------------------------*/
  getResumeUrl(): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });

    return this.http.get(`${this.baseUrl}/api/Seeker/resume-url`, { headers });
  }
}