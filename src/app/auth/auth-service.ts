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
  private readonly User_ID = 'user-id';

  // ================= Cached values =================
  private cachedUserName: string | null = null;
  private cachedUserType: string | null = null;
  private empData = signal<any>({});
  private isEmployerProfileLoaded = false;

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
  saveAuthData(token: string, userType: string, userName?: string, userEmail?: string, userId?: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_TYPE_KEY, userType);
    if (userName) {
      localStorage.setItem(this.USER_NAME_KEY, userName);
      this.cachedUserName = userName; // update cache
    }
    if (userEmail) {
      localStorage.setItem(this.USER_EMAIL_KEY, userEmail);
    }
    if(userId){
      localStorage.setItem(this.User_ID, userId);
    }
    this.cachedUserType = userType; // update cache

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
    getUserId(): string |null {
      return localStorage.getItem(this.User_ID)
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
  //#region Employer Profile Methods
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
      // Don't set Content-Type for FormData, let browser set it with boundary
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
  //#region Seeker Profile Methods

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
      headers,
      responseType: 'text' as 'json'
    });
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

  //#endregion Seeker Profile Methods

}