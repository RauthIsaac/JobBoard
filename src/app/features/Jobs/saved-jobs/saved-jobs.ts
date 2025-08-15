import { Component, OnInit, OnDestroy, signal, effect } from '@angular/core';
import { JobsService, SavedJobsFilterParams } from '../jobs-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IJob } from '../../../shared/models/ijob';
import { JobExploreView } from '../job-explore-view/job-explore-view';
import { JobSavedView } from '../job-saved-view/job-saved-view';

@Component({
  selector: 'app-saved-jobs',
  imports: [CommonModule, JobSavedView, FormsModule, RouterLink],
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
      
      // إعادة تحميل القائمة عند تغيير الـ state
      if (savedJobsState.length === 0) {
        // إذا لم تعد هناك وظائف محفوظة
        this.savedJobsList.set([]);
        this.filteredJobsList.set([]);
        this.totalJobsCount.set(0);
      } else {
        // إعادة تحميل القائمة فقط إذا كانت فارغة أو تغير العدد
        const currentCount = this.savedJobsList().length;
        if (currentCount === 0 || currentCount !== savedJobsState.length) {
          this.loadSavedJobs();
        }
      }
    });
  }

  ngOnInit(): void {
    this.loadSavedJobs();
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
        // تحويل البيانات إلى IJob format
        const jobsList = allJobs.map(savedJob => savedJob.job || savedJob).filter(job => job);
        
        this.savedJobsList.set(jobsList);
        this.totalJobsCount.set(jobsList.length);
        
        // تحديث الـ savedJobsState في الـ service بشكل فوري
        const savedMap = allJobs.map(savedJob => ({
          jobId: savedJob.job?.id || savedJob.jobId,
          savedJobId: savedJob.id
        })).filter(item => item.jobId && item.savedJobId);
        
        // تأكد من تحديث الـ state فوراً
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
        // تحويل البيانات إلى IJob format
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

  refreshSavedJobs(): void {
    // إعادة تحميل الـ saved jobs state من الخادم
    this.jobService.refreshSavedJobsState();
    this.loadSavedJobs();
  }

  // Handle job removal from child component
  onJobRemoved(jobId: number): void {
    // تحديث القوائم المحلية فوراً لتحسين UX
    this.savedJobsList.update(jobs => jobs.filter(job => job.id !== jobId));
    this.filteredJobsList.update(jobs => jobs.filter(job => job.id !== jobId));
    this.totalJobsCount.update(count => Math.max(0, count - 1));
    
    console.log(`Job ${jobId} removed from local state`);
  }

  // Get total count
  getTotalCount(): number {
    return this.totalJobsCount();
  }

  // Get filtered count
  getFilteredCount(): number {
    return this.filteredJobsList().length;
  }

  // Clear all saved jobs - محدثة لتستخدم الـ endpoint الجديدة
  clearAllSavedJobs(): void {
    if (!confirm('Are you sure you want to remove all saved jobs?')) {
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    // الحصول على جميع jobIds من القائمة الحالية
    const currentJobs = this.savedJobsList();
    const jobIds = currentJobs.map(job => job.id);
    
    if (jobIds.length === 0) {
      this.isLoading.set(false);
      return;
    }

    // إزالة كل وظيفة على حدة باستخدام الـ endpoint الجديدة
    let completedRequests = 0;
    let hasError = false;

    jobIds.forEach(jobId => {
      this.jobService.removeFromSavedJobsByJobId(jobId).subscribe({
        next: () => {
          completedRequests++;
          if (completedRequests === jobIds.length && !hasError) {
            // جميع العمليات اكتملت بنجاح
            this.savedJobsList.set([]);
            this.filteredJobsList.set([]);
            this.totalJobsCount.set(0);
            this.isLoading.set(false);
            console.log('All saved jobs cleared successfully');
          }
        },
        error: (error) => {
          hasError = true;
          completedRequests++;
          console.error('Error removing saved job:', error);
          
          if (completedRequests === jobIds.length) {
            this.error.set('Failed to clear some saved jobs. Please try again.');
            this.isLoading.set(false);
            // إعادة تحميل القائمة لمعرفة ما تم حذفه فعلاً
            this.loadSavedJobs();
          }
        }
      });
    });
  }

  // TrackBy function for better performance with *ngFor
  trackByJobId(index: number, job: IJob): number {
    return job.id;
  }
}