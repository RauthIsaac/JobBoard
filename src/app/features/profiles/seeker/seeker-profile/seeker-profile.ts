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
import { LoadingPage } from "../../../../shared/components/loading-page/loading-page";

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
    DatePipe,
    LoadingPage
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
        console.log('Profile Image URL from API:', data.profileImageUrl);
        console.log('Default Profile Image:', this.getDefaultProfileImage());
        
        this.seekerData.set({
          ...data,
          skillName: this.parseIfStringArray(data.skillName),
          certificateName: this.parseIfStringArray(data.certificateName),
          interestName: this.parseIfStringArray(data.interestName),
          trainingName: this.parseIfStringArray(data.trainingName),
          seekerExperiences: Array.isArray(data.seekerExperiences) ? data.seekerExperiences : [],
          seekerEducations: Array.isArray(data.seekerEducations) ? data.seekerEducations : []
        });
        
        console.log('Final Profile Image URL:', this.getProfileImageUrl());
        console.log('Has Custom Profile Image:', this.hasCustomProfileImage());
        console.log('Processed seeker data:', this.seekerData());
      },
      error: (err) => {
        console.error('Error loading seeker profile:', err);
        this.showSnackBar('Error loading profile data', 'error');
      }
    });
  }

  // ===== Image Helper Functions =====
  
  /**
   * Returns the profile image URL - either custom or default
   */
  getProfileImageUrl(): string {
    const profileImage = this.seekerData().profileImageUrl;
    const defaultImage = this.getDefaultProfileImage();
    
    // If no profile image or if it matches the default, return default
    if (!profileImage || this.isDefaultImage(profileImage)) {
      return defaultImage;
    }
    
    return profileImage;
  }

  /**
   * Returns the default profile image URL from AuthService
   */
  getDefaultProfileImage(): string {
    return this.AuthService.getDefaultProfileImage();
  }

  /**
   * Checks if the given image URL is a default image
   */
  private isDefaultImage(imageUrl: string): boolean {
    if (!imageUrl) return true;
    
    const defaultImage = this.getDefaultProfileImage();
    
    // Check if it's exactly the default image
    if (imageUrl === defaultImage) return true;
    
    // Check if it ends with the default image filename (for different base URLs)
    if (imageUrl.endsWith('/images/profilepic/user.jpg')) return true;
    
    // Check if it just contains the filename
    if (imageUrl.includes('user.jpg')) return true;
    
    return false;
  }

  /**
   * Checks if user has a custom profile image (not default)
   */
  hasCustomProfileImage(): boolean {
    const currentImage = this.seekerData().profileImageUrl;
    return currentImage && !this.isDefaultImage(currentImage);
  }

  /**
   * Handles image load error by setting default image
   */
  onImageError(event: any): void {
    console.log('Profile image failed to load, using default image');
    console.log('Failed image src:', event.target.src);
    console.log('Default image path:', this.getDefaultProfileImage());
    event.target.src = this.getDefaultProfileImage();
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
        this.loadSeekerProfile(); // Reload to get new image URL
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
    // Check if there is a custom profile image to delete
    if (!this.hasCustomProfileImage()) {
      console.log('No custom profile image to delete.');
      this.showSnackBar('No custom profile image to delete.', 'error');
      return;
    }

    // Ask for user confirmation
    if (confirm('Are you sure you want to delete your profile image?')) {
      this.isUploadingImage.set(true);

      this.AuthService.deleteProfileImage().subscribe({
        next: (response) => {
          this.isUploadingImage.set(false);
          
          // Update profile to show default image
          this.seekerData.update(current => ({
            ...current,
            profileImageUrl: this.getDefaultProfileImage() // Set to default instead of null
          }));

          this.showSnackBar('Profile image deleted successfully!', 'success');
          console.log('Profile image deleted successfully.');
        },
        error: (err) => {
          this.isUploadingImage.set(false);
          console.error('Error deleting profile image:', err);
          this.showSnackBar('Error deleting profile image. Please try again.', 'error');
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
}