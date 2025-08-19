// import { Component, OnInit, signal } from '@angular/core';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// import { MatCardModule } from "@angular/material/card";
// import { MatDividerModule } from "@angular/material/divider";
// import { MaterialModule } from "../../../../shared/material.module";
// import { AuthService } from '../../../../auth/auth-service';
// import { ProfilesService } from '../../profiles-service';
// import { CommonModule, NgFor, NgIf } from '@angular/common';
// import { MatOptionModule } from '@angular/material/core';
// import { MatSnackBar } from '@angular/material/snack-bar';
// import { Router } from '@angular/router';
// import { MatProgressSpinner } from '@angular/material/progress-spinner';

// @Component({
//   selector: 'app-edit-emp-profile',
//   imports: [ReactiveFormsModule, MatCardModule, MaterialModule, MatDividerModule, CommonModule, MatOptionModule, MatProgressSpinner],
//   providers: [ProfilesService],
//   templateUrl: './edit-emp-profile.html',
//   styleUrl: './edit-emp-profile.css'
// })

// export class EditEmpProfile implements OnInit {
//   currentYear = new Date().getFullYear();
//   profileForm: FormGroup;
//   empData = signal<any>({});
//   isLoading = false;

//   constructor(
//     private authService: AuthService,
//     private fb: FormBuilder,
//     private snackBar: MatSnackBar,
//     private router: Router
//   ) {
//     this.profileForm = this.fb.group({
//       companyName: ['', [Validators.required, Validators.maxLength(100)]],
//       companyImage: ['', [Validators.pattern('https?://.+')]],
//       companyMission: ['', Validators.maxLength(500)],
//       companyDescription: ['', [Validators.required, Validators.maxLength(2000)]],
//       companyLocation: ['', Validators.required],
//       employeeRange: ['', Validators.required],
//       establishedYear: [
//         this.currentYear.toString(), 
//         [
//           Validators.required,
//           Validators.min(1900),
//           Validators.max(this.currentYear),
//           Validators.pattern('^[0-9]{4}$')
//         ]
//       ],
//       industry: ['', Validators.required],
//       website: ['', [Validators.pattern('https?://.+')]],
//       phone: ['', [Validators.pattern('^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$')]],
//       email: ['', [Validators.required, Validators.email]]
//     });
//   }

//   ngOnInit(): void {
//     this.loadEmployerProfile();
//   }

//   loadEmployerProfile(): void {
//     this.authService.getEmployerProfile().subscribe({
//       next: (data: any) => {
//         this.empData.set(data);
//         this.profileForm.patchValue(data);
//         console.log('Employer profile loaded:', this.empData());
//       },
//       error: (err: any) => {
//         console.error('Error loading employer profile:', err);
//         this.snackBar.open('Failed to load profile data', 'Close', {
//           duration: 3000,
//           horizontalPosition: 'center',
//           verticalPosition: 'top'
//         });
//       }
//     });
//   }

//   saveProfile(): void {
//     if (this.profileForm.valid) {
//       this.isLoading = true;
      
//       // Get form data
//       const formData = { ...this.profileForm.value };
      
//       // Convert establishedYear to number if it exists
//       if (formData.establishedYear) {
//         formData.establishedYear = parseInt(formData.establishedYear, 10);
//       }
      
//       console.log('Saving profile data:', formData);

//       this.authService.updateEmployerProfile(formData).subscribe({
//         next: (response) => {
//           console.log('Profile updated successfully:', response);
          
//           // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
//           setTimeout(() => {
//             this.isLoading = false;
            
//             this.snackBar.open('Profile updated successfully!', 'Close', {
//               duration: 3000,
//               horizontalPosition: 'center',
//               verticalPosition: 'top'
//             });

//             // Optionally refresh the profile data
//             this.loadEmployerProfile();
//           });
//         },
//         error: (err) => {
//           console.error('Error updating profile:', err);
          
//           // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
//           setTimeout(() => {
//             this.isLoading = false;
            
//             let errorMessage = 'Failed to update profile';
//             if (err.error?.message) {
//               errorMessage = err.error.message;
//             } else if (err.status === 401) {
//               errorMessage = 'Unauthorized. Please login again.';
//             } else if (err.status === 400) {
//               errorMessage = 'Invalid data provided';
//             }

//             this.snackBar.open(errorMessage, 'Close', {
//               duration: 5000,
//               horizontalPosition: 'center',
//               verticalPosition: 'top'
//             });
//           });
//         }
//       });
//     } else {
//       this.profileForm.markAllAsTouched();
//       this.snackBar.open('Please fill all required fields correctly', 'Close', {
//         duration: 3000,
//         horizontalPosition: 'center',
//         verticalPosition: 'top'
//       });
//     }
//   }

//   get f() {
//     return this.profileForm.controls;
//   }
// }

// ============================================================

import { Component, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from "@angular/material/card";
import { MatDividerModule } from "@angular/material/divider";
import { MaterialModule } from "../../../../shared/material.module";
import { AuthService } from '../../../../auth/auth-service';
import { ProfilesService } from '../../profiles-service';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { MatOptionModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-edit-emp-profile',
  imports: [ReactiveFormsModule, MatCardModule, MaterialModule, MatDividerModule, CommonModule, MatOptionModule, MatProgressSpinner],
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
  companyImagePreview: string | null = null;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
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
  }

  loadEmployerProfile(): void {
    this.authService.getEmployerProfile().subscribe({
      next: (data: any) => {
        this.empData.set(data);
        this.profileForm.patchValue(data);
        
        // Set existing company image if available
        if (data.companyImage) {
          this.companyImagePreview = data.companyImage;
        }
        
        console.log('Employer profile loaded:', this.empData());
      },
      error: (err: any) => {
        console.error('Error loading employer profile:', err);
        this.snackBar.open('Failed to load profile data', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
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
        this.snackBar.open('Please select a valid image file', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.snackBar.open('Image size should be less than 5MB', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        return;
      }

      this.selectedImageFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.companyImagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // Remove image
  removeImage(): void {
    this.selectedImageFile = null;
    this.companyImagePreview = null;
    this.fileInput.nativeElement.value = '';
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
      
      console.log('Saving profile data:', formData);
      console.log('Selected image file:', this.selectedImageFile);

      this.authService.updateEmployerProfile(formData, this.selectedImageFile || undefined).subscribe({
        next: (response) => {
          console.log('Profile updated successfully:', response);
          
          setTimeout(() => {
            this.isLoading = false;
            
            this.snackBar.open('Profile updated successfully!', 'Close', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top'
            });

            this.selectedImageFile = null;
              
           this.router.navigate(['/empProfile']);

          });
        },
        error: (err) => {
          console.error('Error updating profile:', err);
          
          setTimeout(() => {
            this.isLoading = false;
            
            let errorMessage = 'Failed to update profile';
            if (err.error?.message) {
              errorMessage = err.error.message;
            } else if (err.status === 401) {
              errorMessage = 'Unauthorized. Please login again.';
            } else if (err.status === 400) {
              errorMessage = 'Invalid data provided';
            }

            this.snackBar.open(errorMessage, 'Close', {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'top'
            });
          });
        }
      });
    } else {
      this.profileForm.markAllAsTouched();
      this.snackBar.open('Please fill all required fields correctly', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    }
  }

  get f() {
    return this.profileForm.controls;
  }
}