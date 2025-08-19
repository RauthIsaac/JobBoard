import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ApplicationService } from '../../../application-service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './review.html',
  styleUrl: './review.css',
})
export class Review implements OnInit {
  applicationData: any = {};
  isSubmitting: boolean = false;

  constructor(
    private appService: ApplicationService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.applicationData = this.appService.getData();
    
    // If no data available, redirect to first step
    if (!this.applicationData.fullName) {
      this.router.navigate([`/seekerApp/${this.appService.getData().jobId}/personal-info`]);
    }
  }

  goToPrevious() {
    this.router.navigate([`/seekerApp/${this.appService.getData().jobId}/questions`]);
  }

  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  confirmAndSubmit() {
    if (this.isSubmitting) return;
    
    this.isSubmitting = true;
    const data = this.applicationData;
    const formData = new FormData();

    try {
      // Personal Info - matching DTO property names exactly
      formData.append('FullName', data.fullName || '');
      formData.append('Email', data.email || '');
      formData.append('PhoneNumber', data.phoneNumber || '');
      formData.append('CurrentLocation', data.currentLocation || '');
      formData.append('CurrentJobTitle', data.currentJobTitle || '');
      formData.append('YearsOfExperience', data.yearsOfExperience?.toString() || '');

      // Documents - ResumeUrl expects IFormFile
      if (data.cvFile) {
        formData.append('ResumeUrl', data.cvFile, data.cvFile.name);
      }
      formData.append('CoverLetter', data.coverLetter || '');

      // Additional Questions - matching DTO property names
      formData.append('PortfolioUrl', data.portfolioUrl || '');
      formData.append('LinkedInUrl', data.linkedInUrl || '');
      formData.append('GitHubUrl', data.gitHubUrl || '');

      // Job ID - required field
      formData.append('JobId', data.jobId?.toString() || '1');

      // Submit to API
      this.http.post('http://localhost:5007/api/Application', formData).subscribe({
        next: (response) => {
          console.log('✅ Application submitted successfully:', response);
          alert('✅ Application submitted successfully!');
          this.appService.clearData();
          this.router.navigate(['/']); // Navigate to home or success page
        },
        error: (error: HttpErrorResponse) => {
          console.error('❌ Submit error:', error);
          this.handleSubmissionError(error);
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });

    } catch (error) {
      console.error('❌ Error preparing form data:', error);
      alert('❌ Error preparing application data');
      this.isSubmitting = false;
    }
  }

  private handleSubmissionError(error: HttpErrorResponse) {
    this.isSubmitting = false;
    
    let errorMessage = 'Failed to submit application. ';
    
    if (error.status === 400) {
      errorMessage += 'Please check all required fields are filled correctly.';
      if (error.error && typeof error.error === 'object') {
        console.log('Validation errors:', error.error);
      }
    } else if (error.status === 500) {
      errorMessage += 'Server error. Please try again later.';
    } else if (error.status === 0) {
      errorMessage += 'Cannot connect to server. Please check if the API is running.';
    } else {
      errorMessage += `Server returned error ${error.status}.`;
    }
    
    alert('❌ ' + errorMessage);
    console.log('Form data that was sent:', this.getFormDataEntries(error));
  }

  private getFormDataEntries(error: any): any {
    // Helper method to log what was actually sent
    const data = this.applicationData;
    return {
      FullName: data.fullName,
      Email: data.email,
      PhoneNumber: data.phoneNumber,
      CurrentLocation: data.currentLocation,
      CurrentJobTitle: data.currentJobTitle,
      YearsOfExperience: data.yearsOfExperience,
      CoverLetter: data.coverLetter,
      PortfolioUrl: data.portfolioUrl,
      LinkedInUrl: data.linkedInUrl,
      GitHubUrl: data.gitHubUrl,
      JobId: data.jobId,
      HasResumeFile: !!data.cvFile,
      ResumeFileName: data.cvFile?.name
    };
  }
}