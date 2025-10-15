import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ApplicationService } from '../application-service';
import { IemployerApplications } from '../../../shared/models/iemployer-applications';
import { ActivatedRoute,  RouterLink } from '@angular/router';
import { LoadingPage } from "../../../shared/components/loading-page/loading-page";


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
  imports: [CommonModule, NgIf, RouterLink, LoadingPage],
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


    setTimeout(() => {
      const elements = document.querySelectorAll('.animate-on-scroll');
      const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -10px 0px'
      });

      elements.forEach(element => observer.observe(element));
    }, 800);

        

    // ✅ Dynamic stagger animation
    setTimeout(() => {
      const lines = document.querySelectorAll<HTMLElement>('.fade-line');
      lines.forEach((line, index) => {
        line.style.animationDelay = `${index * 0.15}s`;
        line.classList.add('visible');
      });
    }, 600);
    
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