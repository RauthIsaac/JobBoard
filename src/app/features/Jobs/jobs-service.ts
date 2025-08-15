import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, signal, effect } from '@angular/core';
import { IJob } from '../../shared/models/ijob';
import { JobDetails } from './job-details/job-details';
import { ISkill } from '../../shared/models/iskill';
import { ICategory } from '../../shared/models/icategory';
import { JobFilterParams } from '../../shared/models/job-filter-params';
import { Observable, map, tap } from 'rxjs';
import { AuthService } from '../../auth/auth-service';

export interface SavedJobsFilterParams {
  searchValue?: string;
  SortingOption?: 'DateAsc' | 'DateDesc';
}

@Injectable({
  providedIn: 'root'
})
export class JobsService {

  /*------------------------ Saved Jobs State ---------------------------- */
  public savedJobsState = signal<number[]>([]);
  
  /*------------------------ Constructor ---------------------------- */
  constructor(private http: HttpClient , private authService: AuthService) {
    // Load saved jobs on service initialization
    this.loadSavedJobs();

    effect(() => {
      this.GetAllJobs();
    });
  }
  
  /*---------------------------- API URL ---------------------------- */
  private apiUrl = 'http://localhost:5007/api/Jobs';

  /*--------------------------- Jobs List Signal ----------------------------- */
  public JobsList = signal<IJob[]>([]);
  public isLoading = signal<boolean>(false);
  public error = signal<string | null>(null);

  /*--------------------------- Get All Jobs (without filters) ----------------------------- */
  GetAllJobs(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<IJob[]>(this.apiUrl).subscribe({
      next: (jobs) => {
        this.JobsList.set(Array.isArray(jobs) ? jobs : []);
        this.isLoading.set(false);
        console.log("Loaded Jobs:", this.JobsList());
      },
      error: (error) => {
        console.error('Error loading jobs:', error);
        this.error.set('Failed to load jobs');
        this.isLoading.set(false);
        this.JobsList.set([]);
      }
    });
  }

  /*--------------------------- Get Filtered Jobs (Debug Version) ----------------------------- */
  GetFilteredJobs(filters: JobFilterParams): void {
    console.log('GetFilteredJobs called with filters:', filters);
    
    this.isLoading.set(true);
    this.error.set(null);

    let params = new HttpParams();

    // Add filter parameters if they exist
    if (filters.searchValue && filters.searchValue.trim()) {
      params = params.set('searchValue', filters.searchValue.trim());
      console.log('Added searchValue param:', filters.searchValue.trim());
    }
    
    if (filters.categoryId && filters.categoryId > 0) {
      params = params.set('categoryId', filters.categoryId.toString());
      console.log('Added categoryId param:', filters.categoryId.toString());
    }
    
    if (filters.skillId) {
      params = params.set('skillId', filters.skillId.toString());
      console.log('Added skillId param:', filters.skillId.toString());
    }
    
    if (filters.employerId) {
      params = params.set('employerId', filters.employerId.toString());
      console.log('Added employerId param:', filters.employerId.toString());
    }
    
    if (filters.workplaceType && filters.workplaceType.trim()) {
      params = params.set('workplaceType', filters.workplaceType);
      console.log('Added workplaceType param:', filters.workplaceType);
    }
    
    if (filters.jobType && filters.jobType.trim()) {
      params = params.set('jobType', filters.jobType);
      console.log('Added jobType param:', filters.jobType);
    }
    
    if (filters.experienceLevel && filters.experienceLevel.trim()) {
      params = params.set('experienceLevel', filters.experienceLevel);
      console.log('Added experienceLevel param:', filters.experienceLevel);
    }
    
    if (filters.educationLevel && filters.educationLevel.trim()) {
      params = params.set('educationLevel', filters.educationLevel);
      console.log('Added educationLevel param:', filters.educationLevel);
    }
    
    if (filters.isActive !== undefined) {
      params = params.set('isActive', filters.isActive.toString());
      console.log('Added isActive param:', filters.isActive.toString());
    }
    
    if (filters.sortingOption !== undefined) {
      params = params.set('sortingOption', filters.sortingOption.toString());
      console.log('Added sortingOption param:', filters.sortingOption.toString());
    }
    console.log('Final HTTP params:', params.toString());
    console.log('Full API URL will be:', `${this.apiUrl}?${params.toString()}`);

    this.http.get<IJob[]>(this.apiUrl, { params }).subscribe({
      next: (jobs) => {
        console.log('API Response received:', jobs);
        this.JobsList.set(Array.isArray(jobs) ? jobs : []);
        this.isLoading.set(false);
        console.log("Filtered Jobs loaded:", this.JobsList().length, "jobs");
      },
      error: (error) => {
        console.error('Error loading filtered jobs:', error);
        console.error('Error details:', {
          status: error.status,
          message: error.message,
          url: error.url
        });
        this.error.set('Failed to load filtered jobs');
        this.isLoading.set(false);
        this.JobsList.set([]);
      }
    });
  }

