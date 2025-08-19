import { CommonModule, CurrencyPipe, DatePipe, NgIf } from '@angular/common';
import { Component, Input, OnInit, signal, effect, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { JobsService } from '../jobs-service';

@Component({
  selector: 'app-job-saved-view',
  imports: [CurrencyPipe, RouterLink, DatePipe, CommonModule],
  templateUrl: './job-saved-view.html',
  styleUrl: './job-saved-view.css'
})
export class JobSavedView implements OnInit, OnChanges {

  @Input({ required: true }) job!: any;
  @Output() jobRemoved = new EventEmitter<number>(); 

  isSavedFlag = signal<boolean>(false);

  constructor(private jobService: JobsService) {
    // Listen to changes in savedJobsState for real-time updates
    effect(() => {
      if (this.job?.jobId) {
        const isCurrentJobSaved = this.jobService.isJobSaved(this.job.jobId);
        this.isSavedFlag.set(isCurrentJobSaved);
        console.log(`Job ${this.job.jobId} saved state: ${isCurrentJobSaved}`);
      }
    });
  }

  ngOnInit(): void {
    this.updateSavedState();
    setTimeout(() => {
      this.updateSavedState();
    }, 1000);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['job'] && this.job) {
      this.updateSavedState();
    }
  }

  private updateSavedState(): void {
    if (this.job?.jobId) {
      this.isSavedFlag.set(this.jobService.isJobSaved(this.job.jobId));
    }
  }

  AddToSaved(): void {
    if (!this.job?.jobId) return;

    const jobId = this.job.jobId;
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
}