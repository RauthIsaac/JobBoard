import { Component, OnInit, signal } from '@angular/core';
import { JobsService } from '../../Jobs/jobs-service';
import { IJob } from '../../../shared/models/ijob';
import { JobView } from '../../Jobs/job-view/job-view';

@Component({
  selector: 'app-home',
  imports: [JobView],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit{

  jobsList = signal<IJob[]>([]);

  constructor(private jobService: JobsService) {
    this.jobsList = this.jobService.JobsList;

  }

  ngOnInit(): void {
    window.scrollTo(0, 0);
  }
  
}