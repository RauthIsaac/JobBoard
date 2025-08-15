import { CommonModule, CurrencyPipe, NgIf } from '@angular/common';
import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { JobsService } from '../jobs-service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-job-details',
  imports: [CurrencyPipe, RouterLink, CommonModule],
  templateUrl: './job-details.html',
  styleUrl: './job-details.css'
})
export class JobDetails implements OnInit {

  jobId = signal<number>(0);
  jobDetails = signal<any>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Computed signals للقوائم
  requirementsList = computed(() => {
    const details = this.jobDetails();
    if (!details?.requirements) return [];
    return details.requirements.split('\n').filter((req: string) => req.trim());
  });

  responsibilitiesList = computed(() => {
    const details = this.jobDetails();
    if (!details?.responsibilities) return [];
    return details.responsibilities.split('\n').filter((resp: string) => resp.trim());
  });

  offersList = computed(() => {
    const details = this.jobDetails();
    if (!details?.offers) return [];
    return details.offers.split('\n').filter((offer: string) => offer.trim());
  });

  // حالة الـ saved job
  isSavedFlag = signal<boolean>(false);

  constructor(private jobService: JobsService, private route: ActivatedRoute) {
    // Listen to changes in savedJobsState
    effect(() => {
      const currentJobId = this.jobId();
      if (currentJobId > 0) {
        const isCurrentJobSaved = this.jobService.isJobSaved(currentJobId);
        this.isSavedFlag.set(isCurrentJobSaved);
      }
    });
  }

  ngOnInit(): void {
    window.scrollTo(0, 0);
    
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id && id > 0) {
        this.jobId.set(id);
        this.loadJobDetails();
      }
    });
  }

  private loadJobDetails(): void {
    const currentJobId = this.jobId();
    if (!currentJobId) return;

    this.loading.set(true);
    this.error.set(null);
    
    this.jobService.GetJobDetails(currentJobId)
      .pipe(
        catchError(err => {
          console.error('Error loading job details:', err);
          this.error.set('Failed to load job details. Please try again.');
          return of(null);
        }),
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe((response: any) => {
        if (response) {
          this.jobDetails.set(response);
          // تحديث حالة الـ saved بعد تحميل البيانات
          this.isSavedFlag.set(this.jobService.isJobSaved(currentJobId));
          console.log("Job Details loaded:", response);
        }
      });
  }

  toggleSaved(): void {
    const currentJobId = this.jobId();
    if (!currentJobId) return;

    const currentSavedState = this.isSavedFlag();

    if (currentSavedState) {
      // إزالة من المحفوظات باستخدام الـ endpoint الجديدة
      this.jobService.removeFromSavedJobsByJobId(currentJobId).subscribe({
        next: () => {
          // الـ effect سيحدث التحديث تلقائياً
          console.log(`Job ${currentJobId} removed from saved jobs`);
        },
        error: (err) => {
          console.error('Error removing job from saved:', err);
          // إعادة الحالة السابقة في حالة الخطأ
          this.isSavedFlag.set(true);
        }
      });
    } else {
      // إضافة إلى المحفوظات
      this.jobService.addToSavedJobs(currentJobId).subscribe({
        next: () => {
          // الـ effect سيحدث التحديث تلقائياً
          console.log(`Job ${currentJobId} added to saved jobs`);
        },
        error: (err) => {
          console.error('Error adding job to saved:', err);
          // إعادة الحالة السابقة في حالة الخطأ
          this.isSavedFlag.set(false);
        }
      });
    }
  }
}