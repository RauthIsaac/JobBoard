import { CommonModule, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth-service';
import { SnackbarService } from '../../shared/components/snackbar/snackbar-service';

@Component({
  selector: 'app-forget-password',
  imports: [ReactiveFormsModule, CommonModule, NgIf],
  templateUrl: './forget-password.html',
  styleUrl: './forget-password.css'
})
export class ForgetPassword {
  forgetForm: FormGroup;
  submitted = false;
  isLoading = false;
  message = '';
  isSuccess = false;
  isError = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private snackbarService: SnackbarService
  ) {
    this.forgetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    this.submitted = true;

    if (this.forgetForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.message = '';
    this.isSuccess = false;
    this.isError = false;

    const email = this.forgetForm.get('email')?.value;

    this.authService.forgetPassword(email).subscribe({
      next: (response) => {
        console.log('Forget password request sent', response);
        this.isLoading = false;
        this.isSuccess = true;
        this.message = 'Password reset link has been sent to your email. Please check your inbox.';
        this.showInfo(this.message);
        
        // Navigate to confirm-email page with email parameter
        setTimeout(() => {
          this.router.navigate(['/confirm-email'], { 
            queryParams: { 
              email: email,
              type: 'reset-password' // To distinguish from regular email confirmation
            } 
          });
        }, 2000);
      },
      error: (error) => {
        console.error('Forget password failed', error);
        this.isLoading = false;
        this.isError = true;
        this.message = 'Failed to send reset email. Please try again.';
        this.showError(this.message);
      }
    });
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