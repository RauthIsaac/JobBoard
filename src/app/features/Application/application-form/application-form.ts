import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-application-form',
  templateUrl: './application-form.html',
  styleUrls: ['./application-form.css']
})
export class ApplicationForm implements OnInit {
  
  jobId = signal<number | null>(null);

  constructor(
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['jobId']) {
        this.jobId.set(parseInt(params['jobId']));
        console.log('Application form - Job ID:', this.jobId());
        
        this.loadJobDetailsForApplication();
      }
    });
  }

  private loadJobDetailsForApplication(): void {
    const currentJobId = this.jobId();
    if (currentJobId) {
      console.log('Loading job details for application form, Job ID:', currentJobId);
    }
  }

  submitApplication(): void {
    const currentJobId = this.jobId();
    if (currentJobId) {
      console.log('Submitting application for job:', currentJobId);
    } else {
      console.error('No job ID found for application');
    }
  }
}