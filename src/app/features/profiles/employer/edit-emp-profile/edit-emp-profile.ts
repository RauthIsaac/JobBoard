import { Component, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from "@angular/material/card";
import { MatDividerModule } from "@angular/material/divider";
import { MaterialModule } from "../../../../shared/material.module";
import { AuthService } from '../../../../auth/auth-service';
import { ProfilesService } from '../../profiles-service';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { MatOptionModule } from '@angular/material/core';
import { Router, RouterLink } from '@angular/router';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { SnackbarService } from '../../../../shared/components/snackbar/snackbar-service';

@Component({
  selector: 'app-edit-emp-profile',
  imports: [ReactiveFormsModule, MatCardModule, MaterialModule, MatDividerModule, CommonModule, MatOptionModule, MatProgressSpinner, RouterLink],
  providers: [ProfilesService],
  templateUrl: './edit-emp-profile.html',
  styleUrl: './edit-emp-profile.css'
})

export class EditEmpProfile implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  currentYear = new Date().getFullYear();
  profileForm: FormGroup;
  empData = signal<any>({});
  isLoading = false;
  
  // Image handling properties
  selectedImageFile: File | null = null;
  imagePreview: string | null = null;
  shouldRemoveImage = false;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private snackbarService: SnackbarService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      companyName: ['', [Validators.required, Validators.maxLength(100)]],
      companyMission: ['', Validators.maxLength(500)],
      companyDescription: ['', [Validators.required, Validators.maxLength(2000)]],
      companyLocation: ['', Validators.required],
      employeeRange: ['', Validators.required],
      establishedYear: [
        this.currentYear.toString(), 
        [
          Validators.required,
          Validators.min(1900),
          Validators.max(this.currentYear),
          Validators.pattern('^[0-9]{4}$')
        ]
      ],
      industry: ['', Validators.required],
      website: ['', [Validators.pattern('https?://.+')]],
      phone: ['', [Validators.pattern('^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$')]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.loadEmployerProfile();

    // ✅ Dynamic stagger animation
    setTimeout(() => {
      const lines = document.querySelectorAll<HTMLElement>('.fade-line');
      lines.forEach((line, index) => {
        line.style.animationDelay = `${index * 0.15}s`;
        line.classList.add('visible');
      });
    }, 600);
  }

  loadEmployerProfile(): void {
    this.authService.getEmployerProfile().subscribe({
      next: (data: any) => {
        this.empData.set(data);
        this.profileForm.patchValue(data);
        
        // Set image preview to current company image or default
        this.imagePreview = data.companyImage || '/default.jpg';
        
        console.log('Employer profile loaded:', data);
        console.log('Image preview set to:', this.imagePreview);
      },
      error: (err: any) => {
        console.error('Error loading employer profile:', err);
        this.showError('Failed to load profile data');
      }
    });
  }

  // Check if user has custom image (not default)
  hasCustomImage(): boolean {
    const currentImage = this.empData().companyImage;
    return currentImage && !currentImage.includes('/default.jpg');
  }

  // Trigger file input click
  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  // Handle image selection
  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.showInfo('Please select a valid image file', 3000);
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.showError('Image size should be less than 5MB', 3000);
        return;
      }

      this.selectedImageFile = file;
      this.shouldRemoveImage = false;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // Remove image (set to default)
  removeImage(): void {
    this.selectedImageFile = null;
    this.imagePreview = '/default.jpg';
    this.shouldRemoveImage = true;
    this.fileInput.nativeElement.value = '';

    this.showSuccess('Image will be removed on save', 3000);
    console.log('Image removed, will use default on save');
  }

  // Handle image error (fallback to default)
  onImageError(event: any): void {
    console.log('Image load error, using default');
    event.target.src = '/default.jpg';
  }

  saveProfile(): void {
    if (this.profileForm.valid) {
      this.isLoading = true;
      
      // Get form data
      const formData = { ...this.profileForm.value };
      
      // Convert establishedYear to number if it exists
      if (formData.establishedYear) {
        formData.establishedYear = parseInt(formData.establishedYear, 10);
      }
      
      // Add remove flag if needed
      if (this.shouldRemoveImage) {
        formData.removeCompanyImage = true;
      }
      
      console.log('Saving profile:', formData);
      console.log('Selected file:', this.selectedImageFile);
      console.log('Should remove:', this.shouldRemoveImage);

      this.authService.updateEmployerProfile(formData, this.selectedImageFile || undefined).subscribe({
        next: (response) => {
          console.log('Profile updated successfully');
          
          this.isLoading = false;

          this.showSuccess('Profile updated successfully!', 3000);

          // Reset flags
          this.selectedImageFile = null;
          this.shouldRemoveImage = false;
            
          this.router.navigate(['/empProfile']);
        },
        error: (err) => {
          console.error('Error updating profile:', err);
          
          this.isLoading = false;
          
          let errorMessage = 'Failed to update profile';
          if (err.error?.message) {
            errorMessage = err.error.message;
          } else if (err.status === 401) {
            errorMessage = 'Unauthorized. Please login again.';
          } else if (err.status === 400) {
            errorMessage = 'Invalid data provided';
          }

          this.showError(errorMessage, 5000);
        }
      });
    } else {
      this.profileForm.markAllAsTouched();
      this.showError('Please fill all required fields correctly', 5000);
    }
  }

  get f() {
    return this.profileForm.controls;
  }


  //#region Snackbar Methods
  showSuccess(message: string = 'Operation successful!', duration: number = 4000, action: string = 'Undo'): void {
    console.log('Showing success snackbar');
    this.snackbarService.show({
      message,
      type: 'success',
      duration,
      action
    });
  }

  showInfo(message: string = 'Information message', duration: number = 5000): void {
    this.snackbarService.show({
      message,
      type: 'info',
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