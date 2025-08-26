import { CommonModule, CurrencyPipe, DatePipe, NgIf } from '@angular/common';
import { Component, Input, OnInit, signal, effect, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { JobsService } from '../jobs-service';
import { ApplicationService } from '../../Application/application-service';

@Component({
  selector: 'app-job-explore-view',
  imports: [CurrencyPipe, RouterLink, DatePipe, CommonModule],
  templateUrl: './job-explore-view.html',
  styleUrl: './job-explore-view.css'
})
export class JobExploreView implements OnInit, OnChanges {

  @Input({ required: true }) job!: any;
  @Output() jobRemoved = new EventEmitter<number>(); 

  isSavedFlag = signal<boolean>(false);
  isJobApplied = signal<boolean>(false);
  isCheckingApplied = signal<boolean>(false);

  constructor(
    private jobService: JobsService,
    private applicationService : ApplicationService
  ) {
    // Listen to changes in savedJobsState for real-time updates
    effect(() => {
      if (this.job?.id) {
        const isCurrentJobSaved = this.jobService.isJobSaved(this.job.id);
        this.isSavedFlag.set(isCurrentJobSaved);
        console.log(`Job ${this.job.id} saved state: ${isCurrentJobSaved}`);
      }
    });
  }

  ngOnInit(): void {
    this.updateSavedState();
    
    setTimeout(() => {
      this.updateSavedState();
    }, 50);


    // Check if job is already applied for seekers
    if ( this.job?.id) {
      console.log('Checking if job is applied for job ID:', this.job.id);
      this.checkIfJobApplied();
    } 
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['job'] && this.job) {
      this.updateSavedState();

      // Check if job is already applied when job changes
      this.checkIfJobApplied();

    }
  }

  private updateSavedState(): void {
    if (this.job?.id) {
      this.isSavedFlag.set(this.jobService.isJobSaved(this.job.id));
    }
  }

  AddToSaved(): void {
    if (!this.job?.id) return;

    const jobId = this.job.id;
    const currentSavedState = this.isSavedFlag();

    if (currentSavedState) {
      this.jobService.removeFromSavedJobsByJobId(jobId).subscribe({
        next: () => {
          console.log(`Job ${jobId} removed from saved jobs`);
          this.jobRemoved.emit(jobId);
        },
        error: (err) => {
          console.error('Error removing job from saved:', err);
          this.isSavedFlag.set(true);
        }
      });
    } else {
      this.jobService.addToSavedJobs(jobId).subscribe({
        next: () => {
          console.log(`Job ${jobId} added to saved jobs`);
        },
        error: (err) => {
          console.error('Error adding job to saved:', err);
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

  private checkIfJobApplied(): void {
    if (!this.job?.id) return;

    this.isCheckingApplied.set(true);
    
    this.applicationService.isJobApplied(this.job.id).subscribe({
      next: (response) => {
        this.isJobApplied.set(response);
        this.isCheckingApplied.set(false);
      },
      error: (err) => {
        console.error('Error checking if job is applied:', err);
        this.isJobApplied.set(false);
        this.isCheckingApplied.set(false);
      }
    });
  }

}