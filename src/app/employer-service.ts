import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Employer {
  id: number;
  companyName: string;
  companyLocation: string;
  companyImage: string;
  website: string;
  industry: string;
  companyDescription: string;
  companyMission: string;
  employeeRange: string;
  establishedYear: number;
  email: string;
  phone: string;
  userId: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmployerService {
  private apiUrl = 'http://localhost:5007/api/Admin/employers';

  constructor(private http: HttpClient) { }

  /**
   * Fetches employer data from the API with an Authorization token.
   * @param token The authentication token.
   * @returns An Observable of an array of Employer objects.
   */
  getEmployers(token: string): Observable<Employer[]> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<Employer[]>(this.apiUrl, { headers });
  }
}
