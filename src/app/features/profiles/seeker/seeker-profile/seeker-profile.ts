import { Component, OnInit, signal, Pipe, PipeTransform, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../auth/auth-service';
import { RouterLink } from '@angular/router';

@Pipe({
  name: 'educationLevelName',
  standalone: true
})
export class EducationLevelPipe implements PipeTransform {
  private educationLevels: { [key: number]: string } = {
    0: 'High School',
    1: 'Bachelor',
    2: 'Diploma', 
    3: 'Master',
    4: 'Doctorate',
    5: 'Not Specified'
  };

  transform(value: number): string {
    return this.educationLevels[value] || 'Not Specified';
  }
}

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
    RouterLink,
    DatePipe,
    EducationLevelPipe,
  ],
  templateUrl: './seeker-profile.html',
  styleUrl: './seeker-profile.css'
})
export class SeekerProfile implements OnInit {

  seekerData = signal<any>({});
  isUploadingResume = signal<boolean>(false);
  
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

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

 
  openFileDialog(): void {
    this.fileInput.nativeElement.click();
  }

  /*---------------------------- Save Auth Data ----------------------------*/
  onFileSelected(event: Event): void {
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
      next: (response:any) => {
        this.isUploadingResume.set(false);
        this.showSnackBar('Resume uploaded successfully!', 'success');

        this.loadSeekerProfile();
        
        this.fileInput.nativeElement.value = '';
      },
      error: (err:any) => {
        this.isUploadingResume.set(false);
        console.error('Error uploading resume:', err);
        this.showSnackBar('Error uploading resume. Please try again.', 'error');
        

        this.fileInput.nativeElement.value = '';
      }
    });
  }


  downloadResume(): void {
    if (!this.seekerData().resumeUrl) {
      this.showSnackBar('No resume available to download', 'error');
      return;
    }

    this.AuthService.downloadResume().subscribe({
      next: (blob:any) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.seekerData().name}_Resume.pdf`;
        link.click();
        
 
        window.URL.revokeObjectURL(url);
        
        this.showSnackBar('Resume downloaded successfully!', 'success');
      },
      error: (err:any) => {
        console.error('Error downloading resume:', err);
        this.showSnackBar('Error downloading resume. Please try again.', 'error');
      }
    });
  }


  deleteResume(): void {
    if (!this.seekerData().resumeUrl) {
      this.showSnackBar('No resume to delete', 'error');
      return;
    }

    if (confirm('Are you sure you want to delete your resume?')) {
      this.AuthService.deleteResume().subscribe({
        next: (response:any) => {
          this.showSnackBar('Resume deleted successfully!', 'success');
          this.loadSeekerProfile();
        },
        error: (err:any) => {
          console.error('Error deleting resume:', err);
          this.showSnackBar('Error deleting resume. Please try again.', 'error');
        }
      });
    }
  }


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