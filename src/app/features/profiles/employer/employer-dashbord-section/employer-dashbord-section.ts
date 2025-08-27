import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, NgClass, NgFor, NgIf } from '@angular/common';
import { JobsService } from '../../../Jobs/jobs-service';
import { NotificationDto, NotificationService } from '../../../Notifications/notification-services';
import { IexpiringSoonJobs } from '../../../../shared/models/iexpiring-soon-jobs';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-employer-dashbord-section',
  imports: [RouterLink, NgClass, CommonModule, NgFor, NgIf],
  templateUrl: './employer-dashbord-section.html',
  styleUrl: './employer-dashbord-section.css'
})
export class EmployerDashbordSection implements OnInit{

  recentJobs = signal<any[]>([]);
  expiringSoonJobs = signal<IexpiringSoonJobs>({} as IexpiringSoonJobs);
  recentActivity = signal<any>(undefined);

  notifications = signal<NotificationDto[]>([]);
  private subscriptions: Subscription[] = [];

  constructor(
    private JobService : JobsService, 
    private notificationService: NotificationService) {}


  ngOnInit() {
    this.getRecentJobs();
    this.loadExpiringSoonJobs();

    /* From Notifications */
    this.loadRecentActivity();
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

  loadExpiringSoonJobs(){
    this.JobService.getExpiringSoonJobs().subscribe({
      next:(jobs)=>{
        console.log('Expiring Soon Jobs From SQL:' ,jobs);
        this.expiringSoonJobs.set(jobs);
        console.log('Expiring Soon Jobs: ',this.expiringSoonJobs());
      },
      error:(err)=>{
        console.error('Error fetching the expiring soon jobs', err);
      }
    })
  }



  private loadRecentActivity() {
    this.subscriptions.push(
      this.notificationService.notifications.subscribe({
        next: (notifications) => {
          this.recentActivity.set(notifications || []); // Fallback to empty array
          console.log('Recent Activity:', this.recentActivity());
        },
        error: (err) => {
          console.error('Error fetching notifications:', err);
          this.recentActivity.set([]); // Set empty array on error
        }
      })
    );
  }

  getTimeDifference(createdAt: Date | string | null | undefined): string {
    if (!createdAt) {
      console.warn('createdAt is undefined or null, using current date');
      return 'now';
    }

    const notificationTime = createdAt instanceof Date ? createdAt : new Date(createdAt);
    
    if (isNaN(notificationTime.getTime())) {
      console.warn('Invalid createdAt date:', createdAt, 'Type:', typeof createdAt);
      return 'Unknown time';
    }

    const now = new Date();
    const diffMs = now.getTime() - notificationTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'now';
    if (diffMinutes < 60) return `${diffMinutes} m`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} d`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks} w`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} m`;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  
  viewNotification(link: string) {
    if (link) window.open(link, '_blank');
  }

}
