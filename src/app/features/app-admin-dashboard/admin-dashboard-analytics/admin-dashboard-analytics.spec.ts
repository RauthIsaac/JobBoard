import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
    CommonModule,
    DatePipe,
    CurrencyPipe,
    HttpClientModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTabsModule,
    MatTableModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule
  ],
  providers: [AdminService]
})
export class AdminDashboardAnalytics implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('userChart') userChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('jobStatusChart') jobStatusChartRef!: ElementRef<HTMLCanvasElement>;

  private destroy$ = new Subject<void>();
  private userChart?: Chart;
  private jobStatusChart?: Chart;

  isLoading = false;
  isLoadingSeekers = false;
  isLoadingEmployers = false;
  isLoadingJobs = false;

  stats: AdminStats = { totalSeekers: 0, totalEmployers: 0, totalJobs: 0, pendingJobs: 0 };
  seekers: Seeker[] = [];
  employers: Employer[] = [];
  pendingJobs: Job[] = [];

  seekerColumns = ['name', 'email', 'phoneNumber', 'address', 'skills', 'actions'];
  employerColumns = ['name', 'email', 'companyName', 'actions'];
  jobColumns = ['title', 'company', 'location', 'salary', 'employmentType', 'actions'];

  showDetailsCard = false;
  detailsType: DetailType = 'seeker';
  selectedSeeker: Seeker | null = null;
  selectedEmployer: Employer | null = null;
  selectedJob: Job | null = null;

  constructor(private adminService: AdminService, private snackBar: MatSnackBar) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.createCharts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyCharts();
  }

  private loadData(): void {
    if (!this.adminService.isLoggedIn()) {
      this.showMessage('Authentication required. Please login.');
      return;
    }

    this.isLoading = true;
    this.isLoadingSeekers = true;
    this.isLoadingEmployers = true;
    this.isLoadingJobs = true;

    forkJoin({
      stats: this.adminService.getStats(),
      seekers: this.adminService.getAllSeekers(),
      employers: this.adminService.getAllEmployers(),
      pendingJobs: this.adminService.getPendingJobs()
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ stats, seekers, employers, pendingJobs }) => {
        this.stats = stats;
        this.seekers = seekers;
        this.employers = employers;
        this.pendingJobs = pendingJobs;
        this.updateCharts();
      },
      error: (error) => this.showMessage(`Error: ${error.message}`),
      complete: () => {
        this.isLoading = false;
        this.isLoadingSeekers = false;
        this.isLoadingEmployers = false;
        this.isLoadingJobs = false;
      }
    });
  }

  deleteUser(userId: string): void {
    if (!confirm('Are you sure you want to delete this user?')) return;

    this.adminService.deleteUser(userId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.showMessage('User deleted successfully');
        this.loadData();
        if (this.selectedSeeker?.userId === userId || this.selectedEmployer?.userId === userId) {
          this.closeDetails();
        }
      },
      error: (error) => this.showMessage(`Error: ${error.message}`)
    });
  }

  approveJob(jobId: number): void {
    this.adminService.approveJob(jobId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.showMessage('Job approved successfully');
        this.loadData();
        this.closeDetails();
      },
      error: (error) => this.showMessage(`Error: ${error.message}`)
    });
  }

  rejectJob(jobId: number): void {
    if (!confirm('Are you sure you want to reject this job?')) return;

    this.adminService.rejectJob(jobId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.showMessage('Job rejected successfully');
        this.loadData();
        this.closeDetails();
      },
      error: (error) => this.showMessage(`Error: ${error.message}`)
    });
  }

  showSeekerDetails(seeker: Seeker): void {
    this.selectedSeeker = seeker;
    this.detailsType = 'seeker';
    this.showDetailsCard = true;
    this.resetOtherSelections();
  }

  showEmployerDetails(employer: Employer): void {
    this.selectedEmployer = employer;
    this.detailsType = 'employer';
    this.showDetailsCard = true;
    this.resetOtherSelections();
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
  }

  private createCharts(): void {
    if (this.userChartRef?.nativeElement && this.jobStatusChartRef?.nativeElement) {
      this.createUserChart();
      this.createJobStatusChart();
    }
  }

  private updateCharts(): void {
    this.destroyCharts();
    this.createCharts();
  }

  private destroyCharts(): void {
    this.userChart?.destroy();
    this.jobStatusChart?.destroy();
  }

  private createUserChart(): void {
    const ctx = this.userChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.userChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Job Seekers', 'Employers'],
        datasets: [{
          label: 'Total Users',
          data: [this.stats.totalSeekers, this.stats.totalEmployers],
          backgroundColor: ['rgba(54, 162, 235, 0.8)', 'rgba(255, 99, 132, 0.8)'],
          borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)'],
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

  private createJobStatusChart(): void {
    const ctx = this.jobStatusChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const approvedJobs = this.stats.totalJobs - this.stats.pendingJobs;

    this.jobStatusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Approved Jobs', 'Pending Jobs'],
        datasets: [{
          data: [approvedJobs, this.stats.pendingJobs],
          backgroundColor: ['rgba(40, 167, 69, 0.8)', 'rgba(255, 193, 7, 0.8)'],
          borderColor: ['rgba(40, 167, 69, 1)', 'rgba(255, 193, 7, 1)'],
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

  formatNumber(num: number): string {
    return num >= 1000 ? `${(num / 1000).toFixed(1)}K` : num.toString();
  }

  getGrowthPercentage(current: number, previous = 0): string {
    return previous === 0 ? '100' : Math.abs(((current - previous) / previous) * 100).toFixed(1);
  }

  private showMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}