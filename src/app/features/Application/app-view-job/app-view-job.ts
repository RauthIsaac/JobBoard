import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ApplicationService } from '../application-service';
import { IemployerApplications } from '../../../shared/models/iemployer-applications';
import { ActivatedRoute,  RouterLink } from '@angular/router';


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
  imports: [CommonModule, RouterLink, NgIf],
  templateUrl: './app-view-job.html',
  styleUrls: ['./app-view-job.css']
})
export class AppViewJob implements OnInit {

  applicationsList = signal<any[]>([]);
  isLoading = signal<boolean>(false);

  jobId = signal<number>(0);  
  
  ApplicationStatus = ApplicationStatus;
  

  constructor(private appService: ApplicationService, private route:ActivatedRoute) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id && id > 0) {
        this.jobId.set(id);
        this.loadEmployerApplications();
      }
    });
  }

  private loadEmployerApplications(): void {
    this.isLoading.set(true);
    this.appService.getJobApplicationsByJobId(this.jobId()).subscribe({
      next:(apps:any) => {
        console.log('Job apps from SQL : ', apps);
        this.applicationsList.set(apps);
        console.log(this.applicationsList());  
        this.isLoading.set(false);      
      },
      error: (err) => {
        console.error('Error Fetching the applications' ,err);
      }
    })    
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

  trackByApplicationId(index: number, app: IemployerApplications): number {
    return app.id;
  }
}