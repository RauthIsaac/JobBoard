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

interface SavedJobMap {
  jobId: number;       // من جدول الوظائف
  savedJobId: number;  // من جدول SavedJobs
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
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading jobs:', error);
        this.error.set('Failed to load jobs');
        this.isLoading.set(false);
        this.JobsList.set([]);
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

    this.http.get<IJob[]>(this.apiUrl, { params }).subscribe({
      next: (jobs) => {
        this.JobsList.set(Array.isArray(jobs) ? jobs : []);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading filtered jobs:', error);
        this.error.set('Failed to load filtered jobs');
        this.isLoading.set(false);
        this.JobsList.set([]);
      }
    });
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
    return this.http.put<IJob>(`${this.apiUrl}/${jobId}`, jobData, { headers });
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
        // تحديث الـ state فوراً بعد نجاح العملية
        const current = this.savedJobsState();
        const newEntry: SavedJobMap = { 
          jobId, 
          savedJobId: response.id || response.savedJobId || Date.now()
        };
        
        // تأكد من عدم وجود duplicate
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

  // الطريقة الجديدة - حذف باستخدام jobId مباشرة
  removeFromSavedJobsByJobId(jobId: number): Observable<any> {
    return this.http.delete(`${this.savedJobsUrl}/${jobId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => {
        // تحديث الـ state فوراً بعد نجاح العملية
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

  // الطريقة القديمة - محتفظ بها للتوافق مع الكود الموجود
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
    // أولاً تحقق من الـ local state
    const isInLocalState = this.isJobSaved(jobId);
    if (isInLocalState) {
      return new Observable(observer => {
        observer.next(true);
        observer.complete();
      });
    }
    
    // إذا لم توجد في الـ local state، اسأل الـ API
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
        // تحويل البيانات إلى SavedJobMap format
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
}