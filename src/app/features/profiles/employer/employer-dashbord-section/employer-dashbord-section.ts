import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, NgClass } from '@angular/common';
import { JobsService } from '../../../Jobs/jobs-service';


@Component({
  selector: 'app-employer-dashbord-section',
  imports: [RouterLink, NgClass, CommonModule],
  templateUrl: './employer-dashbord-section.html',
  styleUrl: './employer-dashbord-section.css'
})
export class EmployerDashbordSection implements OnInit{

  recentJobs = signal<any[]>([]);

  constructor(private JobService : JobsService) {}

  ngOnInit() {
    this.getRecentJobs();
  }

  getRecentJobs() {
    this.JobService.getRecentJobs().subscribe({
      next: (data) => {
        console.log(data);
        this.recentJobs.set(data);
        console.log('Recent jobs:', this.recentJobs());
      },
      error: (err) => {
        console.error('Error fetching recent jobs:', err);
      }
    });
  }

}
