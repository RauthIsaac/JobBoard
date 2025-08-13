import { CurrencyPipe, DatePipe, NgIf, NgFor, CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { JobsService } from '../jobs-service';

@Component({
  selector: 'app-job-details',
  imports: [CurrencyPipe, RouterLink,  DatePipe,  CommonModule],
  templateUrl: './job-details.html',
  styleUrl: './job-details.css'
})
export class JobDetails implements OnInit{

  jobId = signal<number>(0);
  jobDetails = signal<any>({});
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  requirementsList = signal<string[]>([]);
  responsibilitiesList = signal<string[]>([]);
  offersList = signal<string[]>([]);

  constructor(private jobService: JobsService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    window.scrollTo(0, 0);
    
    this.route.params.subscribe(params => {
      this.jobId.set(+params['id']); 
      this.loadJobDetails(); 
    });
    }

   
  
  loadJobDetails(){
    this.loading.set(true);
    this.error.set(null);
    
    this.jobService.GetJobDetails(this.jobId())
      .subscribe({
        next: (response: any) => {
          if (response) {
            this.jobDetails.set(response);
            console.log(this.jobDetails());          
           
            // Parse requirements string into array
            if (response.requirements) {
              this.requirementsList.set(response.requirements.split('. ').filter((req: string) => req.trim() !== ''));
            }

            // Parse responsibilities string into array
            if (response.responsabilities) {
              this.responsibilitiesList.set(response.responsabilities.split('. ').filter((req: string) => req.trim() !== ''));
            }

            // Parse benefits string into array
            if (response.benefits) {
              this.offersList.set(response.benefits.split('. ').filter((req: string) => req.trim() !== ''));
            }
          }
          this.loading.set(false);
        },
        error: (err:any) => {
          this.error.set('Failed to load job details. Please try again.');
          this.loading.set(false);
        }
      });
  }



  /*----------------------------Saved Jobs-------------------------------- */
  get isSaved(): boolean {
    return this.jobService.isSaved(this.jobId());
  }

  AddToSaved(): void {
    this.jobService.toggleSaved(this.jobId());
  }
}