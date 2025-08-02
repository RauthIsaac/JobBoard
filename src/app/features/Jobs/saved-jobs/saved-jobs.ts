import { Component, OnInit, Signal, signal } from '@angular/core';
import { JobsService } from '../jobs-service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-saved-jobs',
  imports: [],
  templateUrl: './saved-jobs.html',
  styleUrl: './saved-jobs.css'
})
export class SavedJobs implements OnInit {
  savedJobsList!: Signal<Set<number> | undefined>;

  constructor(private jobService: JobsService) {}

  ngOnInit(): void {
    // If your service exposes an Observable, use it here. 
    // For example, if you have savedJobs$ as Observable<Set<number>>:
    if ('savedJobs$' in this.jobService) {
      this.savedJobsList = toSignal((this.jobService as any).savedJobs$);
    }
    // If your service only exposes a signal, assign it directly:
    else if ('savedJobs' in this.jobService) {
      this.savedJobsList = (this.jobService as any).savedJobs;
    }
  }

  /**
   * Remove a job from saved jobs
   */
  removeJob(jobId: number): void {
    this.jobService.removeSavedJob(jobId);
  }

  /**
   * Clear all saved jobs
   */
  clearAllSavedJobs(): void {
    if (confirm('Are you sure you want to delete all from saved?')) {
      this.jobService.clearAllSavedJobs();
    }
  }

  /**
   * Get total count of saved jobs
   */
  getSavedJobsCount(): number {
    return this.savedJobsList?.()?.size || 0;
  }
}