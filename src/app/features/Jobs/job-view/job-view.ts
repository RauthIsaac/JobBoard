import { CurrencyPipe, DatePipe, NgIf } from '@angular/common';
import { Component, Input, OnInit, signal, effect, OnChanges, SimpleChanges } from '@angular/core';
import { RouterLink } from '@angular/router';
import { JobsService } from '../jobs-service';

@Component({
  selector: 'app-job-view',
  imports: [CurrencyPipe, RouterLink, DatePipe, NgIf],
  templateUrl: './job-view.html',
  styleUrl: './job-view.css'
})
export class JobView implements OnInit, OnChanges {

  @Input({ required: true }) job!: any;

  isSavedFlag = signal<boolean>(false);

  constructor(private jobService: JobsService) {
    // Listen to changes in savedJobsState for ANY job changes
    effect(() => {
      if (this.job?.id) {
        const isCurrentJobSaved = this.jobService.isJobSaved(this.job.id);
        this.isSavedFlag.set(isCurrentJobSaved);
      }
    });
  }

  ngOnInit(): void {
    this.updateSavedState();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['job'] && this.job) {
      this.updateSavedState();
    }
  }

  private updateSavedState(): void {
    if (this.job?.id) {
      this.isSavedFlag.set(this.jobService.isJobSaved(this.job.id));
    }
  }

  AddToSaved(): void {
    if (!this.job?.id) return;

    const jobId = this.job.id;
    const currentSavedState = this.isSavedFlag();

    if (currentSavedState) {
      // إزالة من المحفوظات باستخدام الـ endpoint الجديدة
      this.jobService.removeFromSavedJobsByJobId(jobId).subscribe({
        next: () => {
          // الـ effect سيحدث التحديث تلقائياً
          console.log(`Job ${jobId} removed from saved jobs`);
        },
        error: (err) => {
          console.error('Error removing job from saved:', err);
          // في حالة الخطأ، أعد الحالة كما كانت
          this.isSavedFlag.set(true);
        }
      });
    } else {
      // إضافة إلى المحفوظات
      this.jobService.addToSavedJobs(jobId).subscribe({
        next: () => {
          // الـ effect سيحدث التحديث تلقائياً
          console.log(`Job ${jobId} added to saved jobs`);
        },
        error: (err) => {
          console.error('Error adding job to saved:', err);
          // في حالة الخطأ، أعد الحالة كما كانت
          this.isSavedFlag.set(false);
        }
      });
    }
  }

  // Helper method to slice description text
  getSlicedDescription(): string {
    if (!this.job?.description) return '';
    
    const limit = 120;
    if (this.job.description.length <= limit) {
      return this.job.description;
    }
    
    return this.job.description.substring(0, limit).trim() + '...';
  }
}