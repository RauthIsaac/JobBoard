import { Component, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { JobsService } from '../Jobs/jobs-service';
import { IJob } from '../../shared/models/ijob';
import { JobView } from '../Jobs/job-view/job-view';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { JobFilterParams, SortingOptions } from '../../shared/models/job-filter-params';


@Component({
  selector: 'app-explore',
  imports: [JobView, FormsModule, ReactiveFormsModule],
  templateUrl: './explore.html',
  styleUrl: './explore.css'
})
export class Explore implements OnInit, OnDestroy {
  
  /* Signals from service */
  jobsList = computed(() => this.jobService.JobsList());
  isLoading = computed(() => this.jobService.isLoading());
  error = computed(() => this.jobService.error());

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
    experienceLevel: new FormControl('')
  });

  /* Search form control */
  searchControl = new FormControl('');

  /* Sorting form control */
  sortingControl = new FormControl(SortingOptions.DateDesc);

  constructor(private jobService: JobsService) {}

  ngOnInit(): void {
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

  private applyFilters(): void {
    const filters: JobFilterParams = {
      searchValue: this.searchTerm() || undefined,
      jobType: this.filtersForm.get('jobType')?.value || undefined,
      workplaceType: this.filtersForm.get('workplaceType')?.value || undefined,
      educationLevel: this.filtersForm.get('educationLevel')?.value || undefined,
      experienceLevel: this.filtersForm.get('experienceLevel')?.value || undefined,
      sortingOption: this.selectedSorting(),
      isActive: true, // Only show active jobs
    };

    // Remove empty string values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof JobFilterParams] === '') {
        delete filters[key as keyof JobFilterParams];
      }
    });

    console.log('Applying filters:', filters);
    this.jobService.GetFilteredJobs(filters);
  }

  // Quick filter methods for popular searches
  applyQuickFilter(filterType: 'workplaceType' | 'jobType' | 'experienceLevel', value: string): void {
    this.filtersForm.patchValue({
      [filterType]: value
    });
  }

  // Clear all filters
  clearAllFilters(): void {
    this.filtersForm.reset();
    this.searchControl.setValue('');
    this.sortingControl.setValue(SortingOptions.DateDesc);
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