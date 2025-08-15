import { CurrencyPipe, DatePipe, CommonModule } from '@angular/common';
import { Component, OnInit, signal, effect } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { JobsService } from '../jobs-service';
import { IJob } from '../../../shared/models/ijob';

@Component({
  selector: 'app-job-details',
  imports: [CurrencyPipe, RouterLink, DatePipe, CommonModule],
  templateUrl: './job-details.html',
  styleUrl: './job-details.css'
})
export class JobDetails implements OnInit {

  jobId = signal<number>(0);
  jobDetails = signal<any>({});
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  requirementsList = signal<string[]>([]);
  responsibilitiesList = signal<string[]>([]);
  offersList = signal<string[]>([]);

  isSavedFlag = signal<boolean>(false);

  constructor(private jobService: JobsService, private route: ActivatedRoute) {
    // Listen to changes in savedJobsState
    effect(() => {
      const savedIds = this.jobService.savedJobsState();
      const currentJobId = this.jobId();
      if (currentJobId > 0) {
        this.isSavedFlag.set(savedIds.includes(currentJobId));
      }
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const jobId = +params['id'];
      this.jobId.set(jobId);
      this.loadJobDetails();

      // Set initial saved state
      this.isSavedFlag.set(this.jobService.isJobSaved(jobId));
    });
  }

  loadJobDetails() {
    this.loading.set(true);
    this.error.set(null);
    
    this.jobService.GetJobDetails(this.jobId())
      .subscribe({
        next: (response: any) => {
          if (response) {
            this.jobDetails.set(response);
            console.log(this.jobDetails());          
           
            // Parse requirements string into array
            if (response.requirements) {
              this.requirementsList.set(response.requirements.split('. ').filter((req: string) => req.trim() !== ''));
            }

            // Parse responsibilities string into array
            if (response.responsabilities) {
              this.responsibilitiesList.set(response.responsabilities.split('. ').filter((req: string) => req.trim() !== ''));
            }

            // Parse benefits string into array
            if (response.benefits) {
              this.offersList.set(response.benefits.split('. ').filter((req: string) => req.trim() !== ''));
            }
          }
          this.loading.set(false);
        },
        error: (err: any) => {
          this.error.set('Failed to load job details. Please try again.');
          this.loading.set(false);
        }
      });
  }

  /*----------------------------Saved Jobs-------------------------------- */
  toggleSaved(): void {
    const jobId = this.jobId();
    
    if (this.isSavedFlag()) {
      this.jobService.removeFromSavedJobs(jobId).subscribe({
        next: () => {
          console.log(`Job ${jobId} removed from saved jobs`);
        },
        error: (err) => {
          console.error('Error removing job:', err);
          // Revert the UI state on error
          this.isSavedFlag.set(true);
        }
      });
    } else {
      this.jobService.addToSavedJobs(jobId).subscribe({
        next: () => {
          console.log(`Job ${jobId} added to saved jobs`);
        },
        error: (err) => {
          console.error('Error saving job:', err);
          // Revert the UI state on error
          this.isSavedFlag.set(false);
        }
      });
    }
  }
}