  /*-------------------------- Get Job Details ------------------------------ */
  GetJobDetails(jobID: number):any {
    return this.http.get(`${this.apiUrl}/${jobID}`);
  }

  /*-------------------------- Post New Job ------------------------------ */
  createJob(jobData: any): any {
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjRjNGZjYzlkLWJiZTUtNDMyOC05MWY1LTk0ZDczYWQwNGJhMiIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJUZWNoU29sdXRpb25zTHRkIiwianRpIjoiNjc1MzZmYjgtMjhkMi00YzUyLTk2N2ItMTQyMTExN2Q3ODA0IiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiRW1wbG95ZXIiLCJleHAiOjE3NTUzMjU2MzksImlzcyI6IkpvYkJvYXJkQVBJIiwiYXVkIjoiSm9iQm9hcmRVc2VyIn0.i9zQ5XBxFmtJO1FJNivBvfbdgJBgCnUiks7cnc-Vwnk"; 
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const newJob = this.http.post<IJob>(this.apiUrl, jobData, {headers});
    
    return newJob;
  }

  /*-------------------------- Get All Jobs Skills ------------------------------ */
  GetAllJobsSkills(): any {
    return this.http.get<ISkill[]>(`${this.apiUrl}/skills`);
  }

  /*-------------------------- Get All Jobs Categories ------------------------------ */
  GetAllJobsCategories(): any {
    return this.http.get<ICategory[]>(`${this.apiUrl}/categories`);
  }

  /*-------------------------- Saved Jobs ------------------------------ */
  private savedJobsUrl = 'http://localhost:5007/api/SavedJob';
  private isSavedJobUrl = 'http://localhost:5007/api/SavedJob/issaved' 

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
  }

  /*-------------------------- Get Saved Jobs (with filters) ------------------------------ */
  getSavedJobs(filters?: SavedJobsFilterParams): Observable<IJob[]> {
    let params = new HttpParams();
    
    if (filters?.searchValue && filters.searchValue.trim()) {
      params = params.set('searchValue', filters.searchValue.trim());
    }
    
    if (filters?.SortingOption) {
      params = params.set('SortingOption', filters.SortingOption);
    }


    return this.http.get<IJob[]>(this.savedJobsUrl, { 
      headers: this.getAuthHeaders(),
      params 
    });
  }

  /*-------------------------- Add to Saved Jobs ------------------------------ */
  addToSavedJobs(jobId: number): Observable<any> {
    return this.http.post(
      `${this.savedJobsUrl}`,
      {"jobId": jobId},
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(() => {
        // Update the savedJobsState signal
        const currentSaved = this.savedJobsState();
        if (!currentSaved.includes(jobId)) {
          this.savedJobsState.set([...currentSaved, jobId]);
        }
      })
    );
  }

  /*-------------------------- Remove from Saved Jobs ------------------------------ */
  removeFromSavedJobs(jobId: number): Observable<any> {
    return this.http.delete(`${this.savedJobsUrl}/${jobId}`, { headers: this.getAuthHeaders() }).pipe(
      tap(() => {
        // Update the savedJobsState signal
        const currentSaved = this.savedJobsState();
        this.savedJobsState.set(currentSaved.filter(id => id !== jobId));
      })
    );
  }

  /*-------------------------- Check if saved ------------------------------ */
  isSaved(jobId: number): Observable<boolean> {
    // First check local state, then fallback to API
    const isInLocalState = this.savedJobsState().includes(jobId);
    if (isInLocalState) {
      return new Observable(observer => {
        observer.next(true);
        observer.complete();
      });
    }
    
    return this.http.get<boolean>(`${this.isSavedJobUrl}/${jobId}`, { headers: this.getAuthHeaders() });
  }

  /*-------------------------- Load Saved Jobs State ------------------------------ */
  loadSavedJobs(): void {
    this.getSavedJobs().subscribe({
      next: (jobs) => {
        const ids = jobs.map(j => j.id);
        this.savedJobsState.set(ids);
        console.log('Loaded saved jobs IDs:', ids);
      },
      error: (err) => {
        console.error('Error loading saved jobs', err);
        this.savedJobsState.set([]);
      }
    });
  }

  /*-------------------------- Check if job is saved (synchronous) ------------------------------ */
  isJobSaved(jobId: number): boolean {
    return this.savedJobsState().includes(jobId);
  }
}