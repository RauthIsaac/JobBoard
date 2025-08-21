import { Component, OnInit, signal } from '@angular/core';
import { JobsService } from '../../../Jobs/jobs-service';


@Component({
  selector: 'app-employer-analytics-section',
  imports: [],
  templateUrl: './employer-analytics-section.html',
  styleUrl: './employer-analytics-section.css'
})
export class EmployerAnalyticsSection implements OnInit{

  topPerformingJobs = signal<any[]>([]);

  constructor(private jobService:JobsService){}

  ngOnInit(): void {
    this.loadTopPerformingJobs();
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
  
}
