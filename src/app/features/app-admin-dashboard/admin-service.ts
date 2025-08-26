import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../auth/auth-service';

export interface Seeker {
  id: number;
  userId: string;
  name: string;
  email: string;
  phoneNumber: string;
  title: string | null;
  dateOfBirth: string | null;
  address: string | null;
  cV_Url: string | null;
  gender: string | null;
  summary: string | null;
  profileImageUrl: string | null;
  certificateName: string[];
  trainingName: string[];
  interestName: string[];
  skillName: string[];
}

export interface Employer {
  id: number;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  website?: string;
  companyDescription?: string;
  companyLocation?: string;
  industry?: string;
  employeeRange?: string;
  companyImage?: string;
}

export interface Job {
  id: number;
  title: string;
  description: string;
  requirements: string;
  salary: number;
  location: string;
  employmentType: string;
  postedDate: Date;
  isApproved: boolean;
  companyName?: string;
  companyImage?: string;
  email: string;
  phone?: string;
  website?: string;
  jobType?: string;
}

export interface AdminStats {
  totalSeekers: number;
  totalEmployers: number;
  totalJobs: number;
  pendingJobs: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly baseUrl = 'http://localhost:5007/api/Admin';
  // private readonly adminToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjM5MTU4ZDMwLTQ0YzYtNDVhMy1hYzVmLWEyNDQ4ZDhjYzlhZCIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJhZG1pbiIsImp0aSI6IjhkMzBiZmJjLWJjZWYtNGJkZi05YmQ1LTBjOTcyMGFhZjdlNiIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFkbWluIiwiZXhwIjoxNzU2NTg1NjU2LCJpc3MiOiJKb2JCb2FyZEFQSSIsImF1ZCI6IkpvYkJvYXJkVXNlciJ9.H2xrqNf8e2oxphzX3dScCc5SvsT0XbAnYARmd58FPWc";

  constructor(
    private http: HttpClient,    
     private authService: AuthService) {
   
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
  

  private handleError = (error: any) => {
    const errorMessages = {
      0: 'Cannot connect to server. Please check if the server is running.',
      401: 'Authentication failed. Please login again.',
      403: 'Access denied. Insufficient permissions.',
      404: 'Resource not found.',
      500: 'Server error. Please try again later.'
    };
    
    const message = errorMessages[error.status as keyof typeof errorMessages] || 
                   error.error?.message || 
                   error.message || 
                   'An unexpected error occurred';
    
    return throwError(() => new Error(message));
  };

  // Authentication methods
  // saveToken(token: string): void {
  //   localStorage.setItem('authToken', token);
  // }

  isLoggedIn(): boolean {
    const token = this.authService.getToken();
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Math.floor(Date.now() / 1000);
    } catch {
      return false;
    }
  }

  // API calls
  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.baseUrl}/stats`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  getAllSeekers(): Observable<Seeker[]> {
    return this.http.get<Seeker[]>(`${this.baseUrl}/seekers`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  getSeekerById(seekerId: string): Observable<Seeker> {
    return this.http.get<Seeker>(`${this.baseUrl}/seeker/${seekerId}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  getAllEmployers(): Observable<Employer[]> {
    return this.http.get<Employer[]>(`${this.baseUrl}/employers`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  getEmployerById(employerId: string): Observable<Employer> {
    return this.http.get<Employer>(`${this.baseUrl}/employer/${employerId}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  getPendingJobs(): Observable<Job[]> {
    return this.http.get<Job[]>(`${this.baseUrl}/jobs/pending`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  approveJob(jobId: number): Observable<string> {
    return this.http.put(`${this.baseUrl}/jobs/${jobId}/approve`, {}, {
      headers: this.getHeaders(),
      responseType: 'text'
    }).pipe(catchError(this.handleError));
  }

  rejectJob(jobId: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/jobs/${jobId}/reject`, {
      headers: this.getHeaders(),
      responseType: 'text'
    }).pipe(catchError(this.handleError));
  }

  deleteUser(userId: string): Observable<string> {
    return this.http.delete(`${this.baseUrl}/user/${userId}`, {
      headers: this.getHeaders(),
      responseType: 'text'
    }).pipe(catchError(this.handleError));
  }
}