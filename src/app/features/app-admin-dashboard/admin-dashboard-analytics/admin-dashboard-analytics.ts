import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../auth/auth-service';
import { AdminService, AdminStats, Employer, Job, Seeker } from '../admin-service';
import { SnackbarService } from '../../../shared/components/snackbar/snackbar-service';
import { LoadingPage } from '../../../shared/components/loading-page/loading-page';

type DetailType = 'seeker' | 'employer' | 'job';

@Component({
  standalone: true,
  selector: 'app-admin-dashboard-analytics',
  templateUrl: './admin-dashboard-analytics.html',
  styleUrls: ['./admin-dashboard-analytics.css'],
  imports: [
    CommonModule, DatePipe, CurrencyPipe, HttpClientModule,
    MatCardModule, MatButtonModule, MatIconModule, MatDividerModule,
    MatTabsModule, MatTableModule, MatSnackBarModule, MatProgressSpinnerModule,
    MatChipsModule, MatTooltipModule, LoadingPage
  ],
  providers: [AdminService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardAnalytics implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('userChart') userChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('jobStatusChart') jobStatusChartRef!: ElementRef<HTMLCanvasElement>;

  private destroy$ = new Subject<void>();
  private userChart?: Chart;
  private jobStatusChart?: Chart;
  private adminService = inject(AdminService);
  // private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Signals for state
  stats = signal<AdminStats>({ totalSeekers: 0, totalEmployers: 0, totalJobs: 0, pendingJobs: 0 });
  seekers = signal<Seeker[]>([]);
  employers = signal<Employer[]>([]);
  pendingJobs = signal<Job[]>([]);
  
  // Computed signals
  totalUsers = computed(() => this.stats().totalSeekers + this.stats().totalEmployers);
  approvedJobs = computed(() => this.stats().totalJobs - this.stats().pendingJobs);

  // Loading signals
  isLoadingStats = signal(true);
  isLoadingSeekers = signal(true);
  isLoadingEmployers = signal(true);
  isLoadingJobs = signal(true);
  isLoadingDetails = signal(false);

  // Table configurations
  seekerColumns = ['name', 'email', 'phoneNumber', 'address', 'skills', 'actions'];
  employerColumns = ['email', 'companyName', 'actions'];
  jobColumns = ['title', 'company', 'salary', 'actions'];

  // Other states
  showDetailsCard = signal(false);
  detailsType = signal<DetailType>('seeker');
  selectedSeeker = signal<Seeker | null>(null);
  selectedEmployer = signal<Employer | null>(null);
  selectedJob = signal<Job | null>(null);
  isLoggedIn = signal(false);

  // Confirmation modal signals
  showConfirmationModal = signal(false);
  confirmationTitle = signal('');
  confirmationMessage = signal('');
  private pendingAction: (() => void) | null = null;

  constructor(private snackbarService: SnackbarService) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.isLoggedIn.set(this.adminService.isLoggedIn());
    console.log('Is Logged In ? :', this.isLoggedIn());

    if (!this.isLoggedIn()) {
      this.showError('Authentication required. Please login first.');
      this.isLoadingStats.set(false);
      this.cdr.detectChanges();
      return;
    }

    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyCharts();
  }

  private loadDashboardData(): void {
    // Load stats first
    this.adminService.getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          console.log('API stats response:', stats);
          this.stats.set(stats);
          this.isLoadingStats.set(false);
          setTimeout(() => this.createCharts(), 0);
          this.cdr.detectChanges();
        },
        error: (error) => this.handleError(error, 'Stats')
      });

    // Load lists independently
    this.adminService.getAllSeekers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (seekers) => {
          this.seekers.set(seekers);
          this.isLoadingSeekers.set(false);
        },
        error: (error) => this.handleError(error, 'Seekers')
      });

    this.adminService.getAllEmployers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (employers) => {
          this.employers.set(employers);
          this.isLoadingEmployers.set(false);
        },
        error: (error) => this.handleError(error, 'Employers')
      });

    this.adminService.getPendingJobs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (jobs) => {
          this.pendingJobs.set(jobs);
          this.isLoadingJobs.set(false);
        },
        error: (error) => this.handleError(error, 'Jobs')
      });
  }

  // Confirmation Modal Methods
  confirmDeleteUser(userId: string): void {
    this.confirmationTitle.set('Delete User');
    this.confirmationMessage.set('Are you sure you want to delete this user? This action cannot be undone.');
    this.pendingAction = () => this.deleteUser(userId);
    this.showConfirmationModal.set(true);
  }

  confirmRejectJob(jobId: number): void {
    this.confirmationTitle.set('Reject Job');
    this.confirmationMessage.set('Are you sure you want to reject this job posting? This action cannot be undone.');
    this.pendingAction = () => this.rejectJob(jobId);
    this.showConfirmationModal.set(true);
  }

  confirmRejectJobAndClose(jobId: number | undefined): void {
    if (!jobId) {
      this.showError('No job selected');
      return;
    }
    this.confirmationTitle.set('Reject Job');
    this.confirmationMessage.set('Are you sure you want to reject this job posting? This action cannot be undone.');
    this.pendingAction = () => {
      this.rejectJob(jobId);
      this.closeDetails();
    };
    this.showConfirmationModal.set(true);
  }

  confirmAction(): void {
    if (this.pendingAction) {
      this.pendingAction();
      this.pendingAction = null;
    }
    this.showConfirmationModal.set(false);
  }

  cancelConfirmation(): void {
    this.pendingAction = null;
    this.showConfirmationModal.set(false);
  }

  deleteUser(userId: string): void {
    this.adminService.deleteUser(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('User deleted successfully');
          this.loadDashboardData();
          if (this.selectedSeeker()?.userId === userId || this.selectedEmployer()?.userId === userId) {
            this.closeDetails();
          }
        },
        error: (error) => this.showError(`Delete Error: ${error.message}`)
      });
  }

  approveJob(jobId: number): void {
    this.adminService.approveJob(jobId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Job approved successfully');
          this.loadDashboardData();
        },
        error: (error) => this.showError(`Approve Error: ${error.message}`)
      });
  }

  rejectJob(jobId: number): void {
    this.adminService.rejectJob(jobId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Job rejected successfully');
          this.loadDashboardData();
        },
        error: (error) => this.showError(`Reject Error: ${error.message}`)
      });
  }

  approveJobAndClose(jobId: number | undefined): void {
    if (!jobId) {
      this.showError('No job selected');
      return;
    }
    this.approveJob(jobId);
    this.closeDetails();
  }

  showSeekerDetails(seeker: Seeker): void {
    this.isLoadingDetails.set(true);
    this.detailsType.set('seeker');
    this.showDetailsCard.set(true);
    this.resetOtherSelections();

    this.adminService.getSeekerById(seeker.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detailedSeeker) => {
          this.selectedSeeker.set(detailedSeeker);
          this.isLoadingDetails.set(false);
        },
        error: (error) => {
          this.showError(`Error loading details: ${error.message}`);
          this.selectedSeeker.set(seeker);
          this.isLoadingDetails.set(false);
        }
      });
  }

  showEmployerDetails(employer: Employer): void {
    this.isLoadingDetails.set(true);
    this.detailsType.set('employer');
    this.showDetailsCard.set(true);
    this.resetOtherSelections();

    this.adminService.getEmployerById(employer.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detailedEmployer) => {
          this.selectedEmployer.set(detailedEmployer);
          this.isLoadingDetails.set(false);
        },
        error: (error) => {
          this.showError(`Error loading details: ${error.message}`);
          this.selectedEmployer.set(employer);
          this.isLoadingDetails.set(false);
        }
      });
  }

  showJobDetails(job: Job): void {
    this.selectedJob.set(job);
    this.detailsType.set('job');
    this.showDetailsCard.set(true);
    this.resetOtherSelections();
  }

  private resetOtherSelections(): void {
    if (this.detailsType() !== 'seeker') this.selectedSeeker.set(null);
    if (this.detailsType() !== 'employer') this.selectedEmployer.set(null);
    if (this.detailsType() !== 'job') this.selectedJob.set(null);
  }

  closeDetails(): void {
    this.showDetailsCard.set(false);
    this.selectedSeeker.set(null);
    this.selectedEmployer.set(null);
    this.selectedJob.set(null);
    this.isLoadingDetails.set(false);
  }

  private createCharts(): void {
    const ctxUser = this.userChartRef?.nativeElement?.getContext('2d');
    const ctxJob = this.jobStatusChartRef?.nativeElement?.getContext('2d');

    console.log('Creating charts with stats:', this.stats());
    console.log('User Chart Ref:', this.userChartRef);
    console.log('User Chart Context:', ctxUser);

    if (ctxUser && this.userChartRef.nativeElement && this.stats().totalSeekers >= 0 && this.stats().totalEmployers >= 0) {
      console.log('User Chart Data:', {
        seekers: this.stats().totalSeekers,
        employers: this.stats().totalEmployers
      });
      this.userChart?.destroy();
      this.userChart = new Chart(ctxUser, {
        type: 'bar',
        data: {
          labels: ['Job Seekers', 'Employers'],
          datasets: [{
            label: 'Total Users',
            data: [this.stats().totalSeekers, this.stats().totalEmployers],
            backgroundColor: ['rgba(59, 130, 246, 0.7)', 'rgba(40, 167, 69, 0.7)'],
            borderColor: ['#3b82f6', '#28a745'],
            borderWidth: 2,
            borderRadius: 8,
            hoverBackgroundColor: ['rgba(59, 130, 246, 0.9)', 'rgba(40, 167, 69, 0.9)']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { 
            legend: { 
              display: false 
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              cornerRadius: 8,
              titleFont: { size: 14, weight: 'bold' },
              bodyFont: { size: 13 }
            }
          },
          scales: { 
            y: { 
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                font: { size: 12, weight: 'bold' },
                color: '#6c757d'
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                font: { size: 12, weight: 'bold' },
                color: '#1e3a8a'
              }
            }
          },
          animation: {
            duration: 1000,
            easing: 'easeInOutQuart'
          }
        }
      });
    } else {
      console.warn('User Chart not created: Invalid canvas or data. Details - ctxUser:', ctxUser, 'nativeElement:', this.userChartRef?.nativeElement, 'Stats:', this.stats());
    }

    if (ctxJob && this.jobStatusChartRef.nativeElement && this.stats().totalJobs >= 0 && this.stats().pendingJobs >= 0) {
      console.log('Job Chart Data:', {
        approved: this.approvedJobs(),
        pending: this.stats().pendingJobs
      });
      this.jobStatusChart?.destroy();
      this.jobStatusChart = new Chart(ctxJob, {
        type: 'doughnut',
        data: {
          labels: ['Approved Jobs', 'Pending Jobs'],
          datasets: [{
            data: [this.approvedJobs(), this.stats().pendingJobs],
            backgroundColor: ['#3b82f6', '#6c757d'],
            borderColor: ['#ffffff', '#ffffff'],
            borderWidth: 3,
            hoverOffset: 10,
            hoverBorderWidth: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { 
            legend: { 
              position: 'bottom',
              labels: {
                padding: 20,
                font: { size: 13, weight: 'bold' },
                color: '#495057',
                usePointStyle: true,
                pointStyle: 'circle'
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              padding: 12,
              cornerRadius: 8,
              titleFont: { size: 14, weight: 'bold' },
              bodyFont: { size: 13 }
            }
          },
          animation: {
            animateRotate: true,
            animateScale: true,
            duration: 1000,
            easing: 'easeInOutQuart'
          }
        }
      });
    } else {
      console.warn('Job Chart not created: Invalid canvas or data. Details - ctxJob:', ctxJob, 'nativeElement:', this.jobStatusChartRef?.nativeElement, 'Stats:', this.stats());
    }
  }

  private destroyCharts(): void {
    this.userChart?.destroy();
    this.jobStatusChart?.destroy();
  }

  getGenderLabel(gender: any): string {
    if (gender === 0 || gender === '0') return 'Male';
    if (gender === 1 || gender === '1') return 'Female';
    if (gender === 'Male' || gender === 'Female') return gender;
    return 'N/A';
  }

  formatNumber(num: number): string {
    return num >= 1000 ? `${(num / 1000).toFixed(1)}K` : num.toString();
  }

  getGrowthPercentage(current: number, previous = 0): string {
    if (previous === 0) return '100';
    return Math.abs(((current - previous) / previous) * 100).toFixed(1);
  }


  private handleError(error: any, section: string): void {
    this.showError(`Error loading ${section}: ${error.message}`);
    if (section === 'Stats') this.isLoadingStats.set(false);
    else if (section === 'Seekers') this.isLoadingSeekers.set(false);
    else if (section === 'Employers') this.isLoadingEmployers.set(false);
    else if (section === 'Jobs') this.isLoadingJobs.set(false);
  }

  logout(): void {
    this.authService.clearAuthData();
    this.isLoggedIn.set(false);

    this.showSuccess('Logged out successfully', 3000);

    this.router.navigate(['/login']);
  }

  //#region Snackbar Methods
  showSuccess(message: string = 'Operation successful!', duration: number = 4000, action: string = 'Undo'): void {
    console.log('Showing success snackbar');
    this.snackbarService.show({
      message,
      type: 'success',
      duration,
      action
    });
  }

  showInfo(message: string = 'Information message', duration: number = 5000): void {
    this.snackbarService.show({
      message,
      type: 'info',
      duration
    });
  }

  showError(message: string = 'Something went wrong!', duration: number = 5000): void {
    this.snackbarService.show({
      message,
      type: 'error',
      duration
    });
  }

  //#endregion 
}