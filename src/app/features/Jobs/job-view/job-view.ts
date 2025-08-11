import { CurrencyPipe, DatePipe, NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { JobsService } from '../jobs-service';
import { TextSlicePipe } from '../../../shared/pipes/text-slice-pipe';

@Component({
  selector: 'app-job-view',
  imports: [CurrencyPipe, RouterLink, DatePipe, NgIf, TextSlicePipe],
  templateUrl: './job-view.html',
  styleUrl: './job-view.css'
})
export class JobView {
  @Input({ required: true }) job!: any;
  
  constructor(private jobService: JobsService) {}

  get isSaved(): boolean {
    return this.jobService.isSaved(this.job.id);
  }

  AddToSaved(): void {
    this.jobService.toggleSaved(this.job.id);
  }

}