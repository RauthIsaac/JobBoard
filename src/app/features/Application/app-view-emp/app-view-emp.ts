import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApplicationService } from '../application-service';
import { IemployerApplications } from '../../../shared/models/iemployer-applications';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { LoadingPage } from "../../../shared/components/loading-page/loading-page";

export enum ApplicationStatus {
  Pending = 0,
  UnderReview = 1,
  Interviewed = 2,
  Accepted = 3,
  Rejected = 4
}

@Component({
  selector: 'app-app-view-emp',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoadingPage],
  templateUrl: './app-view-emp.html',
  styleUrls: ['./app-view-emp.css']
})
export class AppViewEmp implements OnInit {
  applicationsList = signal<IemployerApplications[]>([]);
  isLoading = signal(false);
  
  searchTerm = signal('');
  selectedStatus = signal<string>('');
  
  ApplicationStatus = ApplicationStatus;
  appId = signal<number>(0);
  
  private searchSubject = new Subject<string>();
  private filterSubject = new Subject<void>();

  constructor(private appService: ApplicationService, private route: ActivatedRoute) {
    // Debounce search input
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchTerm.set(searchTerm);
      this.loadEmployerApplications();
    });

    // Debounce filter changes
    this.filterSubject.pipe(
      debounceTime(300)
    ).subscribe(() => {
      this.loadEmployerApplications();
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id && id > 0) {
        this.appId.set(id);
      }
    });

    this.loadEmployerApplications();
  }


  private loadEmployerApplications(): void {
    this.isLoading.set(true);

    const params: any = {};

    if (this.searchTerm().trim()) {
      params.searchValue = this.searchTerm().trim();
    }

    if (this.selectedStatus()) {
      params.status = this.selectedStatus();
    }

    this.appService.getEmployerApplications(params).subscribe({
      next: (apps: IemployerApplications[]) => {
        this.applicationsList.set(apps);
        this.isLoading.set(false);

        setTimeout(() => {
          const blocks = document.querySelectorAll<HTMLElement>('.fade-block');
          blocks.forEach((block, index) => {
            block.style.animationDelay = `${index * 0.25}s`;
            block.classList.add('visible');
          });
        }, 200);

        setTimeout(() => {
          const lines = document.querySelectorAll<HTMLElement>('.fade-line');
          lines.forEach((line, index) => {
            line.style.animationDelay = `${index * 0.1}s`;
            line.classList.add('visible');
          });
        }, 300);
      },
      error: (err) => {
        console.error('Error Fetching Data', err);
        this.isLoading.set(false);
      }
    });
  }


  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchSubject.next(input.value);
  }

  onStatusFilterClick(status: string): void {
    this.selectedStatus.set(status);
    this.filterSubject.next();
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
    // const statusLower = status.toLowerCase();
    switch (status) {
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

  getCardClass(status: ApplicationStatus): string {
    switch (status) {
      case ApplicationStatus.Pending: return 'new';
      case ApplicationStatus.UnderReview: return 'under-review';
      case ApplicationStatus.Interviewed: return 'interview';
      case ApplicationStatus.Accepted: return 'hired';
      case ApplicationStatus.Rejected: return 'rejected';
      default: return 'new';
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


  isStatusActive(status: string): boolean {
    return this.selectedStatus() === status;
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedStatus.set('');
    this.loadEmployerApplications();
  }

  hasActiveFilters(): boolean {
    return this.searchTerm() !== '' || this.selectedStatus() !== '';
  }

  trackByApplicationId(index: number, app: IemployerApplications): number {
    return app.id;
  }
}