import { Component, OnInit, signal } from '@angular/core';
import { JobsService } from '../jobs-service';
import { CommonModule } from '@angular/common';
import { IpostedJob } from '../../../shared/models/iposted-job';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

export interface EmployerJobFilterParams {
  status?: 'Active' | 'Filled' | 'Expired';
  sortingOption?: 'PostedDateDesc' | 'PostedDateAsc' | 'ApplicationsCountDesc';
  searchValue?: string;
}

@Component({
  selector: 'app-emp-posted-jobs',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './emp-posted-jobs.html',
  styleUrl: './emp-posted-jobs.css'
})
export class EmpPostedJobs implements OnInit {

  postedJobs = signal<IpostedJob[]>([]);
  isLoading = signal<boolean>(false);
  expiringSoonJobs = signal<any>(undefined);
  
  // Filter properties
  searchValue = signal<string>('');
  selectedStatus = signal<string>('All Status');
  selectedSort = signal<string>('PostedDateDesc');

  constructor(private jobService: JobsService) {}

  ngOnInit(): void {
    this.loadEmployerJobs();
    this.loadExpiringSoonJobs();
  }

  /******************************************************************************/
  /*---------------------------Expiring Soon Jobs------------------------------ */
  loadExpiringSoonJobs(){
    this.jobService.getExpiringSoonJobs().subscribe({
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




  /******************************************************************************/
  /*-----------------------------Employer Jobs--------------------------------- */
  loadEmployerJobs() {
    this.isLoading.set(true);
    
    // Build filter parameters
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
        console.log('Data From SQL:', jobs);
        this.postedJobs.set(jobs);
        console.log('Posted Jobs: ', this.postedJobs());
        this.isLoading.set(false);
      },
      error: (err) => {
        console.log(err);
        this.isLoading.set(false);
      }
    });
  }

  // Event handlers for filters
  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchValue.set(target.value);
    this.loadEmployerJobs(); // Auto-search on input change
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

  // Clear all filters
  clearFilters() {
    this.searchValue.set('');
    this.selectedStatus.set('All Status');
    this.selectedSort.set('PostedDateDesc');
    this.loadEmployerJobs();
  }

  
  /****************************************************************/
  /*--------------------------Delete Job------------------------- */
  deleteJob(jobId: number, jobTitle: string) {
    // More informative confirmation message
    const confirmMessage = `Are you sure you want to delete the job "${jobTitle}"? This action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
      this.isLoading.set(true);
      
      this.jobService.deleteJob(jobId).subscribe({
        next: (response) => {
          console.log('Job deleted successfully:', response);
          
          // Remove the job from the local array immediately for better UX
          const currentJobs = this.postedJobs();
          const updatedJobs = currentJobs.filter(job => job.id !== jobId);
          this.postedJobs.set(updatedJobs);
          
          // Optionally, refresh from server to ensure data consistency
          // this.loadEmployerJobs();
          
          this.isLoading.set(false);
          
          // Show success message (you might want to use a toast notification instead)
          alert(`Job "${jobTitle}" has been deleted successfully.`);
        },
        error: (error) => {
          console.error('Error deleting job:', error);
          this.isLoading.set(false);
          
          // Handle different types of errors
          let errorMessage = 'Failed to delete the job. Please try again.';
          
          if (error.status === 401) {
            errorMessage = 'You are not authorized to delete this job.';
          } else if (error.status === 404) {
            errorMessage = 'Job not found. It may have already been deleted.';
          } else if (error.status === 403) {
            errorMessage = 'You do not have permission to delete this job.';
          } else if (error.status === 409) {
            errorMessage = 'Cannot delete job with existing applications.';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          
          alert(errorMessage);
        }
      });
    }
  }

  // Alternative version with better UX using a modal instead of confirm()
  deleteJobWithModal(jobId: number, jobTitle: string) {
    // You would need to implement a proper modal component
    // This is just to show the structure
    
    const modalData = {
      title: 'Delete Job',
      message: `Are you sure you want to delete "${jobTitle}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: () => {
        this.performDeleteJob(jobId, jobTitle);
      }
    };
    
    // Show modal with modalData
    // this.modalService.show(modalData);
  }

  private performDeleteJob(jobId: number, jobTitle: string) {
    this.isLoading.set(true);
    
    this.jobService.deleteJob(jobId).subscribe({
      next: (response) => {
        // Update local state
        const currentJobs = this.postedJobs();
        const updatedJobs = currentJobs.filter(job => job.id !== jobId);
        this.postedJobs.set(updatedJobs);
        
        this.isLoading.set(false);
        
        // Show success toast/notification
        this.showSuccessMessage(`Job "${jobTitle}" deleted successfully`);
      },
      error: (error) => {
        console.error('Error deleting job:', error);
        this.isLoading.set(false);
        this.handleDeleteError(error);
      }
    });
  }

  private handleDeleteError(error: any) {
    let errorMessage = 'Failed to delete the job. Please try again.';
    
    switch (error.status) {
      case 401:
        errorMessage = 'Session expired. Please log in again.';
        // Optionally redirect to login
        break;
      case 403:
        errorMessage = 'You do not have permission to delete this job.';
        break;
      case 404:
        errorMessage = 'Job not found. It may have already been deleted.';
        // Refresh the list to update the UI
        this.loadEmployerJobs();
        break;
      case 409:
        errorMessage = 'Cannot delete job with existing applications. Please contact support.';
        break;
      case 500:
        errorMessage = 'Server error. Please try again later.';
        break;
      default:
        if (error.error?.message) {
          errorMessage = error.error.message;
        }
    }
    
    this.showErrorMessage(errorMessage);
  }

  private showSuccessMessage(message: string) {
    // Implement with your preferred notification system
    // For now, using alert, but consider using a toast library
    alert(message);
  }

  private showErrorMessage(message: string) {
    // Implement with your preferred notification system
    alert(message);
  }
  }