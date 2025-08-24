import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApplicationService } from '../application-service';
import { IemployerApplications } from '../../../shared/models/iemployer-applications';
import { ApplicationStatus } from '../../../shared/models/application-filter-params';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-app-view-emp',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app-view-emp.html',
  styleUrls: ['./app-view-emp.css']
})
export class AppViewEmp implements OnInit {
  originalApplicationsList = signal<IemployerApplications[]>([]);
  filteredApplicationsList = signal<IemployerApplications[]>([]);
  isLoading = signal(false);
  
  searchTerm = signal('');
  selectedJobTitle = signal<string | undefined>(undefined);
  selectedStatus = signal<ApplicationStatus | 'all'>('all');
  pageIndex = signal(1);
  pageSize = signal(10000); // Load all for client-side filtering
  
  availableJobs = signal<string[]>([]);
  
  statistics = computed(() => {
    const apps = this.filteredApplicationsList();
    return {
      total: apps.length,
      new: apps.filter(app => app.status === ApplicationStatus.Pending).length,
      thisMonth: apps.filter(app => {
        const appliedDate = new Date(app.appliedDate);
        const now = new Date();
        return appliedDate.getMonth() === now.getMonth() && 
               appliedDate.getFullYear() === now.getFullYear();
      }).length,
      interviews: apps.filter(app => app.status === ApplicationStatus.Interviewed).length
    };
  });

  ApplicationStatus = ApplicationStatus;
  
  private searchSubject = new Subject<string>();
  private filterChangeSubject = new Subject<void>();

  constructor(private appService: ApplicationService) {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchTerm.set(searchTerm);
      this.applyClientSideFilters();
    });

    this.filterChangeSubject.pipe(
      debounceTime(300)
    ).subscribe(() => {
      this.applyClientSideFilters();
    });
  }

  ngOnInit(): void {
    this.loadEmployerApplications();
  }

  private loadEmployerApplications(): void {
    this.isLoading.set(true);
    const params: any = { pageIndex: this.pageIndex(), pageSize: this.pageSize() };
    this.appService.getEmployerApplications(params).subscribe({
      next: (apps: IemployerApplications[]) => {
        this.originalApplicationsList.set(apps);
        this.extractUniqueJobs(apps);
        this.applyClientSideFilters();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error Fetching Data', err);
        this.isLoading.set(false);
      }
    });
  }

  private applyClientSideFilters(): void {
    let filtered = [...this.originalApplicationsList()];

    const searchTerm = this.searchTerm().toLowerCase().trim();
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.applicantName.toLowerCase().includes(searchTerm) ||
        app.jobTitle.toLowerCase().includes(searchTerm) ||
        app.currentPosition.toLowerCase().includes(searchTerm)
      );
    }

    const jobTitle = this.selectedJobTitle();
    if (jobTitle) {
      filtered = filtered.filter(app => app.jobTitle === jobTitle);
    }

    const status = this.selectedStatus();
    if (status !== 'all') {
      filtered = filtered.filter(app => app.status === status);
    }

    this.filteredApplicationsList.set(filtered);
  }

  private extractUniqueJobs(apps: IemployerApplications[]): void {
    const uniqueJobs = Array.from(new Set(apps.map(app => app.jobTitle)));
    this.availableJobs.set(uniqueJobs);
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchSubject.next(input.value);
  }

  onJobFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedJobTitle.set(select.value || undefined);
    this.filterChangeSubject.next();
  }

  onStatusFilterClick(status: ApplicationStatus | 'all'): void {
    this.selectedStatus.set(status);
    this.filterChangeSubject.next();
  }

  updateApplicationStatus(applicationId: number, status: ApplicationStatus): void {
    this.appService.updateApplicationStatus(applicationId, status).subscribe({
      next: () => this.loadEmployerApplications(),
      error: (err) => console.error('Error updating status:', err)
    });
  }

  getStatusDisplay(status: ApplicationStatus): string {
    switch (status) {
      case ApplicationStatus.Pending: return 'New';
      case ApplicationStatus.UnderReview: return 'Under Review';
      case ApplicationStatus.Interviewed: return 'Interview';
      case ApplicationStatus.Accepted: return 'Hired';
      case ApplicationStatus.Rejected: return 'Rejected';
      default: return 'Unknown';
    }
  }

  getStatusClass(status: string): string {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'pending':
      case 'new':
        return 'status-new';
      case 'underreview':
      case 'under review':
        return 'status-under-review';
      case 'interviewed':
      case 'interview':
        return 'status-interview';
      case 'accepted':
      case 'hired':
        return 'status-hired';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-new';
    }
  }

  getCardClass(status: string): string {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'pending':
      case 'new':
        return 'new';
      case 'underreview':
      case 'under review':
        return 'under-review';
      case 'interviewed':
      case 'interview':
        return 'interview';
      case 'accepted':
      case 'hired':
        return 'hired';
      case 'rejected':
        return 'rejected';
      default:
        return 'new';
    }
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  getInitialsClass(name: string): string {
    const classes = ['initials-sc', 'initials-ar', 'initials-ew', 'initials-mb', 'initials-lp'];
    const hash = name.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
    return classes[Math.abs(hash) % classes.length];
  }

  viewProfile(applicationId: number): void {
    console.log('View profile for application:', applicationId);
  }

  scheduleInterview(applicationId: number): void {
    if (confirm('Schedule interview for this application?')) {
      this.updateApplicationStatus(applicationId, ApplicationStatus.Interviewed);
    }
  }

  rejectApplication(applicationId: number): void {
    if (confirm('Are you sure you want to reject this application?')) {
      this.updateApplicationStatus(applicationId, ApplicationStatus.Rejected);
    }
  }

  refreshApplications(): void {
    this.loadEmployerApplications();
  }

  isStatusActive(status: ApplicationStatus | 'all'): boolean {
    return this.selectedStatus() === status;
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedJobTitle.set(undefined);
    this.selectedStatus.set('all');
    this.applyClientSideFilters();
  }

  trackByApplicationId(index: number, app: IemployerApplications): number {
    return app.id;
  }
}