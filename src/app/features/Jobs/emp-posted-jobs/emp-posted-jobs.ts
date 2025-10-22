import { Component, OnInit, signal } from '@angular/core';
import { JobsService } from '../jobs-service';
import { CommonModule } from '@angular/common';
import { IpostedJob } from '../../../shared/models/iposted-job';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SnackbarService } from '../../../shared/components/snackbar/snackbar-service';
import { LoadingPage } from "../../../shared/components/loading-page/loading-page";
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

export interface EmployerJobFilterParams {
  status?: 'Active' | 'Filled' | 'Expired';
  sortingOption?: 'PostedDateDesc' | 'PostedDateAsc' | 'ApplicationsCountDesc';
  searchValue?: string;
}

@Component({
  selector: 'app-emp-posted-jobs',
  imports: [CommonModule, RouterLink, FormsModule, LoadingPage],
  templateUrl: './emp-posted-jobs.html',
  styleUrl: './emp-posted-jobs.css'
})
export class EmpPostedJobs implements OnInit {

  postedJobs = signal<IpostedJob[]>([]);
  isLoading = signal<boolean>(false);
  expiringSoonJobs = signal<any>(undefined);
  
  searchValue = signal<string>('');
  selectedStatus = signal<string>('All Status');
  selectedSort = signal<string>('PostedDateDesc');

  // ✅ Delete Modal State
  showDeleteModal = signal<boolean>(false);
  jobToDelete = signal<{ id: number; title: string } | null>(null);

  // ✅ Subject for debouncing search input
  private searchSubject = new Subject<string>();

  constructor(
    private jobService: JobsService, 
    private snackbarService: SnackbarService
  ) {
    // ✅ Handle debounced search
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.searchValue.set(searchTerm);
      this.loadEmployerJobs();
    });
  }

  ngOnInit(): void {
    this.loadEmployerJobs();
    this.loadExpiringSoonJobs();
  }

  /**************************************************************************/
  /*---------------------------Expiring Soon Jobs---------------------------*/
  loadExpiringSoonJobs() {
    this.jobService.getExpiringSoonJobs().subscribe({
      next: (jobs) => {
        this.expiringSoonJobs.set(jobs);
      },
      error: (err) => {
        console.error('Error fetching the expiring soon jobs', err);
      }
    });
  }

  /**************************************************************************/
  /*-----------------------------Employer Jobs------------------------------*/
  loadEmployerJobs() {
    this.isLoading.set(true);

    const filters: EmployerJobFilterParams = {};
    if (this.searchValue().trim()) {
      filters.searchValue = this.searchValue().trim();
    }
    if (this.selectedStatus() !== 'All Status') {
      filters.status = this.selectedStatus() as 'Active' | 'Filled' | 'Expired';
    }
    if (this.selectedSort()) {
      filters.sortingOption = this.selectedSort() as 'PostedDateDesc' | 'PostedDateAsc' | 'ApplicationsCountDesc';
    }

    this.jobService.getEmployerJobs(filters).subscribe({
      next: (jobs) => {
        this.postedJobs.set(jobs);
        this.isLoading.set(false);

        // ✅ Staggered animation
        setTimeout(() => {
          const blocks = document.querySelectorAll<HTMLElement>('.fade-block');
          blocks.forEach((block, index) => {
            block.style.animationDelay = `${index * 0.2}s`;
            block.classList.add('visible');
          });

          const lines = document.querySelectorAll<HTMLElement>('.fade-line');
          lines.forEach((line, index) => {
            line.style.animationDelay = `${index * 0.1}s`;
            line.classList.add('visible');
          });
        }, 400);
      },
      error: (err) => {
        console.error('Error Fetching Data', err);
        this.isLoading.set(false);
      }
    });
  }

  /**************************************************************************/
  /*------------------------------ Filters ---------------------------------*/
  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchSubject.next(target.value); // ✅ Debounced search
  }

  onStatusChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedStatus.set(target.value);
    this.loadEmployerJobs();
  }

  onSortChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedSort.set(target.value);
    this.loadEmployerJobs();
  }

  clearFilters() {
    this.searchValue.set('');
    this.selectedStatus.set('All Status');
    this.selectedSort.set('PostedDateDesc');
    this.loadEmployerJobs();
  }

  /******************************************************************/
  /*----------------------------Delete Job--------------------------*/
  openDeleteModal(jobId: number, jobTitle: string) {
    this.jobToDelete.set({ id: jobId, title: jobTitle });
    this.showDeleteModal.set(true);
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.jobToDelete.set(null);
  }

  confirmDelete() {
    const job = this.jobToDelete();
    if (!job) return;

    this.isLoading.set(true);
    this.closeDeleteModal();

    this.jobService.deleteJob(job.id).subscribe({
      next: () => {
        const updatedJobs = this.postedJobs().filter(j => j.id !== job.id);
        this.postedJobs.set(updatedJobs);
        this.isLoading.set(false);
        this.showSuccess(`Job "${job.title}" deleted successfully.`);
      },
      error: (err) => {
        console.error(err);
        this.isLoading.set(false);
        this.showError('Failed to delete the job.');
      }
    });
  }

  //#region Snackbar
  showSuccess(message: string = 'Operation successful!', duration: number = 4000): void {
    this.snackbarService.show({
      message,
      type: 'success',
      duration
    });
  }

  showError(message: string = 'Something went wrong!', duration: number = 5000): void {
    this.snackbarService.show({
      message,
      type: 'error',
      duration
    });
  }
  //#endregion
}