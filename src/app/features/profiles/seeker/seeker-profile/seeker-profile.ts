import { Component, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../../auth/auth-service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-profile',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatListModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatTooltipModule,
    RouterLink,
    DatePipe
  ],
  templateUrl: './seeker-profile.html',
  styleUrl: './seeker-profile.css'
})
export class SeekerProfile implements OnInit {

  seekerData = signal<any>({});
  isUploadingResume = signal<boolean>(false);
  isUploadingImage = signal<boolean>(false);
  
  @ViewChild('resumeFileInput') resumeFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('imageFileInput') imageFileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private AuthService: AuthService,
    private snackBar: MatSnackBar
  ) { 
  }

  ngOnInit(): void {
    this.loadSeekerProfile();
  }

  loadSeekerProfile() {
    this.AuthService.getSeekerProfile().subscribe({
      next: (data) => {
        console.log('Raw data from API:', data);
        
        this.seekerData.set({
          ...data,
          skillName: this.parseIfStringArray(data.skillName),
          certificateName: this.parseIfStringArray(data.certificateName),
          interestName: this.parseIfStringArray(data.interestName),
          trainingName: this.parseIfStringArray(data.trainingName),
          seekerExperiences: Array.isArray(data.seekerExperiences) ? data.seekerExperiences : [],
          seekerEducations: Array.isArray(data.seekerEducations) ? data.seekerEducations : []
        });
        
        console.log('Processed seeker data:', this.seekerData());
      },
      error: (err) => {
        console.error('Error loading seeker profile:', err);
        this.showSnackBar('Error loading profile data', 'error');
      }
    });
  }

  // ===== Profile Image Functions =====
  openImageFileDialog(): void {
    this.imageFileInput.nativeElement.click();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;

    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedImageTypes.includes(file.type)) {
      this.showSnackBar('Please select a valid image file (JPG, PNG, GIF)', 'error');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.showSnackBar('Image size should not exceed 5MB', 'error');
      return;
    }

    this.uploadProfileImage(file);
  }

  uploadProfileImage(file: File): void {
    this.isUploadingImage.set(true);

    this.AuthService.uploadProfileImage(file).subscribe({
      next: (response: any) => {
        this.isUploadingImage.set(false);
        this.showSnackBar('Profile image uploaded successfully!', 'success');
        this.loadSeekerProfile();
        this.imageFileInput.nativeElement.value = '';
      },
      error: (err: any) => {
        this.isUploadingImage.set(false);
        console.error('Error uploading profile image:', err);
        this.showSnackBar('Error uploading profile image. Please try again.', 'error');
        this.imageFileInput.nativeElement.value = '';
      }
    });
  }

  deleteProfileImage(): void {
  if (!this.seekerData().profileImageUrl) {
    this.showSnackBar('No profile image to delete', 'error');
    return;
  }

  if (confirm('Are you sure you want to delete your profile image?')) {
    this.isUploadingImage.set(true);
    
    this.AuthService.deleteProfileImage().subscribe({
      next: () => {
        this.isUploadingImage.set(false);
        this.showSnackBar('Profile image deleted successfully!', 'success');
        this.loadSeekerProfile();
      },
      error: (err: any) => {
        console.error('Error deleting profile image:', err);
        
        this.loadSeekerProfile();

        setTimeout(() => {
          if (!this.seekerData().profileImageUrl) {
            this.showSnackBar('Profile image deleted successfully!', 'success');
          } else {
            this.showSnackBar('Error deleting profile image. Please try again.', 'error');
          }
          this.isUploadingImage.set(false);
        }, 1000);
      }
    });
  }
}


  // ===== Resume Functions =====
  openResumeFileDialog(): void {
    this.resumeFileInput.nativeElement.click();
  }

  onResumeSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      this.showSnackBar('Please select a PDF or Word document', 'error');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      this.showSnackBar('File size should not exceed 5MB', 'error');
      return;
    }

    this.uploadResume(file);
  }

  uploadResume(file: File): void {
    this.isUploadingResume.set(true);

    this.AuthService.uploadResume(file).subscribe({
      next: (response: any) => {
        this.isUploadingResume.set(false);
        this.showSnackBar('Resume uploaded successfully!', 'success');
        this.loadSeekerProfile();
        this.resumeFileInput.nativeElement.value = '';
      },
      error: (err: any) => {
        this.isUploadingResume.set(false);
        console.error('Error uploading resume:', err);
        this.showSnackBar('Error uploading resume. Please try again.', 'error');
        this.resumeFileInput.nativeElement.value = '';
      }
    });
  }


  deleteResume(): void {
    if (!this.seekerData().cV_Url) {
      this.showSnackBar('No resume to delete', 'error');
      return;
    }

    if (confirm('Are you sure you want to delete your resume?')) {
      this.isUploadingResume.set(true);
      
      this.AuthService.deleteResume().subscribe({
        next: () => {
          this.isUploadingResume.set(false);
          this.showSnackBar('Resume deleted successfully!', 'success');
          this.loadSeekerProfile();
        },
        error: (err: any) => {
          console.error('Error deleting resume:', err);

          this.loadSeekerProfile();

          setTimeout(() => {
            if (!this.seekerData().cV_Url) {
              this.showSnackBar('Resume deleted successfully!', 'success');
            } else {
              this.showSnackBar('Error deleting resume. Please try again.', 'error');
            }
            this.isUploadingResume.set(false);
          }, 1000);
        }
      });
    }
  }


  // ===== Helper Functions =====
  private showSnackBar(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      panelClass: type === 'success' ? 'success-snackbar' : 'error-snackbar',
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  private parseIfStringArray(value: any): string[] {
    if (!value) return [];
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [value];
      }
    }
    return Array.isArray(value) ? value : [value];
  }

  trackByIndex(index: number, item: any): any {
    return index;
  }

  getDefaultProfileImage(): string {
    return 'assets/images/default-avatar.png'; // Add a default avatar image
  }
}