import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IPublicStats } from '../shared/models/IPublicStats';

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:5007/api/admin';

  getPublicStats(): Observable<IPublicStats> {
    return this.http.get<IPublicStats>(`${this.baseUrl}/home-stats`);
  }

  
}