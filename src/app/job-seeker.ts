import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Seeker } from './admin-dashboard-analytics/admin-dashboard-analytics';

@Injectable({
  providedIn: 'root'
})
export class JobSeekerService {
  private apiUrl = 'http://localhost:5007/api/Admin/seekers';

  constructor(private http: HttpClient) { }
  
  /**
   * Fetches job seeker data from the API with an Authorization token.
   * @param token The authentication token.
   * @returns An Observable of an array of Job Seeker objects.
   */
  getJobSeekers(token: string): Observable<Seeker[]> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<Seeker[]>(this.apiUrl, { headers });
  }
}
