import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { IJob } from '../../shared/models/ijob';
import { ISkill } from '../../shared/models/iskill';
import { ICategory } from '../../shared/models/icategory';
import { JobFilterParams } from '../../shared/models/job-filter-params';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuthService } from '../../auth/auth-service';


export interface SavedJobsFilterParams {
  searchValue?: string;
  SortingOption?: 'DateAsc' | 'DateDesc';
}

export interface EmployerJobFilterParams {
  status?: 'Active' | 'Filled' | 'Expired';
  sortingOption?: 'PostedDateDesc' | 'PostedDateAsc' | 'ApplicationsCountDesc';
  searchValue?: string;
}

// Add interface for paginated response
export interface PaginatedJobsResponse {
  jobs: IJob[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}

interface SavedJobMap {
  jobId: number;       
  savedJobId: number;  
}

@Injectable({
  providedIn: 'root'
})
export class JobsService {

  public savedJobsState = signal<SavedJobMap[]>([]);

  private apiUrl = 'http://localhost:5007/api/Jobs';
  private savedJobsUrl = 'http://localhost:5007/api/SavedJob';
  private isSavedJobUrl = 'http://localhost:5007/api/SavedJob/issaved';

  public JobsList = signal<IJob[]>([]);
  public isLoading = signal<boolean>(false);
  public error = signal<string | null>(null);
  // Add pagination signals
  public totalCount = signal<number>(0);
  public currentPage = signal<number>(1);
  public pageSize = signal<number>(10);
  public totalPages = signal<number>(0);

  constructor(private http: HttpClient, private authService: AuthService) {
    this.loadSavedJobs();
  }

  /* ---------------------- Jobs Methods ---------------------- */
  
  GetAllJobs(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<IJob[]>(this.apiUrl).subscribe({
      next: (jobs) => {
        this.JobsList.set(Array.isArray(jobs) ? jobs : []);
        this.totalCount.set(jobs.length);
        this.currentPage.set(1);
        this.totalPages.set(1);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading jobs:', error);
        this.error.set('Failed to load jobs');
        this.isLoading.set(false);
        this.JobsList.set([]);
        this.totalCount.set(0);
      }
    });
  }

