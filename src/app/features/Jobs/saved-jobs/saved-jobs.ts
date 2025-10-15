import { Component, OnInit, OnDestroy, signal, effect } from '@angular/core';
import { JobsService, SavedJobsFilterParams } from '../jobs-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IJob } from '../../../shared/models/ijob';
import { JobSavedView } from '../job-saved-view/job-saved-view';
import { LoadingPage } from "../../../shared/components/loading-page/loading-page";

@Component({
  selector: 'app-saved-jobs',
  imports: [CommonModule, JobSavedView, FormsModule, RouterLink, LoadingPage],
  templateUrl: './saved-jobs.html',
  styleUrl: './saved-jobs.css'
})
export class SavedJobs implements OnInit, OnDestroy {
  savedJobsList = signal<IJob[]>([]);
  filteredJobsList = signal<IJob[]>([]);
  totalJobsCount = signal<number>(0);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  // Filter controls
  searchValue = signal<string>('');
  SortingOption = signal<'DateAsc' | 'DateDesc'>('DateDesc');
  isTyping = signal<boolean>(false);

  // Search debounce timer
  private searchTimeout: any;

  constructor(private jobService: JobsService) {
    // Listen to changes in savedJobsState to refresh the list
    effect(() => {
      const savedJobsState = this.jobService.savedJobsState();
      console.log('SavedJobsState changed:', savedJobsState);

      if (savedJobsState.length === 0) {
        this.savedJobsList.set([]);
        this.filteredJobsList.set([]);
        this.totalJobsCount.set(0);
      } else {
        const currentCount = this.savedJobsList().length;
        if (currentCount === 0 || currentCount !== savedJobsState.length) {
          this.loadSavedJobs();
        }
      }
    });
  }

  ngOnInit(): void {
    this.loadSavedJobs();


  setTimeout(() => {
      const elements = document.querySelectorAll('.animate-on-scroll');
      const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });

      elements.forEach(element => observer.observe(element));
    }, 800);


        

    // ✅ Dynamic stagger animation
    setTimeout(() => {
      const lines = document.querySelectorAll<HTMLElement>('.fade-line');
      lines.forEach((line, index) => {
        line.style.animationDelay = `${index * 0.15}s`;
        line.classList.add('visible');
      });
    }, 600);

  }

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  loadSavedJobs(): void {
    this.isLoading.set(true);
    this.error.set(null);
    
    // First load all jobs to get total count
    this.jobService.getSavedJobs().subscribe({
      next: (allJobs: any[]) => {
        const jobsList = allJobs.map(savedJob => savedJob.job || savedJob).filter(job => job);
        
        this.savedJobsList.set(jobsList);
        this.totalJobsCount.set(jobsList.length);

        const savedMap = allJobs.map(savedJob => ({
          jobId: savedJob.job?.id || savedJob.jobId,
          savedJobId: savedJob.id
        })).filter(item => item.jobId && item.savedJobId);
        
        this.jobService.savedJobsState.set(savedMap);
        console.log('Updated savedJobsState:', savedMap);
        
        // Then apply current filters
        this.applyCurrentFilters();
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

  private applyCurrentFilters(): void {
    const filters: SavedJobsFilterParams = {
      searchValue: this.searchValue().trim() || undefined,
      SortingOption: this.SortingOption()
    };

    this.jobService.getSavedJobs(filters).subscribe({
      next: (jobs: any[]) => {
        const jobsList = jobs.map(savedJob => savedJob.job || savedJob).filter(job => job);
        
        this.filteredJobsList.set(jobsList);
        this.isLoading.set(false);
        console.log("Filtered Saved Jobs:", jobsList);
      },
      error: (error: any) => {
        console.error('Error loading filtered jobs:', error);
        this.error.set('Failed to load filtered jobs. Please try again.');
        this.isLoading.set(false);
        this.filteredJobsList.set([]);
      }
    });
  }

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
      this.applyCurrentFilters();
      return;
    }
    
    // Debounce search for 2 seconds
    this.searchTimeout = setTimeout(() => {
      this.isTyping.set(false);
      this.applyCurrentFilters();
    }, 2000);
  }

  onSortChange(sortOption: 'DateDesc' | 'DateAsc'): void {
    this.SortingOption.set(sortOption);
    this.applyCurrentFilters();
  }

  clearSearch(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this.searchValue.set('');
    this.isTyping.set(false);
    this.applyCurrentFilters();
  }

  // Get total count
  getTotalCount(): number {
    return this.totalJobsCount();
  }

  // Get filtered count
  getFilteredCount(): number {
    return this.filteredJobsList().length;
  }


  // TrackBy function for better performance with *ngFor
  trackByJobId(index: number, job: IJob): number {
    return job.id;
  }
}