import { Component, computed, signal, OnInit, OnDestroy } from '@angular/core';
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

  /* Search term signal */
  searchTerm = signal<string>('');

  /* Sorting option signal */
  selectedSorting = signal<SortingOptions>(SortingOptions.DateDesc);

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

  /* Reactive form for filters */
  filtersForm = new FormGroup({
    jobType: new FormControl(''),
    workplaceType: new FormControl(''),
    educationLevel: new FormControl(''),
    experienceLevel: new FormControl(''),
    categoryId: new FormControl('')
  });

  /* Search form control */
  searchControl = new FormControl('');

  /* Sorting form control */
  sortingControl = new FormControl(SortingOptions.DateDesc);

  constructor(
    private jobService: JobsService,
    private route: ActivatedRoute
  ) {}

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
      debounceTime(500), // Wait 500ms after user stops typing
      distinctUntilChanged() // Only emit when value actually changes
    ).subscribe(searchValue => {
      this.searchTerm.set(searchValue || '');
      this.applyFilters();
    });

    /* Subscribe to sorting changes */
    const sortingSub = this.sortingControl.valueChanges.subscribe(sortValue => {
      this.selectedSorting.set(sortValue || SortingOptions.DateDesc);
      this.applyFilters();
    });

    /* Subscribe to filter changes */
    const filterSub = this.filtersForm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.applyFilters();
    });

    this.subscriptions.push(searchSub, sortingSub, filterSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
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

    // Handle location parameter (for future use)
    if (params['location']) {
      // You can add location handling here when implementing location filter
      console.log('Location filter:', params['location']);
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


    this.applyFilters();
  }

  private applyFilters(): void {
    const searchValue = this.searchTerm().trim();
    const categoryId = this.filtersForm.get('categoryId')?.value;
    const jobType = this.filtersForm.get('jobType')?.value;
    const workplaceType = this.filtersForm.get('workplaceType')?.value;
    const educationLevel = this.filtersForm.get('educationLevel')?.value;
    const experienceLevel = this.filtersForm.get('experienceLevel')?.value;
    
    console.log('Form values:', {
      searchValue,
      categoryId,
      jobType,
      workplaceType,
      educationLevel,
      experienceLevel
    });

    const filters: JobFilterParams = {
      isActive: true, // Always show only active jobs
    };

    // Add search value if exists
    if (searchValue) {
      filters.searchValue = searchValue;
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

    // If only isActive is set, get all jobs, otherwise get filtered jobs
    const filterKeys = Object.keys(filters);
    const hasRealFilters = filterKeys.some(key => key !== 'isActive' && key !== 'sortingOption');
    
    if (!hasRealFilters && filters.sortingOption === SortingOptions.DateDesc) {
      console.log('No filters applied, getting all jobs');
      this.jobService.GetAllJobs();
    } else {
      console.log('Applying filters:', filters);
      this.jobService.GetFilteredJobs(filters);
    }
  }

  // Quick filter methods for popular searches
  applyQuickFilter(filterType: 'workplaceType' | 'jobType' | 'experienceLevel', value: string): void {
    this.filtersForm.patchValue({
      [filterType]: value
    });
  }

  // Clear all filters
  clearAllFilters(): void {
    this.filtersForm.reset({}, { emitEvent: false });
    this.searchControl.setValue('', { emitEvent: false });
    this.sortingControl.setValue(SortingOptions.DateDesc, { emitEvent: false });
    this.searchTerm.set('');
    this.selectedSorting.set(SortingOptions.DateDesc);
    
    // Load all jobs
    this.jobService.GetAllJobs();
  }

  // Manual search trigger (for search button if needed)
  onSearch(): void {
    const searchValue = this.searchControl.value;
    this.searchTerm.set(searchValue || '');
    this.applyFilters();
  }

  // Handle sorting change
  onSortingChange(event: any): void {
    const sortValue = parseInt(event.target.value) as SortingOptions;
    this.sortingControl.setValue(sortValue);
  }

  // Get jobs count
  getJobsCount(): number {
    return this.jobsList().length;
  }

  // Check if any filters are applied
  hasActiveFilters(): boolean {
    const formValues = this.filtersForm.value;
    const hasFormFilters = Object.values(formValues).some(value => value && value !== '');
    const hasSearch = this.searchTerm().trim() !== '';
    return hasFormFilters || hasSearch;
  }
}