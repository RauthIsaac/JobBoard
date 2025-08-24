import { CommonModule, CurrencyPipe, NgIf } from '@angular/common';
import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { JobsService } from '../jobs-service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../../../auth/auth-service';


@Component({
  selector: 'app-job-details',
  imports: [CurrencyPipe, RouterLink, CommonModule, NgIf],
  templateUrl: './job-details.html',
  styleUrl: './job-details.css'
})
export class JobDetails implements OnInit {

  jobId = signal<number>(0);
  jobDetails = signal<any>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  userType = signal<string | null>(null);

  requirementsList = computed(() => {
    const details = this.jobDetails();
    if (!details?.requirements) return [];

    return details.requirements
      .split(/\.\s+/)
      .map((req: string) => req.trim())
      .filter((req: string) => req.length > 0)
      .map((req: string) => req.endsWith('.') ? req : req + '.');
  });


  responsibilitiesList = computed(() => {
    const details = this.jobDetails();
    if (!details?.responsabilities) return [];
    
    return details.responsabilities
      .split(/\.\s+/)
      .map((resp: string) => resp.trim())
      .filter((resp: string) => resp.length > 0)
      .map((resp: string) => resp.endsWith('.') ? resp : resp + '.');
  });

  benefitsList = computed(() => {
    const details = this.jobDetails();
    if (!details?.benefits) return [];
    
    return details.benefits
      .split(/\.\s+/)
      .map((benefit: string) => benefit.trim())
      .filter((benefit: string) => benefit.length > 0)
      .map((benefit: string) => benefit.endsWith('.') ? benefit : benefit + '.');
  });

  isSavedFlag = signal<boolean>(false);

  constructor(
    private jobService: JobsService, 
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    // Listen to changes in savedJobsState
    effect(() => {
      const currentJobId = this.jobId();
      if (currentJobId > 0) {
        const isCurrentJobSaved = this.jobService.isJobSaved(currentJobId);
        this.isSavedFlag.set(isCurrentJobSaved);
      }
    });
  }

  ngOnInit(): void {
    window.scrollTo(0, 0);
    
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id && id > 0) {
        this.jobId.set(id);
        this.loadJobDetails();
      }
    });

    /* Get the user type */
    this.userType.set(this.getUserType());
    console.log('User Type : ',this.userType());
  }

  private loadJobDetails(): void {
    const currentJobId = this.jobId();
    if (!currentJobId) return;

    this.loading.set(true);
    this.error.set(null);
    
    this.jobService.GetJobDetails(currentJobId)
      .pipe(
        catchError(err => {
          console.error('Error loading job details:', err);
          this.error.set('Failed to load job details. Please try again.');
          return of(null);
        }),
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe((response: any) => {
        if (response) {
          this.jobDetails.set(response);
          this.isSavedFlag.set(this.jobService.isJobSaved(currentJobId));
          console.log("Job Details loaded:", response);
        }
      });
  }

  toggleSaved(): void {
    const currentJobId = this.jobId();
    if (!currentJobId) return;

    const currentSavedState = this.isSavedFlag();

    if (currentSavedState) {

      this.jobService.removeFromSavedJobsByJobId(currentJobId).subscribe({
        next: () => {

          console.log(`Job ${currentJobId} removed from saved jobs`);
        },
        error: (err) => {
          console.error('Error removing job from saved:', err);

          this.isSavedFlag.set(true);
        }
      });
    } else {

      this.jobService.addToSavedJobs(currentJobId).subscribe({
        next: () => {
          console.log(`Job ${currentJobId} added to saved jobs`);
        },
        error: (err) => {
          console.error('Error adding job to saved:', err);
          this.isSavedFlag.set(false);
        }
      });
    }
  }


  getUserType(): string | null{
    if(this.authService.getUserType() != null){
      return this.authService.getUserType();
    }
    else{
      return 'User'
    }
  }

  isEmployer(): boolean {
    return this.userType() === 'Employer';
  }

  isSeeker(): boolean {
    return this.userType() === 'Seeker';
  }

  isAdmin(): boolean{
    return this.userType() === 'Admin';
  }
 
}