import { HttpClient } from '@angular/common/http';
import { Injectable, signal, effect } from '@angular/core';
import { IJob } from '../../shared/models/ijob';
import { JobDetails } from './job-details/job-details';

@Injectable({
  providedIn: 'root'
})
export class JobsService {
  //#region 

  private readonly SAVED_JOBS_KEY = 'savedJobs';
  public savedJobs = signal<Set<number>>(new Set<number>());
  
  constructor(private http: HttpClient) {

    this.loadSavedJobsFromStorage();

    effect(() => {
      this.saveSavedJobsToStorage(this.savedJobs());

      /*------------------- */
      this.GetAllHttpJobs();
    });
  }

  private loadSavedJobsFromStorage(): void {
    try {
      const savedJobsJson = localStorage.getItem(this.SAVED_JOBS_KEY);
      if (savedJobsJson) {
        const savedJobsArray: number[] = JSON.parse(savedJobsJson);
        this.savedJobs.set(new Set(savedJobsArray));
      }
    } catch (error) {
      console.error('Error loading saved jobs from localStorage:', error);
      this.savedJobs.set(new Set<number>());
    }
  }

  private saveSavedJobsToStorage(savedJobsSet: Set<number>): void {
    try {
      const savedJobsArray = Array.from(savedJobsSet);
      localStorage.setItem(this.SAVED_JOBS_KEY, JSON.stringify(savedJobsArray));
    } catch (error) {
      console.error('Error saving jobs to localStorage:', error);
    }
  }

  toggleSaved(jobId: number): void {
    this.savedJobs.update(currentSet => {
      const newSet = new Set(currentSet);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  }

  isSaved(jobId: number): boolean {
    return this.savedJobs().has(jobId);
  }

  getSavedJobsList(): number[] {
    return Array.from(this.savedJobs());
  }

  removeSavedJob(jobId: number): void {
    this.savedJobs.update(currentSet => {
      const newSet = new Set(currentSet);
      newSet.delete(jobId);
      return newSet;
    });
  }

  clearAllSavedJobs(): void {
    this.savedJobs.set(new Set<number>());
    localStorage.removeItem(this.SAVED_JOBS_KEY);
  }

  getSavedJobsCount(): number {
    return this.savedJobs().size;
  }
  //#endregion
  
  /*----------------------------API URL---------------------------- */
  private apiUrl = 'http://localhost:5007/api/Jobs';

  /*---------------------------Get All Jobs----------------------------- */
  public JobsList = signal<IJob[]>([]);

  GetAllHttpJobs(){
    this.http.get(this.apiUrl).subscribe(jobs => {
      if(Array.isArray(jobs)){
        this.JobsList.set(jobs);
      }else{
        this.JobsList.set([]);
      }

      console.log("Loaded Jobs : ", this.JobsList() );
    });

  }

  /*--------------------------Get Job Details------------------------------ */

  // public JobDetail: any;

  GetJobDetails(jobID: number):any {
    return this.http.get(`${this.apiUrl}/${jobID}`);
  }


}