  GetFilteredJobs(filters: JobFilterParams): void {
    this.isLoading.set(true);
    this.error.set(null);

    let params = new HttpParams();

    if (filters.searchValue?.trim()) {
      params = params.set('searchValue', filters.searchValue.trim());
    }
    if (filters.searchByLocationValue?.trim()) {
      params = params.set('searchByLocationValue', filters.searchByLocationValue.trim());
    }
    if (filters.categoryId && filters.categoryId > 0) {
      params = params.set('categoryId', filters.categoryId.toString());
    }
    if (filters.skillId) {
      params = params.set('skillId', filters.skillId.toString());
    }
    if (filters.employerId) {
      params = params.set('employerId', filters.employerId.toString());
    }
    if (filters.workplaceType?.trim()) {
      params = params.set('workplaceType', filters.workplaceType);
    }
    if (filters.jobType?.trim()) {
      params = params.set('jobType', filters.jobType);
    }
    if (filters.experienceLevel?.trim()) {
      params = params.set('experienceLevel', filters.experienceLevel);
    }
    if (filters.educationLevel?.trim()) {
      params = params.set('educationLevel', filters.educationLevel);
    }
    if (filters.isActive !== undefined) {
      params = params.set('isActive', filters.isActive.toString());
    }
    if (filters.sortingOption !== undefined) {
      params = params.set('sortingOption', filters.sortingOption.toString());
    }
    // Add pagination parameters
    if (filters.pageIndex !== undefined && filters.pageIndex > 0) {
      params = params.set('pageIndex', filters.pageIndex.toString());
    }
    if (filters.pageSize !== undefined && filters.pageSize > 0) {
      params = params.set('pageSize', filters.pageSize.toString());
    }

    this.http.get<any>(this.apiUrl, { params }).subscribe({
      next: (response) => {
        // Check if response has pagination structure
        if (response && typeof response === 'object' && 'jobs' in response) {
          // Paginated response
          const paginatedResponse = response as PaginatedJobsResponse;
          this.JobsList.set(Array.isArray(paginatedResponse.jobs) ? paginatedResponse.jobs : []);
          this.totalCount.set(paginatedResponse.totalCount || 0);
          this.currentPage.set(paginatedResponse.pageIndex || 1);
          this.pageSize.set(paginatedResponse.pageSize || 10);
          this.totalPages.set(paginatedResponse.totalPages || 0);
        } else {
          // Simple array response (fallback)
          const jobs = Array.isArray(response) ? response : [];
          this.JobsList.set(jobs);
          this.totalCount.set(jobs.length);
          this.currentPage.set(1);
          this.totalPages.set(1);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading filtered jobs:', error);
        this.error.set('Failed to load filtered jobs');
        this.isLoading.set(false);
        this.JobsList.set([]);
        this.totalCount.set(0);
        this.totalPages.set(0);
      }
    });
  }

  // Getter methods for pagination
  getTotalCount(): number {
    return this.totalCount();
  }

  getCurrentPage(): number {
    return this.currentPage();
  }

  getPageSize(): number {
    return this.pageSize();
  }

  getTotalPages(): number {
    return this.totalPages();
  }

  GetJobDetails(jobID: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${jobID}`);
  }

  /*-------------------- Create Job -------------------- */
  createJob(jobData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<IJob>(this.apiUrl, jobData, { headers });
  }

  /*-------------------- Update Job -------------------- */
  updateJob(jobId: number, jobData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    
    console.log('=== SERVICE DEBUG ===');
    console.log('Input jobData:', jobData);
    
    // تنظيف وتحضير البيانات
    const requestBody = {
      title: jobData.title,
      description: jobData.description,
      salary: jobData.salary ? Number(jobData.salary) : 0,
      workplaceType: jobData.workplaceType,
      jobType: jobData.jobType,
      expireDate: jobData.expireDate,
      requirements: jobData.requirements || '',
      responsabilities: jobData.responsabilities || '',
      benefits: jobData.benefits || '',
      experienceLevel: jobData.experienceLevel,
      educationLevel: jobData.educationLevel,
      minTeamSize: jobData.minTeamSize ? Number(jobData.minTeamSize) : 1,
      maxTeamSize: jobData.maxTeamSize ? Number(jobData.maxTeamSize) : 10,
      website: jobData.website || '',
      isActive: jobData.isActive !== false,
      // تأكد من الـ field names والـ data types
      categoryIds: this.ensureIntegerArray(jobData.categoryIds),
      skillIds: this.ensureIntegerArray(jobData.skillIds)
    };

    console.log('Cleaned request body:', requestBody);
    console.log('CategoryIds type check:', typeof requestBody.categoryIds, requestBody.categoryIds);
    console.log('SkillIds type check:', typeof requestBody.skillIds, requestBody.skillIds);
    console.log('==================');

    return this.http.put(`${this.apiUrl}/${jobId}`, requestBody, { 
      headers,
      observe: 'response' // للحصول على response كامل للـ debugging
    }).pipe(
      tap((response) => {
        console.log('Update response:', response);
      }),
      catchError((error) => {
        console.error('Update job error details:', error);
        console.error('Error body:', error.error);
        return throwError(() => error);
      })
    );
  }

  // helper method للتأكد من صحة الـ arrays
  private ensureIntegerArray(value: any): number[] {
    if (!value) {
      console.log('Value is null/undefined:', value);
      return [];
    }
    
    if (!Array.isArray(value)) {
      console.log('Value is not array:', value, typeof value);
      return [];
    }
    
    const result = value
      .map(id => {
        const num = Number(id);
        console.log(`Converting ${id} (${typeof id}) to ${num} (${typeof num})`);
        return num;
      })
      .filter(id => {
        const isValid = !isNaN(id) && id > 0;
        if (!isValid) {
          console.log(`Filtering out invalid ID: ${id}`);
        }
        return isValid;
      });
    
    console.log('Final integer array:', result);
    return result;
  }

  GetAllJobsSkills(): Observable<ISkill[]> {
    return this.http.get<ISkill[]>(`${this.apiUrl}/skills`);
  }

  GetAllJobsCategories(): Observable<ICategory[]> {
    return this.http.get<ICategory[]>(`${this.apiUrl}/categories`);
  }

  /* ---------------------- Saved Jobs Methods ---------------------- */

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getSavedJobs(filters?: SavedJobsFilterParams): Observable<any[]> {
    let params = new HttpParams();
    
    if (filters?.searchValue?.trim()) {
      params = params.set('searchValue', filters.searchValue.trim());
    }
    if (filters?.SortingOption) {
      params = params.set('SortingOption', filters.SortingOption);
    }

    return this.http.get<any[]>(this.savedJobsUrl, {
      headers: this.getAuthHeaders(),
      params
    }).pipe(
      catchError(error => {
        console.error('Error fetching saved jobs:', error);
        return throwError(() => error);
      })
    );
  }

  getSavedJobIdByJobId(jobId: number): number | null {
    const entry = this.savedJobsState().find(s => s.jobId === jobId);
    return entry ? entry.savedJobId : null;
  }

  addToSavedJobs(jobId: number): Observable<any> {
    return this.http.post(
      this.savedJobsUrl,
      { jobId },
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap((response: any) => {
        const current = this.savedJobsState();
        const newEntry: SavedJobMap = { 
          jobId, 
          savedJobId: response.id || response.savedJobId || Date.now()
        };
        
        if (!current.some(s => s.jobId === jobId)) {
          this.savedJobsState.set([...current, newEntry]);
          console.log(`Job ${jobId} added to saved jobs with savedJobId: ${newEntry.savedJobId}`);
        }
      }),
      catchError(error => {
        console.error('Error adding job to saved:', error);
        return throwError(() => error);
      })
    );
  }

  removeFromSavedJobsByJobId(jobId: number): Observable<any> {
    return this.http.delete(`${this.savedJobsUrl}/${jobId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => {
        const updated = this.savedJobsState().filter(s => s.jobId !== jobId);
        this.savedJobsState.set(updated);
        console.log(`Job ${jobId} removed from saved jobs`);
      }),
      catchError(error => {
        console.error('Error removing saved job:', error);
        return throwError(() => error);
      })
    );
  }

