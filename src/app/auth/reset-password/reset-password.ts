// reset-password.ts
import { CommonModule, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth-service';
import { SnackbarService } from '../../shared/components/snackbar/snackbar-service';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, CommonModule, NgIf],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css'
})
export class ResetPassword implements OnInit {
  resetForm: FormGroup;
  submitted = false;
  isLoading = false;
  message = '';
  isSuccess = false;
  isError = false;
  
  private email = '';
  private token = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private snackbarService: SnackbarService
  ) {
    this.resetForm = this.fb.group({
      password: ['', [ 
        Validators.required, 
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
       ]],
      confirmPassword: ['', [ Validators.required ]]
    }, {
      validators: this.mustMatch('password', 'confirmPassword')
    });
  }

  ngOnInit() {
    // Get email and token from query parameters
    this.route.queryParamMap.subscribe(params => {
      this.email = params.get('email') || '';
      this.token = params.get('token') || '';
      
      console.log('Reset password params:', { email: this.email, token: this.token });
      
      // If no email or token, redirect to forget password
      if (!this.email || !this.token) {
        this.router.navigate(['/forget-password']);
        return;
      }
    });
  }

  mustMatch(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];

      if (matchingControl.errors && !matchingControl.errors['mismatch']) {
        return;
      }

      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ mismatch: true });
      } else {
        matchingControl.setErrors(null);
      }

      return null;
    };
  }

  onSubmit() {
    this.submitted = true;
    
    if (this.resetForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.message = '';
    this.isSuccess = false;
    this.isError = false;

    const resetData = {
      email: this.email,
      newPassword: this.resetForm.get('password')?.value, 
      token: this.token
    };

    console.log('Resetting password...', resetData);

    this.authService.resetPassword(resetData).subscribe({
      next: (response) => {
        console.log('Password reset successful', response);
        this.isLoading = false;
        this.isSuccess = true;
        this.message = 'Password reset successfully! Redirecting to login...';
        this.showSuccess(this.message);

        // Redirect to login after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (error) => {
        console.error('Password reset failed', error);
        this.isLoading = false;
        this.isError = true;
        this.message = 'Password reset failed. The link may be expired or invalid.';
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