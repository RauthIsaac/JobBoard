import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { JobsService } from '../../Jobs/jobs-service';
import { IJob } from '../../../shared/models/ijob';
import { ICategory } from '../../../shared/models/icategory';
import { JobView } from '../../Jobs/job-view/job-view';
import { AuthService } from '../../../auth/auth-service';
import { CommonModule } from '@angular/common';

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

  // Form controls for search
  searchControl = new FormControl('');
  locationControl = new FormControl('');
  categoryControl = new FormControl('');

  constructor(
    private jobService: JobsService,
    private router: Router,
    private AuthService: AuthService
  ) {}

  ngOnInit(): void {
    window.scrollTo(0, 0);

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

  // Handle main search form submission
  onSearchSubmit(): void {
    const searchParams: any = {};

    const searchValue = this.searchControl.value?.trim();
    const locationValue = this.locationControl.value?.trim();
    const categoryValue = this.categoryControl.value;

    if (searchValue) {
      searchParams.search = searchValue;
    }
    if (locationValue) {
      searchParams.location = locationValue;
    }
    if (categoryValue && categoryValue !== '') {
      searchParams.categoryId = categoryValue;
    }

    this.router.navigate(['/explore'], { queryParams: searchParams });
  }

  // Handle quick filter buttons
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

  // Handle "Start Job Searching" button
  onStartJobSearching(): void {
    this.router.navigate(['/login']);
  }

  // Handle "Post Your First Job" button  
  onPostJob(): void {
    this.router.navigate(['/login']);
  }

  isUserloggin(){
    this.isLoggin.set(this.AuthService.isLoggedIn());
    console.log(this.isLoggin());
  }


}
