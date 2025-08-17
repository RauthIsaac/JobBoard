import { Component, AfterViewInit, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';

// Chart.js for the graph
import { Chart, registerables } from 'chart.js';
import { JobSeekerService } from '../job-seeker';

// Define a type for the Job Seeker data
export interface Seeker {
  id: number;
  userId: string;
  name: string;
  email: string;
  phoneNumber: string;
  title: string | null;
  dateOfBirth: string | null;
  address: string | null;
  cV_Url: string | null;
  gender: string | null;
  summary: string | null;
  profileImageUrl: string | null;
  certificateName: string[];
  trainingName: string[];
  interestName: string[];
  skillName: string[];
  seekerExperiences: any[];
  seekerEducations: any[];
}

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
    MatTableModule,
    HttpClientModule
  ],
  providers: [JobSeekerService]
})
export class AdminDashboardAnalytics implements AfterViewInit, OnInit {
  @ViewChild('userChart') userChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('jobStatusChart') jobStatusChartRef!: ElementRef<HTMLCanvasElement>;

  public userChart!: Chart;
  public jobStatusChart!: Chart;

  public totalJobs = '1.7K';
  public pendingJobsCount = 120;
  public approvedJobsCount = 1580;

  // State for the details card
  public selectedSeeker: Seeker | null = null;
  public showDetailsCard = false;

  // Data source for the tables
  public seekers: Seeker[] = [];
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

  public seekerDisplayedColumns: string[] = ['name', 'email', 'phoneNumber', 'address', 'skills', 'actions'];
  public employerDisplayedColumns: string[] = ['name', 'email', 'actions'];
  public jobDisplayedColumns: string[] = ['title', 'company', 'date', 'actions'];

  constructor(private jobSeekerService: JobSeekerService) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
   
    const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6ImEwZWY0NGFlLTRkYmMtNGNkOS1hYTRjLTA1ZWUzMTA0ZjQyZiIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJhZG1pbkBleGFtcGxlLmNvbSIsImp0aSI6IjdiN2RhNjI4LWNhYjEtNGM5YS04NzVmLTA1ZGUyNjRhNWU0ZiIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFkbWluIiwiZXhwIjoxNzU1OTY1ODkzLCJpc3MiOiJKb2JCb2FyZEFQSSIsImF1ZCI6IkpvYkJvYXJkVXNlciJ9.6as33Yb6BlsNEx6agL_aCI3_QAEr_MLb7ftCK8VSD5o'; 

    this.jobSeekerService.getJobSeekers(authToken).subscribe({
      next: (data: Seeker[]) => {
        this.seekers = data;
        this.seekersDataSource = [...this.seekers];
      },
      error: (error) => {
        console.error('There was an error fetching the job seekers!', error);
        this.seekers = [
          {
              id: 1,
              userId: "283c56f2-14b8-4608-8972-412aee68d009",
              name: "seeker1",
              email: "seeker1@example.com",
              phoneNumber: "01000065402",
              title: null,
              dateOfBirth: null,
              address: "Cairo, Egypt",
              cV_Url: "http://localhost:5007/cv/ahmedtarek.pdf",
              gender: "Male",
              summary: "An enthusiastic and motivated individual looking for new opportunities.",
              profileImageUrl: "https://via.placeholder.com/150",
              certificateName: ["Scrum Master Certified"],
              trainingName: ["Angular Advanced Concepts"],
              interestName: ["Software Development", "Machine Learning"],
              skillName: [
                  "C#",
                  "ASP.NET Core",
                  "SQL"
              ],
              seekerExperiences: [],
              seekerEducations: []
          },
          {
            id: 2,
            userId: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
            name: "Samaa",
            email: "Samaa@gmail.com",
            phoneNumber: "01123456789",
            title: 'UI/UX Designer',
            dateOfBirth: '1995-05-15',
            address: 'Alexandria, Egypt',
            cV_Url: null,
            gender: 'Female',
            summary: "Creative UI/UX designer with a passion for user-centric design.",
            profileImageUrl: "https://via.placeholder.com/150",
            certificateName: ['Adobe XD'],
            trainingName: [],
            interestName: ['Design', 'Art'],
            skillName: ['Figma', 'Sketch', 'Adobe XD'],
            seekerExperiences: [],
            seekerEducations: []
          },
          {
            id: 3,
            userId: "b2c3d4e5-f6a1-2345-6789-0abcde567890",
            name: "manar",
            email: "manar@gmail.com",
            phoneNumber: "01234567890",
            title: 'Data Analyst',
            dateOfBirth: '1998-01-20',
            address: 'Giza, Egypt',
            cV_Url: null,
            gender: 'Female',
            summary: "Skilled data analyst with expertise in data visualization and reporting.",
            profileImageUrl: "https://via.placeholder.com/150",
            certificateName: [],
            trainingName: ["Data Science with Python"],
            interestName: ['Data Science', 'Statistics'],
            skillName: ['Python', 'SQL', 'Tableau'],
            seekerExperiences: [],
            seekerEducations: []
          }
        ];
        this.seekersDataSource = [...this.seekers];
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.createUserChart();
      this.createJobStatusChart();
    }, 100);
  }

  deleteUser(userId: string): void {
    console.log(`Deleting user with ID: ${userId}`);
    this.seekers = this.seekers.filter(u => u.userId !== userId);
    this.employers = this.employers.filter(u => u.id !== userId);
    this.seekersDataSource = [...this.seekers]; 
    this.employersDataSource = [...this.employers]; 
    
    if (this.selectedSeeker?.userId === userId) {
      this.closeDetails();
    }
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

  showDetails(seeker: Seeker): void {
    this.selectedSeeker = seeker;
    this.showDetailsCard = true;
  }

  closeDetails(): void {
    this.showDetailsCard = false;
    this.selectedSeeker = null;
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
