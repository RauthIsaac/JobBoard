// application-service.ts (minor changes: remove unused params like appliedDateFrom/To since not supported, but keep for future; ensure headers)
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/auth-service';
import { ApplicationFilterParams } from '../../shared/models/application-filter-params';
import { IemployerApplications } from '../../shared/models/iemployer-applications';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {
 
  private readonly baseUrl = 'http://localhost:5007/api/Application';

  constructor(
    private http: HttpClient, 
    private authService: AuthService
  ) {}

  /*------------------------ For Post Application ------------------------*/
  //#region Post Application
  private applicationData: any = {
    fullName: '',
    email: '',
    phoneNumber: '',
    currentLocation: '',
    currentJobTitle: '',
    yearsOfExperience: '',
    cvFile: null,
    coverLetter: '',
    portfolioUrl: '',
    linkedInUrl: '',
    gitHubUrl: '',
    jobId: null
  };

  setData(part: Partial<typeof this.applicationData>) {
    this.applicationData = { ...this.applicationData, ...part };
  }

  getData() {
    return this.applicationData;
  }

  clearData() {
    this.applicationData = {
      fullName: '',
      email: '',
      phoneNumber: '',
      currentLocation: '',
      currentJobTitle: '',
      yearsOfExperience: '',
      cvFile: null,
      coverLetter: '',
      portfolioUrl: '',
      linkedInUrl: '',
      gitHubUrl: '',
      jobId: null
    };
  }

  setJobId(jobId: number) {
    this.applicationData.jobId = jobId;
  }
  //#endregion

  /*------------------------ Get Employer Applications with Filters ------------------------*/
  //#region Get Employer Application with Search & Filter

  getEmployerApplications(filterParams?: ApplicationFilterParams): Observable<IemployerApplications[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
    
    let params = new HttpParams();
    
    if (filterParams) {
      if (filterParams.jobId) {
        params = params.set('jobId', filterParams.jobId.toString());
      }
      
      if (filterParams.applicantId) {
        params = params.set('applicantId', filterParams.applicantId.toString());
      }
      
      if (filterParams.status !== undefined && filterParams.status !== null) {
        params = params.set('status', filterParams.status.toString());
      }
      
      if (filterParams.pageIndex !== undefined) {
        params = params.set('pageIndex', filterParams.pageIndex.toString());
      }
      
      if (filterParams.pageSize !== undefined) {
        params = params.set('pageSize', filterParams.pageSize.toString());
      }
    }
    
    return this.http.get<IemployerApplications[]>(
      `${this.baseUrl}/employer-applications`, 
      { headers, params }
    );
  }

  // Legacy method for backward compatibility
  getEmployerApplication(): Observable<IemployerApplications[]> {
    return this.getEmployerApplications();
  }

  /*------------------------ Update Application Status ------------------------*/
  updateApplicationStatus(applicationId: number, status: number): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`,
      'Content-Type': 'application/json'
    });
    
    const statusDto = { status: status };
    
    return this.http.put(
      `${this.baseUrl}/${applicationId}/status`,
      statusDto,
      { headers }
    );
  }

  //#endregion
}