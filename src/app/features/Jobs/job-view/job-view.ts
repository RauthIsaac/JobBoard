import { CurrencyPipe, DatePipe, NgIf } from '@angular/common';
import { Component, Input, OnInit, signal, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { JobsService } from '../jobs-service';

@Component({
  selector: 'app-job-view',
  imports: [CurrencyPipe, RouterLink, DatePipe, NgIf],
  templateUrl: './job-view.html',
  styleUrl: './job-view.css'
})
export class JobView implements OnInit {

  @Input({ required: true }) job!: any;

  isSavedFlag = signal<boolean>(false);

  constructor(private jobService: JobsService) {
    // Listen to changes in savedJobsState
    effect(() => {
      if (this.job) {
        const savedIds = this.jobService.savedJobsState();
        this.isSavedFlag.set(savedIds.includes(this.job.id));
      }
    });
  }

  ngOnInit(): void {
    if (this.job) {
      // Set initial saved state
      this.isSavedFlag.set(this.jobService.isJobSaved(this.job.id));
    }
  }

  AddToSaved(): void {
    if (!this.job) return;

    const jobId = this.job.id;
    
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

  // Helper method to slice description text
  getSlicedDescription(): string {
    if (!this.job?.description) return '';
    
    const limit = 120;
    if (this.job.description.length <= limit) {
      return this.job.description;
    }
    
    return this.job.description.substring(0, limit).trim() + '...';
  }
}