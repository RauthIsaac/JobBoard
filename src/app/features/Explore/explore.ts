import { Component, computed, signal, OnInit, OnDestroy, effect } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { JobsService } from '../Jobs/jobs-service';
import { IJob } from '../../shared/models/ijob';
import { ICategory } from '../../shared/models/icategory';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { JobFilterParams, SortingOptions } from '../../shared/models/job-filter-params';
import { JobExploreView } from '../Jobs/job-explore-view/job-explore-view';

@Component({
  selector: 'app-explore',
  imports: [JobExploreView, FormsModule, ReactiveFormsModule],
  templateUrl: './explore.html',
  styleUrl: './explore.css'
})
export class Explore implements OnInit, OnDestroy {
  
  /* Signals from service */
  jobsList = computed(() => this.jobService.JobsList());
  isLoading = computed(() => this.jobService.isLoading());
  error = computed(() => this.jobService.error());
  categories = signal<ICategory[]>([]);

  /* Search term signals */
  searchTerm = signal<string>('');
  locationSearchTerm = signal<string>('');

  /* Sorting option signal */
  selectedSorting = signal<SortingOptions>(SortingOptions.DateDesc);

  /* Pagination signals - Managed locally in component */
  currentPageIndex = signal<number>(1); // This is the actual page index sent to API
  pageSize = signal<number>(10);
  totalJobs = signal<number>(0); // You'll need to estimate or get this from somewhere
  totalPages = computed(() => Math.ceil(this.totalJobs() / this.pageSize()));

  // For display purposes
  currentPage = computed(() => this.currentPageIndex());

  Math = Math;

  private subscriptions: Subscription[] = [];

  jobTypes = [
    { value: '', label: 'All Job Types' },
    { value: 'FullTime', label: 'Full Time' },
    { value: 'PartTime', label: 'Part Time' },
    { value: 'Freelance', label: 'Freelance' },
    { value: 'Internship', label: 'Internship' },
    { value: 'Temporary', label: 'Temporary' },
    { value: 'Contract', label: 'Contract' }
  ];

  WorkplaceType = [
    { value: '', label: 'All Workplace Types' },
    { value: 'Remote', label: 'Remote' },
    { value: 'OnSite', label: 'On Site' },
    { value: 'Hybrid', label: 'Hybrid' }
  ];

  EducationLevel = [
    { value: '', label: 'All Education Levels' },
    { value: 'HighSchool', label: 'High School' },
    { value: 'Bachelor', label: 'Bachelor' },
    { value: 'Diploma', label: 'Diploma' },
    { value: 'Master', label: 'Master' },
    { value: 'Doctorate', label: 'Doctorate' }
  ];