  removeFromSavedJobs(savedJobId: number): Observable<any> {
    return this.http.delete(`${this.savedJobsUrl}/${savedJobId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => {
        const updated = this.savedJobsState().filter(s => s.savedJobId !== savedJobId);
        this.savedJobsState.set(updated);
        console.log(`Saved job with savedJobId ${savedJobId} removed`);
      }),
      catchError(error => {
        console.error('Error removing saved job:', error);
        return throwError(() => error);
      })
    );
  }

  isJobSaved(jobId: number): boolean {
    return this.savedJobsState().some(s => s.jobId === jobId);
  }

  isSaved(jobId: number): Observable<boolean> {
    const isInLocalState = this.isJobSaved(jobId);
    if (isInLocalState) {
      return new Observable(observer => {
        observer.next(true);
        observer.complete();
      });
    }
    
    return this.http.get<boolean>(`${this.isSavedJobUrl}/${jobId}`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      catchError(error => {
        console.error('Error checking if job is saved:', error);
        return throwError(() => error);
      })
    );
  }

  loadSavedJobs(): void {
    this.getSavedJobs().subscribe({
      next: (savedJobs: any[]) => {
        const savedMap: SavedJobMap[] = savedJobs.map(savedJob => ({
          jobId: savedJob.job?.id || savedJob.jobId,
          savedJobId: savedJob.id
        })).filter(item => item.jobId);

        this.savedJobsState.set(savedMap);
        console.log('Loaded saved jobs state:', savedMap);
      },
      error: (error) => {
        console.error('Error loading saved jobs:', error);
        this.savedJobsState.set([]);
      }
    });
  }

  refreshSavedJobsState(): void {
    this.loadSavedJobs();
  }

  getSavedJobsCount(): number {
    return this.savedJobsState().length;
  }

  /*---------------------------- Get Recent Jobs ----------------------------*/
  getRecentJobs(): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    return this.http.get(`${this.apiUrl}/recent?limit=3`, {headers });
  }

  /*---------------------------- Get Top Performing Jobs ----------------------------*/
  getTopPerformingJobs(): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    return this.http.get(`${this.apiUrl}/top-performing?limit=5`, {headers });
  }

  /*---------------------------- Get Employer Jobs ----------------------------*/
  getEmployerJobs(filters?: EmployerJobFilterParams): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    let params = new HttpParams();
    
    if (filters) {
      if (filters.searchValue?.trim()) {
        params = params.set('searchValue', filters.searchValue.trim());
      }
      if (filters.status) {
        params = params.set('status', filters.status);
      }
      if (filters.sortingOption) {
        params = params.set('sortingOption', filters.sortingOption);
      }
    }

    return this.http.get(`${this.apiUrl}/my-jobs`, { 
      headers,
      params 
    });
  }

  /*---------------------------- Get Expiring Soon Jobs ----------------------------*/
  getExpiringSoonJobs(): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });

    return this.http.get(`${this.apiUrl}/stats`, {headers });
  }

  /*---------------------------- Delete Job ----------------------------*/
  deleteJob(jobId: number): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`,
      'Content-Type': 'application/json'
    });

    return this.http.delete(`${this.apiUrl}/${jobId}`, { 
      headers,
      observe: 'response'
    }).pipe(
      tap((response) => {
        console.log('Delete response:', response);
      }),
      catchError((error) => {
        console.error('Delete job error:', error);
        
        if (error.error) {
          console.error('Error details:', error.error);
        }
        
        return throwError(() => error);
      })
    );
  }
}