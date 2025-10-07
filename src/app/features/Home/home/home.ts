import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { JobsService } from '../../Jobs/jobs-service';
import { IJob } from '../../../shared/models/ijob';
import { ICategory } from '../../../shared/models/icategory';
import { JobView } from '../../Jobs/job-view/job-view';
import { AuthService } from '../../../auth/auth-service';
import { CommonModule } from '@angular/common';
import { IPublicStats } from '../../../shared/models/IPublicStats';
import { StatsService } from '../../../core/stats.service';

@Component({
  selector: 'app-home',
  imports: [JobView, ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {

  jobsList = signal<IJob[]>([]);
  categories = signal<ICategory[]>([]);
  isLoggin = signal<boolean>(false);

  stats = signal<IPublicStats>({
    totalSeekers: 0,
    totalEmployers: 0,
    totalJobs: 0,
    approvedJobs: 0,
    activeJobs: 0,
    jobsGrowth: 0,
    approvalGrowth: 0,
    activeJobsGrowth: 0
  });

  // Form controls for search
  searchControl = new FormControl('');
  locationControl = new FormControl('');
  categoryControl = new FormControl('');

  constructor(
    private jobService: JobsService,
    private router: Router,
    private AuthService: AuthService,
    private statsService: StatsService
  ) {}

  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.loadStats();
    this.jobsList = this.jobService.JobsList;
    this.jobService.GetAllJobs();
    this.loadCategories();
    this.isUserloggin();
  }

  private loadCategories(): void {
    this.jobService.GetAllJobsCategories().subscribe({
      next: (categories: ICategory[]) => {
        this.categories.set(categories);
      },
      error: (error: any) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  onSearchSubmit(): void {
    const searchParams: any = {};
    const searchValue = this.searchControl.value?.trim();
    const locationValue = this.locationControl.value?.trim();
    const categoryValue = this.categoryControl.value;

    if (searchValue) searchParams.search = searchValue;
    if (locationValue) searchParams.location = locationValue;
    if (categoryValue && categoryValue !== '') searchParams.categoryId = categoryValue;

    this.router.navigate(['/explore'], { queryParams: searchParams });
  }

  onQuickFilter(filterType: string, value: string): void {
    const queryParams: any = {};
    switch (filterType) {
      case 'workplaceType':
        queryParams.workplaceType = value;
        break;
      case 'jobType':
        queryParams.jobType = value;
        break;
      case 'experienceLevel':
        queryParams.experienceLevel = value;
        break;
    }
    this.router.navigate(['/explore'], { queryParams });
  }

  onStartJobSearching(): void {
    this.router.navigate(['/login']);
  }

  onPostJob(): void {
    this.router.navigate(['/login']);
  }

  isUserloggin() {
    this.isLoggin.set(this.AuthService.isLoggedIn());
    console.log(this.isLoggin());
  }

  private loadStats(): void {
    this.statsService.getPublicStats().subscribe({
      next: (stats: IPublicStats) => {
        this.stats.set(stats);
        console.log('Stats loaded:', stats);
      },
      error: (error: any) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  formatNumber(num: number): string {
    if (num >= 1000) {
      return Math.floor(num / 1000) + 'k+';
    }
    return num.toString();
  }

  calculateSuccessRate(): number {
    const totalJobs = this.stats().totalJobs || 1; // Avoid division by zero
    return this.stats().approvedJobs ? Math.round((this.stats().approvedJobs / totalJobs) * 100) : 0;
  }
}