  ExperienceLevel = [
    { value: '', label: 'All Experience Levels' },
    { value: 'Student', label: 'Student' },
    { value: 'Internship', label: 'Internship' },
    { value: 'EntryLevel', label: 'Entry Level' },
    { value: 'Experienced', label: 'Experienced' },
    { value: 'TeamLeader', label: 'Team Leader' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Director', label: 'Director' },
    { value: 'Executive', label: 'Executive' }
  ];

  sortingOptions = [
    { value: SortingOptions.DateDesc, label: 'Date Recent-Late' },
    { value: SortingOptions.DateAsc, label: 'Date Late-Recent' },
    { value: SortingOptions.SalaryDesc, label: 'Salary High-Low' },
    { value: SortingOptions.SalaryAsc, label: 'Salary Low-High' }
  ];

  pageSizeOptions = [
    { value: 5, label: '5 per page' },
    { value: 10, label: '10 per page' },
    { value: 20, label: '20 per page' },
    { value: 50, label: '50 per page' }
  ];

  /* Reactive form for filters */
  filtersForm = new FormGroup({
    jobType: new FormControl(''),
    workplaceType: new FormControl(''),
    educationLevel: new FormControl(''),
    experienceLevel: new FormControl(''),
    categoryId: new FormControl('')
  });

  /* Search form controls */
  searchControl = new FormControl('');
  locationSearchControl = new FormControl('');

  /* Sorting form control */
  sortingControl = new FormControl(SortingOptions.DateDesc);

  /* Page size form control */
  pageSizeControl = new FormControl(10);

  constructor(
    private jobService: JobsService,
    private route: ActivatedRoute
  ) {
    // Use effect to react to changes in jobsList signal
    effect(() => {
      const jobs = this.jobsList();
      this.updateTotalJobsEstimateFromJobs(jobs);
    });
  }

  ngOnInit(): void {
    // Load categories
    this.loadCategories();

    // Subscribe to query parameters first
    const routeSub = this.route.queryParams.subscribe(params => {
      this.handleQueryParams(params);
    });
    this.subscriptions.push(routeSub);

    /* Subscribe to search input changes with debounce */
    const searchSub = this.searchControl.valueChanges.pipe(
      debounceTime(500), 
      distinctUntilChanged() 
    ).subscribe(searchValue => {
      this.searchTerm.set(searchValue || '');
      this.currentPageIndex.set(1); // Reset to first page
      this.applyFilters();
    });

    /* Subscribe to location search input changes with debounce */
    const locationSearchSub = this.locationSearchControl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(locationValue => {
      this.locationSearchTerm.set(locationValue || '');
      this.currentPageIndex.set(1); // Reset to first page
      this.applyFilters();
    });

    /* Subscribe to sorting changes */
    const sortingSub = this.sortingControl.valueChanges.subscribe(sortValue => {
      this.selectedSorting.set(sortValue || SortingOptions.DateDesc);
      this.applyFilters();
    });

    /* Subscribe to page size changes */
    const pageSizeSub = this.pageSizeControl.valueChanges.subscribe(pageSize => {
      this.pageSize.set(pageSize || 10);
      this.currentPageIndex.set(1); // Reset to first page
      this.applyFilters();
    });

    /* Subscribe to filter changes */
    const filterSub = this.filtersForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPageIndex.set(1); // Reset to first page when filters change
      this.applyFilters();
    });

