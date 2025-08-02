import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { JobsService } from '../jobs-service';

@Component({
  selector: 'app-job-details',
  imports: [CurrencyPipe, RouterLink, DatePipe],
  templateUrl: './job-details.html',
  styleUrl: './job-details.css'
})
export class JobDetails implements OnInit{

  jobId = signal<number>(0);
  jobDetails = signal<any>({});
  requirementsList = signal<string[]>([])
  
  constructor(private jobService: JobsService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    window.scrollTo(0, 0);
    
    this.route.params.subscribe(params => {
      this.jobId.set(+params['id']); 
      this.loadJobDetails(); 
    });
    }

   
  
  loadJobDetails(){
    this.jobService.GetJobDetails(this.jobId()).subscribe((response: any) => {
      this.jobDetails.set(response);
      this.requirementsList.set((response.requirements).split(","));
      console.log("Job Details : ", this.jobDetails());
      console.log("requirements : ", this.requirementsList());
    })
  }



  /*----------------------------Saved Jobs-------------------------------- */
  get isSaved(): boolean {
    return this.jobService.isSaved(this.jobId());
  }

  AddToSaved(): void {
    this.jobService.toggleSaved(this.jobId());
  }
}