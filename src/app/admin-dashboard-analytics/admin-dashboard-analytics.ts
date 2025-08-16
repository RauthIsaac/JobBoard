import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';

import { Chart, registerables } from 'chart.js';

@Component({
  standalone: true,
  selector: 'app-admin-dashboard-analytics',
  templateUrl: './admin-dashboard-analytics.html',
  styleUrls: ['./admin-dashboard-analytics.css'],
  imports: [
    CommonModule,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTabsModule,
    MatTableModule
  ],
})
export class AdminDashboardAnalytics implements AfterViewInit {
  @ViewChild('userChart') userChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('jobStatusChart') jobStatusChartRef!: ElementRef<HTMLCanvasElement>;

  public userChart!: Chart;
  public jobStatusChart!: Chart;

  public totalJobs = '1.7K';
  public pendingJobsCount = 120;
  public approvedJobsCount = 1580;

  public seekers = [
    { id: '1', name: 'Samaa', email: 'Samaa@gmail.com' },
    { id: '2', name: 'manar', email: 'manar@gmail.com' },
    { id: '3', name: 'aisha', email: 'aisha@gmail.com' }
  ];

  public employers = [
    { id: '4', name: 'Tech Innovations Inc.', email: 'hr@techinnovations.com' },
    { id: '5', name: 'Frontend Developer', email: 'contact@FrontendDeveloper.com' }
  ];

  public pendingJobs = [
    { id: '101', title: 'Senior Software Engineer', company: 'Google', date: new Date(2023, 11, 15) },
    { id: '102', title: 'Data Scientist', company: 'Amazon', date: new Date(2023, 11, 14) },
    { id: '103', title: 'Product Manager', company: 'Facebook', date: new Date(2023, 11, 13) }
  ];
  
  public seekersDataSource = this.seekers;
  public employersDataSource = this.employers;
  public pendingJobsDataSource = this.pendingJobs;

  public userDisplayedColumns: string[] = ['name', 'email', 'actions'];
  public jobDisplayedColumns: string[] = ['title', 'company', 'date', 'actions'];

  constructor() {
    Chart.register(...registerables);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.createUserChart();
      this.createJobStatusChart();
    }, 100);
  }

  deleteUser(userId: string): void {
    console.log(`Deleting user with ID: ${userId}`);
    this.seekers = this.seekers.filter(u => u.id !== userId);
    this.employers = this.employers.filter(u => u.id !== userId);
    this.seekersDataSource = [...this.seekers];
    this.employersDataSource = [...this.employers];
  }

  approveJob(jobId: string): void {
    console.log(`Approving job with ID: ${jobId}`);
    this.pendingJobs = this.pendingJobs.filter(j => j.id !== jobId);
    this.pendingJobsDataSource = [...this.pendingJobs];
  }

  rejectJob(jobId: string): void {
    console.log(`Rejecting job with ID: ${jobId}`);
    this.pendingJobs = this.pendingJobs.filter(j => j.id !== jobId);
    this.pendingJobsDataSource = [...this.pendingJobs];
  }

  private createUserChart(): void {
    if (!this.userChartRef) {
      console.error('User chart canvas element not found.');
      return;
    }

    const ctx = this.userChartRef.nativeElement.getContext('2d');
    if (this.userChart) {
      this.userChart.destroy();
    }
    
    this.userChart = new Chart(ctx!, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'New Users',
          data: [120, 150, 180, 220, 250, 280],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      }
    });
  }

  private createJobStatusChart(): void {
    if (!this.jobStatusChartRef) {
      console.error('Job status chart canvas element not found.');
      return;
    }

    const ctx = this.jobStatusChartRef.nativeElement.getContext('2d');
    if (this.jobStatusChart) {
      this.jobStatusChart.destroy();
    }
    
    this.jobStatusChart = new Chart(ctx!, {
      type: 'doughnut',
      data: {
        labels: ['Approved', 'Pending', 'Rejected'],
        datasets: [{
          label: 'Job Status',
          data: [1580, 120, 50],
          backgroundColor: [
            'rgb(40, 167, 69)', // Approved
            'rgb(255, 193, 7)', // Pending
            'rgb(220, 53, 69)' // Rejected
          ],
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      }
    });
  }
}