    this.subscriptions.push(searchSub, locationSearchSub, sortingSub, pageSizeSub, filterSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private updateTotalJobsEstimateFromJobs(jobs: IJob[]): void {
    // This runs whenever the jobsList signal changes
    const currentJobs = jobs.length;
    const currentPageIdx = this.currentPageIndex();
    const pageSz = this.pageSize();

    if (currentJobs < pageSz) {
      // Last page - we know the exact total
      this.totalJobs.set((currentPageIdx - 1) * pageSz + currentJobs);
    } else {
      // Full page - there might be more, estimate conservatively
      this.totalJobs.set(currentPageIdx * pageSz + pageSz);
    }
  }

  private updateTotalJobsEstimate(): void {
    // This runs after each API call to estimate total
    const currentJobs = this.jobsList().length;
    const currentPageIdx = this.currentPageIndex();
    const pageSz = this.pageSize();

    if (currentJobs < pageSz) {
      // Last page - we know the exact total
      this.totalJobs.set((currentPageIdx - 1) * pageSz + currentJobs);
    } else {
      // Full page - there might be more, estimate conservatively
      this.totalJobs.set(currentPageIdx * pageSz + pageSz);
    }
  }

  private loadCategories(): void {
    this.jobService.GetAllJobsCategories().subscribe({
      next: (categories: ICategory[]) => {
        this.categories.set(categories);
        console.log('Categories loaded:', categories);
      },
      error: (error: any) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  private handleQueryParams(params: any): void {
    console.log('Received query params:', params);
    
    // Handle search parameter
    if (params['search']) {
      const searchValue = params['search'];
      this.searchControl.setValue(searchValue, { emitEvent: false });
      this.searchTerm.set(searchValue);
      console.log('Setting search term:', searchValue);
    }

    // Handle location parameter
    if (params['location']) {
      const locationValue = params['location'];
      this.locationSearchControl.setValue(locationValue, { emitEvent: false });
      this.locationSearchTerm.set(locationValue);
      console.log('Setting location search term:', locationValue);
    }

    // Handle filter parameters
    const filterUpdates: any = {};
    
    if (params['categoryId']) {
      filterUpdates.categoryId = params['categoryId'];
      console.log('Setting categoryId:', params['categoryId']);
    }
    
    if (params['jobType']) {
      filterUpdates.jobType = params['jobType'];
      console.log('Setting jobType:', params['jobType']);
    }
    
    if (params['workplaceType']) {
      filterUpdates.workplaceType = params['workplaceType'];
      console.log('Setting workplaceType:', params['workplaceType']);
    }
    
    if (params['experienceLevel']) {
      filterUpdates.experienceLevel = params['experienceLevel'];
      console.log('Setting experienceLevel:', params['experienceLevel']);
    }
    
    if (params['educationLevel']) {
      filterUpdates.educationLevel = params['educationLevel'];
      console.log('Setting educationLevel:', params['educationLevel']);
    }

    // Update form with query parameters
    if (Object.keys(filterUpdates).length > 0) {
      this.filtersForm.patchValue(filterUpdates, { emitEvent: false });
      console.log('Updated form with filters:', filterUpdates);
    }

    // Handle sorting parameter
    if (params['sort']) {
      const sortValue = parseInt(params['sort']) as SortingOptions;
      this.sortingControl.setValue(sortValue, { emitEvent: false });
      this.selectedSorting.set(sortValue);
      console.log('Setting sort:', sortValue);
    }

    // Handle pagination parameters
    if (params['page']) {
      const pageValue = parseInt(params['page']) || 1;
      this.currentPageIndex.set(pageValue);
      console.log('Setting page:', pageValue);
    }

    if (params['pageSize']) {
      const pageSizeValue = parseInt(params['pageSize']) || 10;
      this.pageSize.set(pageSizeValue);
      this.pageSizeControl.setValue(pageSizeValue, { emitEvent: false });
      console.log('Setting pageSize:', pageSizeValue);
    }

    this.applyFilters();
  }

  private applyFilters(): void {
    const searchValue = this.searchTerm().trim();
    const locationValue = this.locationSearchTerm().trim();
    const categoryId = this.filtersForm.get('categoryId')?.value;
    const jobType = this.filtersForm.get('jobType')?.value;
    const workplaceType = this.filtersForm.get('workplaceType')?.value;
    const educationLevel = this.filtersForm.get('educationLevel')?.value;
    const experienceLevel = this.filtersForm.get('experienceLevel')?.value;
    
    console.log('Form values:', {
      searchValue,
      locationValue,
      categoryId,
      jobType,
      workplaceType,
      educationLevel,
      experienceLevel,
      currentPageIndex: this.currentPageIndex(),
      pageSize: this.pageSize()
    });

    const filters: JobFilterParams = {
      isActive: true, 
      pageIndex: this.currentPageIndex(), // Use the local pageIndex
      pageSize: this.pageSize(),
    };

    // Add search value if exists
    if (searchValue) {
      filters.searchValue = searchValue;
    }

    // Add location search if exists
    if (locationValue) {
      filters.searchByLocationValue = locationValue;
    }

    // Add category filter if exists
    if (categoryId && categoryId !== '' && categoryId !== null) {
      filters.categoryId = parseInt(categoryId.toString());
    }

    // Add other filters if they exist
    if (jobType && jobType !== '') {
      filters.jobType = jobType;
    }

    if (workplaceType && workplaceType !== '') {
      filters.workplaceType = workplaceType;
    }

    if (educationLevel && educationLevel !== '') {
      filters.educationLevel = educationLevel;
    }

    if (experienceLevel && experienceLevel !== '') {
      filters.experienceLevel = experienceLevel;
    }

    // Add sorting
    filters.sortingOption = this.selectedSorting();

    console.log('Final filters being sent to API:', filters);

    // Call the service - the effect will handle updating total jobs estimate
    this.jobService.GetFilteredJobs(filters);
  }

  // Quick filter methods for popular searches
  applyQuickFilter(filterType: 'workplaceType' | 'jobType' | 'experienceLevel', value: string): void {
    this.filtersForm.patchValue({
      [filterType]: value
    });
    this.currentPageIndex.set(1); // Reset to first page
  }

  // Clear all filters
  clearAllFilters(): void {
    this.filtersForm.reset({}, { emitEvent: false });
    this.searchControl.setValue('', { emitEvent: false });
    this.locationSearchControl.setValue('', { emitEvent: false });
    this.sortingControl.setValue(SortingOptions.DateDesc, { emitEvent: false });
    this.pageSizeControl.setValue(10, { emitEvent: false });
    this.searchTerm.set('');
    this.locationSearchTerm.set('');
    this.selectedSorting.set(SortingOptions.DateDesc);
    this.currentPageIndex.set(1);
    this.pageSize.set(10);
    
    // Apply filters with reset values
    this.applyFilters();
  }

  // Manual search trigger (for search button if needed)
  onSearch(): void {
    const searchValue = this.searchControl.value;
    this.searchTerm.set(searchValue || '');
    this.currentPageIndex.set(1);
    this.applyFilters();
  }

  // Manual location search trigger
  onLocationSearch(): void {
    const locationValue = this.locationSearchControl.value;
    this.locationSearchTerm.set(locationValue || '');
    this.currentPageIndex.set(1);
    this.applyFilters();
  }

  // Handle sorting change
  onSortingChange(event: any): void {
    const sortValue = parseInt(event.target.value) as SortingOptions;
    this.sortingControl.setValue(sortValue);
  }

  // Handle page size change
  onPageSizeChange(event: any): void {
    const pageSize = parseInt(event.target.value);
    this.pageSizeControl.setValue(pageSize);
  }

  // FIXED Pagination methods
  goToPage(page: number): void {
    console.log(`Attempting to go to page: ${page}, Total pages: ${this.totalPages()}`);
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPageIndex.set(page); // Update the page index
      this.applyFilters(); // Call API with new page index
      console.log(`Successfully moved to page: ${this.currentPageIndex()}`);
    } else {
      console.log(`Invalid page number: ${page}`);
    }
  }

  goToPreviousPage(): void {
    const current = this.currentPageIndex();
    const total = this.totalPages();
    console.log(`Previous page - Current: ${current}, Total: ${total}`);
    
    if (current > 1) {
      this.currentPageIndex.set(current - 1); // Decrease page index
      this.applyFilters(); // Call API with new page index
      console.log(`Moved to previous page: ${this.currentPageIndex()}`);
    } else {
      console.log('Already on first page');
    }
  }

  goToNextPage(): void {
    const current = this.currentPageIndex();
    const total = this.totalPages();
    console.log(`Next page - Current: ${current}, Total: ${total}`);
    
    if (current < total) {
      this.currentPageIndex.set(current + 1); // Increase page index
      this.applyFilters(); // Call API with new page index
      console.log(`Moved to next page: ${this.currentPageIndex()}`);
    } else {
      console.log('Already on last page');
    }
  }

  // Get visible page numbers for pagination
  getVisiblePages(): number[] {
    const current = this.currentPage();
    const total = this.totalPages();
    const pages: number[] = [];

    if (total <= 7) {
      // Show all pages if total is 7 or less
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (current <= 4) {
        // Near the beginning
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(total);
      } else if (current >= total - 3) {
        // Near the end
        pages.push(-1); // Ellipsis
        for (let i = total - 4; i <= total; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push(-1); // Ellipsis
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(total);
      }
    }

    return pages;
  }

  // Get jobs count
  getJobsCount(): number {
    return this.totalJobs();
  }

  // Check if any filters are applied
  hasActiveFilters(): boolean {
    const formValues = this.filtersForm.value;
    const hasFormFilters = Object.values(formValues).some(value => value && value !== '');
    const hasSearch = this.searchTerm().trim() !== '';
    const hasLocationSearch = this.locationSearchTerm().trim() !== '';
    return hasFormFilters || hasSearch || hasLocationSearch;
  }
}