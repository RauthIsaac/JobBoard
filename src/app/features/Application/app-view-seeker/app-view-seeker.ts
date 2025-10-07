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
  imports: [CommonModule, NgIf,RouterLink],
  templateUrl: './app-view-seeker.html',
  styleUrls: ['./app-view-seeker.css']
})
export class AppViewSeeker implements OnInit {

  applicationsList = signal<any[]>([]);
  isLoading = signal<boolean>(false);
  
  ApplicationStatus = ApplicationStatus;
  

  constructor(private appService: ApplicationService, private route:ActivatedRoute) {}

  ngOnInit(): void {
    this.loadSeekerApplications();
  }

  private loadSeekerApplications(): void {
    this.isLoading.set(true);
    this.appService.getSeekerApplications().subscribe({
      next:(apps:any) => {
        console.log('Seeker apps from SQL : ', apps);
        this.applicationsList.set(apps);
        console.log('Seeker Apps :',this.applicationsList());  
        this.isLoading.set(false);      
      },
      error: (err) => {
        console.error('Error Fetching the applications' ,err);
        console.log(err.message);
      }
    })    
  }


  getStatusClass(status: string): string {
    // const statusLower = status.toLowerCase();
    switch (status) {
      case 'Pending':
        return 'status-new';
      case 'UnderReview':
        return 'status-under-review';
      case 'Interviewed':
        return 'status-interview';
      case 'Accepted':
      case 'hired':
        return 'status-hired';
      case 'Rejected':
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


  trackByApplicationId(index: number, app: IemployerApplications): number {
    return app.id;
  }
}