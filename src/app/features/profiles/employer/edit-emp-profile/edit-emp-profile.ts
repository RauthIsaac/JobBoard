import { Component, OnInit, signal } from '@angular/core';
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
  currentYear = new Date().getFullYear();
  profileForm: FormGroup;
  empData = signal<any>({});
  isLoading = false;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      companyName: ['', [Validators.required, Validators.maxLength(100)]],
      companyImage: ['', [Validators.pattern('https?://.+')]],
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

      this.authService.updateEmployerProfile(formData).subscribe({
        next: (response) => {
          console.log('Profile updated successfully:', response);
          
          // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => {
            this.isLoading = false;
            
            this.snackBar.open('Profile updated successfully!', 'Close', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top'
            });

            // Optionally refresh the profile data
            this.loadEmployerProfile();
          });
        },
        error: (err) => {
          console.error('Error updating profile:', err);
          
          // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
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