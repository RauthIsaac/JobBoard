import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

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
  phoneNumber?: string;
  companyName?: string;
  website?: string;
  description?: string;
  location?: string;
  industry?: string;
  companySize?: string;
  logoUrl?: string;
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
  employer: {
    id: number;
    name: string;
    companyName: string;
    email: string;
    phoneNumber?: string;
    website?: string;
    logoUrl?: string;
  };
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
  private readonly adminToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6ImViY2ZmODgxLTk0NmEtNDgzMi1iYjk4LTgyNzVjMmZhYmZmZCIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJhZG1pbiIsImp0aSI6IjhmNzhlNGY2LWNmNmQtNDIyMS04YjMzLWQ4NzljODFmZDkzYiIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFkbWluIiwiZXhwIjoxNzU2NDQxMDcwLCJpc3MiOiJKb2JCb2FyZEFQSSIsImF1ZCI6IkpvYkJvYXJkVXNlciJ9.EbVStP7UOMgZMLykJVTrMYqJktCgTMryZGH9rwAomGw";

  constructor(private http: HttpClient) {
    this.saveToken(this.adminToken);
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private handleError = (error: any) => {
    console.error('API Error:', error);
    
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
  saveToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('authToken');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Math.floor(Date.now() / 1000);
    } catch {
      return false;
    }
  }

  logout(): void {
    localStorage.removeItem('authToken');
  }

  // API calls
  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.baseUrl}/stats`, { headers: this.getHeaders() })
      .pipe(
        tap(stats => console.log('Stats loaded:', stats)),
        catchError(this.handleError)
      );
  }

  getAllSeekers(): Observable<Seeker[]> {
    return this.http.get<Seeker[]>(`${this.baseUrl}/seekers`, { headers: this.getHeaders() })
      .pipe(
        tap(seekers => console.log('Seekers loaded:', seekers)),
        catchError(this.handleError)
      );
  }

  getAllEmployers(): Observable<Employer[]> {
    return this.http.get<Employer[]>(`${this.baseUrl}/employers`, { headers: this.getHeaders() })
      .pipe(
        tap(employers => console.log('Employers loaded:', employers)),
        catchError(this.handleError)
      );
  }

  getAllJobs(): Observable<Job[]> {
    return this.http.get<Job[]>(`${this.baseUrl}/jobs`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  getPendingJobs(): Observable<Job[]> {
    return this.http.get<Job[]>(`${this.baseUrl}/jobs/pending`, { headers: this.getHeaders() })
      .pipe(
        tap(jobs => console.log('Pending jobs loaded:', jobs.length)),
        catchError(this.handleError)
      );
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