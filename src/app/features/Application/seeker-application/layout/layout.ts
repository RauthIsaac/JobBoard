import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { RouterModule, Router, RouterOutlet, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IJob } from '../../../../shared/models/ijob'; 
import { ApplicationService } from '../../application-service'; 

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, NgIf],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout implements OnInit {
  
  jobData = signal<IJob | null>(null);
  jobId = signal<number>(1);
  
  workplaceType = computed(() => {
    const job = this.jobData();
    if (!job) return 'Workplace Type';
    
    switch (job.workplaceType) {
      case 0: return 'On-site';
      case 1: return 'Remote';
      case 2: return 'Hybrid';
      default: return 'Not Specified';
    }
  });

  jobType = computed(() => {
    const job = this.jobData();
    if (!job) return 'Job Type';
    
    switch (job.jobType) {
      case 0: return 'Full-time';
      case 1: return 'Part-time';
      case 2: return 'Freelance';
      case 3: return 'Internship';
      case 4: return 'Temporary';
      case 5: return 'Contract';
      default: return 'Not Specified';
    }
  });

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private appService: ApplicationService   
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['jobId']) {
        this.jobId.set(parseInt(params['jobId']));
        this.appService.setJobId(this.jobId()); 
        console.log(this.jobId());
        this.loadJobData();
      }
    });
  }

  loadJobData(): void {
    this.http.get<IJob>(`http://localhost:5007/api/Jobs/${this.jobId()}`)
      .subscribe({
        next: (data) => {
          this.jobData.set(data);
        },
        error: (error) => {
          console.error('Error loading job:', error);
          this.setTestData();
        }
      });
  }

  setTestData(): void {
    const testData: IJob = {
      id: 1,
      title: 'Senior Frontend Developer',
      companyName: 'TechCorp Solutions',
      companyImage: '/assets/company-logo.png',
      companyLocation: 'San Francisco, CA',
      salary: 120000,
      workplaceType: 2,
      jobType: 0,
      description: '',
      postedDate: new Date(),
      expireDate: new Date(),
      requirements: '',
      minTeamSize: 0,
      maxTeamSize: 0,
      educationLevel: 0,
      experienceLevel: 0,
      isActive: true,
      companyDescription: '',
      employeeRange: '',
      website: '',
      industry: '',
      responsabilities: '',
      benefits: '',
      categoryIds: [],
      skillIds: []
    };
    
    this.jobData.set(testData);
  }

  isActive(path: string): boolean {
    return this.router.url.includes(path);
  }
}
