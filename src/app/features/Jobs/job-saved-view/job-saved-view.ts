import { CommonModule, CurrencyPipe, DatePipe, NgIf } from '@angular/common';
import { Component, Input, OnInit, signal, effect, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { JobsService } from '../jobs-service';
import { AuthService } from '../../../auth/auth-service';
import { ApplicationService } from '../../Application/application-service';
import { SnackbarService } from '../../../shared/components/snackbar/snackbar-service';

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
  userType = signal<string | null>(null);
  isJobApplied = signal<boolean>(false);
  isCheckingApplied = signal<boolean>(false);

  constructor(
    private jobService: JobsService,
    private authService: AuthService,
    private applicationService: ApplicationService,
    private snackbarService: SnackbarService
  ) {
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

    /* Get the user type */
    this.userType.set(this.getUserType());
    console.log('User Type : ', this.userType());

    // Check if job is already applied for seekers
    if (this.isSeeker() && this.job?.jobId) {
      console.log('Checking if job is applied for job ID:', this.job.jobId);
      this.checkIfJobApplied();
    } else {
      console.log('Not checking applied status - User type:', this.userType(), 'Job ID:', this.job?.jobId);
    }

    setTimeout(() => {
      this.updateSavedState();
    }, 1000);


    

    // ✅ Dynamic stagger animation
    setTimeout(() => {
      const lines = document.querySelectorAll<HTMLElement>('.fade-line');
      lines.forEach((line, index) => {
        line.style.animationDelay = `${index * 0.15}s`;
        line.classList.add('visible');
      });
    }, 600);

    
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['job'] && this.job) {
      this.updateSavedState();
      
      // Check if job is already applied when job changes
      if (this.isSeeker() && this.job?.jobId) {
        this.checkIfJobApplied();
      }
    }
  }

  private updateSavedState(): void {
    if (this.job?.jobId) {
      this.isSavedFlag.set(this.jobService.isJobSaved(this.job.jobId));
    }
  }

  private checkIfJobApplied(): void {
    if (!this.job?.jobId) return;

    this.isCheckingApplied.set(true);
    
    this.applicationService.isJobApplied(this.job.jobId).subscribe({
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

  AddToSaved(): void {
    if (!this.job?.jobId) return;

    const jobId = this.job.jobId;
    const currentSavedState = this.isSavedFlag();

    if (currentSavedState) {
      this.jobService.removeFromSavedJobsByJobId(jobId).subscribe({
        next: () => {
          console.log(`Job ${jobId} removed from saved jobs`);
          this.jobRemoved.emit(jobId);
          this.showSuccess('Job removed from saved jobs');
        },
        error: (err) => {
          console.error('Error removing job from saved:', err);
          this.isSavedFlag.set(true);
          this.showError('Failed to remove job from saved jobs');
        }
      });
    } else {
      this.jobService.addToSavedJobs(jobId).subscribe({
        next: () => {
          console.log(`Job ${jobId} added to saved jobs`);
          this.showSuccess('Job added to saved jobs');
        },
        error: (err) => {
          console.error('Error adding job to saved:', err);
          this.isSavedFlag.set(false);
          this.showError('Failed to add job to saved jobs');
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

  getUserType(): string | null {
    if (this.authService.getUserType() != null) {
      return this.authService.getUserType();
    } else {
      return 'User'
    }
  }

  isEmployer(): boolean {
    return this.userType() === 'Employer';
  }

  isSeeker(): boolean {
    return this.userType() === 'Seeker';
  }

  isAdmin(): boolean {
    return this.userType() === 'Admin';
  }



  //#region Snackbar Methods
  showSuccess(message: string = 'Operation successful!', duration: number = 4000, action: string = 'Undo'): void {
    console.log('Showing success snackbar');
    this.snackbarService.show({
      message,
      type: 'success',
      duration,
      action
    });
  }

  showError(message: string = 'Something went wrong!', duration: number = 5000): void {
    this.snackbarService.show({
      message,
      type: 'error',
      duration
    });
  }

  //#endregion
}