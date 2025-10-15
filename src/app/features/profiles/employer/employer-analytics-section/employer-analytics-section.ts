import { Component, OnInit, signal } from '@angular/core';
import { JobsService } from '../../../Jobs/jobs-service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../auth/auth-service';
import { IemplyerAnalytics } from '../../../../shared/models/iemplyer-analytics';
import { IemployerHiringOverview } from '../../../../shared/models/iemployer-hiring-overview';


@Component({
  selector: 'app-employer-analytics-section',
  imports: [CommonModule],
  templateUrl: './employer-analytics-section.html',
  styleUrl: './employer-analytics-section.css'
})
export class EmployerAnalyticsSection implements OnInit{

  topPerformingJobs = signal<any[]>([]);
  employerAnalytics = signal<IemplyerAnalytics>({} as IemplyerAnalytics);
  employerHiringOverview = signal<IemployerHiringOverview>({} as IemployerHiringOverview);

  constructor(private jobService:JobsService, private authService: AuthService){}

  ngOnInit(): void {
    this.loadTopPerformingJobs();
    this.loadEmployerAnalytics();
    this.loadEmployerHiringOverview();


    // ✅ Dynamic stagger animation
    setTimeout(() => {
      const lines = document.querySelectorAll<HTMLElement>('.fade-line');
      lines.forEach((line, index) => {
        line.style.animationDelay = `${index * 0.15}s`;
        line.classList.add('visible');
      });
    }, 600);
  }

  loadTopPerformingJobs(){
    this.jobService.getTopPerformingJobs().subscribe({
      next:(jobs)=>{
        console.log('Top Performing Jobs from SQL :', jobs);
        this.topPerformingJobs.set(jobs);
        console.log('Top Performing Jobs :', this.topPerformingJobs());
      },
      error: (err)=>{
        console.error('Error fetching data', err);
      }
    })

  }

  loadEmployerAnalytics(){
    this.authService.getEmployerAnalytics().subscribe({
      next:(analytic:any)=>{
        console.log('Analytics from SQL :', analytic);
        this.employerAnalytics.set(analytic);
        console.log('Analytics :', this.employerAnalytics());
      },
      error: (err:any)=>{
        console.error('Error fetching data', err);
      }
    })
  }

  loadEmployerHiringOverview(){
    this.authService.getEmployerHiringOverview().subscribe({
      next:(analytic:any)=>{
        console.log('Hiring Overview from SQL :', analytic);
        this.employerHiringOverview.set(analytic);
        console.log('Hiring Overview :', this.employerHiringOverview());
      },
      error: (err:any)=>{
        console.error('Error fetching data', err);
      }
    })
  }
  
}
