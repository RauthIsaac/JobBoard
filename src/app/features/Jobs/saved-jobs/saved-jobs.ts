import { Component, OnInit, signal, effect } from '@angular/core';
import { JobsService, SavedJobsFilterParams } from '../jobs-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IJob } from '../../../shared/models/ijob';
import { JobView } from '../job-view/job-view';

@Component({
  selector: 'app-saved-jobs',
  imports: [CommonModule, JobView, FormsModule, RouterLink],
  templateUrl: './saved-jobs.html',
  styleUrl: './saved-jobs.css'
})
export class SavedJobs implements OnInit {
  savedJobsList = signal<IJob[]>([]);
  filteredJobsList = signal<IJob[]>([]);
  totalJobsCount = signal<number>(0);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  // Filter controls
  searchValue = signal<string>('');
  SortingOption = signal<'DateAsc' | 'DateDesc'>('DateDesc');

  // Search debounce timer
  private searchTimeout: any;

  constructor(private jobService: JobsService) {
    // Listen to changes in savedJobsState to refresh the list
    effect(() => {
      const savedIds = this.jobService.savedJobsState();
      // Only reload if we had jobs before or if we now have jobs
      this.loadSavedJobs();
    });
  }

  ngOnInit(): void {
    this.loadSavedJobs();
  }

  loadSavedJobs(): void {
    this.isLoading.set(true);
    this.error.set(null);
    
    const filters: SavedJobsFilterParams = {
      searchValue: this.searchValue().trim() || undefined,
      SortingOption: this.SortingOption()
    };

    // First load all jobs to get total count
    this.jobService.getSavedJobs().subscribe({
      next: (allJobs: IJob[]) => {
        this.savedJobsList.set(allJobs);
        this.totalJobsCount.set(allJobs.length);
        
        // Then load filtered jobs
        this.loadFilteredJobs(filters);
      },
      error: (error: any) => {
        console.error('Error loading saved jobs:', error);
        this.error.set('Failed to load saved jobs. Please try again.');
        this.isLoading.set(false);
        this.savedJobsList.set([]);
        this.filteredJobsList.set([]);
        this.totalJobsCount.set(0);
      }
    });
  }

  private loadFilteredJobs(filters: SavedJobsFilterParams): void {
    this.jobService.getSavedJobs(filters).subscribe({
      next: (jobs: IJob[]) => {
        this.filteredJobsList.set(jobs);
        this.isLoading.set(false);
        console.log("Filtered Saved Jobs:", jobs);
      },
      error: (error: any) => {
        console.error('Error loading filtered jobs:', error);
        this.error.set('Failed to load filtered jobs. Please try again.');
        this.isLoading.set(false);
        this.filteredJobsList.set([]);
      }
    });
  }

  // Add typing indicator
  isTyping = signal<boolean>(false);

  onSearchChange(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value;
    this.searchValue.set(searchTerm);
    this.isTyping.set(true);
    
    // Clear previous timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Don't make API call if search is empty
    if (!searchTerm.trim()) {
      this.isTyping.set(false);
      this.applyFilters();
      return;
    }
    
    // Debounce search for 1500ms (1.5 seconds) 
    // Wait until user stops typing completely
    this.searchTimeout = setTimeout(() => {
      this.isTyping.set(false);
      this.applyFilters();
    }, 2000);
  }

  onSortChange(sortOption: 'DateDesc' | 'DateAsc'): void {
    this.SortingOption.set(sortOption);
    // Apply filters immediately for sort changes
    this.applyFilters();
  }

  private applyFilters(): void {
    // Don't show loading if user is still typing
    if (!this.isTyping()) {
      this.isLoading.set(true);
    }
    
    this.error.set(null);
    
    const filters: SavedJobsFilterParams = {
      searchValue: this.searchValue().trim() || undefined,
      SortingOption: this.SortingOption()
    };

    this.jobService.getSavedJobs(filters).subscribe({
      next: (jobs: IJob[]) => {
        this.filteredJobsList.set(jobs);
        this.isLoading.set(false);
        console.log("Applied filters:", filters);
        console.log("Filtered results:", jobs);
      },
      error: (error: any) => {
        console.error('Error applying filters:', error);
        this.error.set('Failed to apply filters. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  clearSearch(): void {
    // Clear the timeout to prevent pending search
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this.searchValue.set('');
    this.isTyping.set(false); // Clear typing indicator
    this.applyFilters();
  }

  refreshSavedJobs(): void {
    this.loadSavedJobs();
  }

  // Handle job removal from child component
  onJobRemoved(jobId: number): void {
    this.savedJobsList.update(jobs => jobs.filter(job => job.id !== jobId));
    this.filteredJobsList.update(jobs => jobs.filter(job => job.id !== jobId));
    this.totalJobsCount.update(count => Math.max(0, count - 1));
  }

  // Get total count
  getTotalCount(): number {
    return this.totalJobsCount();
  }

  // Get filtered count
  getFilteredCount(): number {
    return this.filteredJobsList().length;
  }

  // Clear all saved jobs
  clearAllSavedJobs(): void {
    if (confirm('Are you sure you want to remove all saved jobs?')) {
      this.isLoading.set(true);
      const jobIds = this.savedJobsList().map(job => job.id);
      
      // Remove each job individually
      const removePromises = jobIds.map(id => 
        this.jobService.removeFromSavedJobs(id).toPromise()
      );
      
      Promise.all(removePromises).then(() => {
        console.log('All saved jobs cleared');
        this.savedJobsList.set([]);
        this.filteredJobsList.set([]);
        this.totalJobsCount.set(0);
        this.isLoading.set(false);
      }).catch(error => {
        console.error('Error clearing saved jobs:', error);
        this.error.set('Failed to clear all saved jobs');
        this.isLoading.set(false);
      });
    }
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  // TrackBy function for better performance with *ngFor
  trackByJobId(index: number, job: IJob): number {
    return job.id;
  }
}