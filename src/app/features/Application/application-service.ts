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

  getEmployerApplications(filterParams?: any): Observable<IemployerApplications[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
    
    let params = new HttpParams();
    
    if (filterParams) {
      if (filterParams.searchValue) {
        params = params.set('searchValue', filterParams.searchValue);
      }
      
      if (filterParams.status) {
        params = params.set('status', filterParams.status);
      }
    }
    
    return this.http.get<IemployerApplications[]>(
      `${this.baseUrl}/employer-applications`, 
      { headers, params }
    );
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

  /*------------------------ Submit New Application ------------------------*/
  submitApplication(formData: FormData): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`
    });
    
    return this.http.post(`${this.baseUrl}`, formData, { headers });
  }

  //#endregion
}