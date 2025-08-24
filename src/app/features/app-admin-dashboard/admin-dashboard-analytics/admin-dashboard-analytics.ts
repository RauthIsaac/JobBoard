import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { Chart, registerables } from 'chart.js';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { AdminService, AdminStats, Employer, Job, Seeker } from '../admin-service';

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
    MatChipsModule, MatTooltipModule
  ],
  providers: [AdminService]
})
export class AdminDashboardAnalytics implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('userChart') userChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('jobStatusChart') jobStatusChartRef!: ElementRef<HTMLCanvasElement>;

  private destroy$ = new Subject<void>();
  private userChart?: Chart;
  private jobStatusChart?: Chart;

  // Loading states
  isLoading = true;
  isLoadingSeekers = true;
  isLoadingEmployers = true;
  isLoadingJobs = true;
  isLoadingDetails = false;

  // Data
  stats: AdminStats = { totalSeekers: 0, totalEmployers: 0, totalJobs: 0, pendingJobs: 0 };
  seekers: Seeker[] = [];
  employers: Employer[] = [];
  pendingJobs: Job[] = [];

  // Table configurations
  seekerColumns = ['name', 'email', 'phoneNumber', 'address', 'skills', 'actions'];
  employerColumns = ['email', 'companyName', 'actions'];
  jobColumns = ['title', 'company', 'salary', 'actions'];

  // Details modal
  showDetailsCard = false;
  detailsType: DetailType = 'seeker';
  selectedSeeker: Seeker | null = null;
  selectedEmployer: Employer | null = null;
  selectedJob: Job | null = null;

  constructor(private adminService: AdminService, private snackBar: MatSnackBar, private cdr: ChangeDetectorRef) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
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
    if (!this.adminService.isLoggedIn()) {
      this.showMessage('Authentication required. Please login first.');
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    const requests = {
      stats: this.adminService.getStats(),
      seekers: this.adminService.getAllSeekers(),
      employers: this.adminService.getAllEmployers(),
      pendingJobs: this.adminService.getPendingJobs()
    };

    forkJoin(requests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.stats = response.stats;
          this.seekers = response.seekers;
          this.employers = response.employers;
          this.pendingJobs = response.pendingJobs;

          this.isLoadingSeekers = false;
          this.isLoadingEmployers = false;
          this.isLoadingJobs = false;
          this.isLoading = false;

          this.cdr.detectChanges();
          this.destroyCharts();
          this.createCharts();
        },
        error: (error) => {
          this.showMessage(`Error: ${error.message}`);
        },
        complete: () => {
          this.isLoading = false;
          this.isLoadingSeekers = false;
          this.isLoadingEmployers = false;
          this.isLoadingJobs = false;
          this.cdr.detectChanges();
        }
      });
  }

  // User actions
  deleteUser(userId: string): void {
    if (!confirm('Are you sure you want to delete this user?')) return;

    this.adminService.deleteUser(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showMessage('User deleted successfully');
          this.loadDashboardData();
          if (this.selectedSeeker?.userId === userId || this.selectedEmployer?.userId === userId) {
            this.closeDetails();
          }
        },
        error: (error) => this.showMessage(`Delete Error: ${error.message}`)
      });
  }

  approveJob(jobId: number): void {
    this.adminService.approveJob(jobId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showMessage('Job approved successfully');
          this.loadDashboardData();
        },
        error: (error) => this.showMessage(`Approve Error: ${error.message}`)
      });
  }

  rejectJob(jobId: number): void {
    if (!confirm('Are you sure you want to reject this job?')) return;

    this.adminService.rejectJob(jobId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showMessage('Job rejected successfully');
          this.loadDashboardData();
        },
        error: (error) => this.showMessage(`Reject Error: ${error.message}`)
      });
  }

  // Details modal methods
  showSeekerDetails(seeker: Seeker): void {
    this.isLoadingDetails = true;
    this.detailsType = 'seeker';
    this.showDetailsCard = true;
    this.resetOtherSelections();

    this.adminService.getSeekerById(seeker.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detailedSeeker) => {
          this.selectedSeeker = detailedSeeker;
          this.isLoadingDetails = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.showMessage(`Error loading details: ${error.message}`);
          this.selectedSeeker = seeker;
          this.isLoadingDetails = false;
          this.cdr.detectChanges();
        }
      });
  }

  showEmployerDetails(employer: Employer): void {
    this.isLoadingDetails = true;
    this.detailsType = 'employer';
    this.showDetailsCard = true;
    this.resetOtherSelections();

    this.adminService.getEmployerById(employer.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detailedEmployer) => {
          this.selectedEmployer = detailedEmployer;
          this.isLoadingDetails = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.showMessage(`Error loading details: ${error.message}`);
          this.selectedEmployer = employer;
          this.isLoadingDetails = false;
          this.cdr.detectChanges();
        }
      });
  }

  showJobDetails(job: Job): void {
    this.selectedJob = job;
    this.detailsType = 'job';
    this.showDetailsCard = true;
    this.resetOtherSelections();
  }

  private resetOtherSelections(): void {
    if (this.detailsType !== 'seeker') this.selectedSeeker = null;
    if (this.detailsType !== 'employer') this.selectedEmployer = null;
    if (this.detailsType !== 'job') this.selectedJob = null;
  }

  closeDetails(): void {
    this.showDetailsCard = false;
    this.selectedSeeker = null;
    this.selectedEmployer = null;
    this.selectedJob = null;
    this.isLoadingDetails = false;
  }

private createCharts(): void {
  if (this.userChart) this.userChart.destroy();
  if (this.jobStatusChart) this.jobStatusChart.destroy();

  const ctxUser = this.userChartRef?.nativeElement?.getContext('2d');
  const ctxJob = this.jobStatusChartRef?.nativeElement?.getContext('2d');

  if (ctxUser && this.stats.totalSeekers > 0 && this.stats.totalEmployers > 0) {
    this.userChart = new Chart(ctxUser, {
      type: 'bar',
      data: {
        labels: ['Job Seekers', 'Employers'],
        datasets: [{
          label: 'Total Users',
          data: [this.stats.totalSeekers, this.stats.totalEmployers],
          backgroundColor: ['rgba(108, 117, 125, 0.3)', 'rgba(40, 167, 69, 0.3)'],
          borderColor: ['#6c757d', '#28a745'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  if (ctxJob && this.stats.totalJobs > 0 && this.stats.pendingJobs >= 0) {
    const approvedJobs = this.stats.totalJobs - this.stats.pendingJobs;
    this.jobStatusChart = new Chart(ctxJob, {
      type: 'doughnut',
      data: {
        labels: ['Approved Jobs', 'Pending Jobs'],
        datasets: [{
          data: [approvedJobs, this.stats.pendingJobs],
          backgroundColor: ['#466bd1ff', '#6c757d'],
          borderColor: ['#596b9cff', '#9ca2a7ff'],
          borderWidth: 2,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }
}
  private destroyCharts(): void {
    this.userChart?.destroy();
    this.jobStatusChart?.destroy();
  }

  // Helper methods
  formatNumber(num: number): string {
    return num >= 1000 ? `${(num / 1000).toFixed(1)}K` : num.toString();
  }

  getGrowthPercentage(current: number, previous = 0): string {
    if (previous === 0) return '100';
    return Math.abs(((current - previous) / previous) * 100).toFixed(1);
  }

  private showMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}