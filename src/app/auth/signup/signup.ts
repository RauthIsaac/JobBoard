import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, NgZone, OnDestroy } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { catchError, of, timeout } from 'rxjs';
import { MaterialModule } from '../../shared/material.module';
import { AuthService } from './../auth-service';

declare const google: any;

interface GoogleResponse {
  credential: string;
}

interface LoginResponse {
  succeeded: boolean;
  token?: string;
  expiration?: string;
  role?: string;
  message?: string;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    FormsModule,
    RouterModule,
    MatRadioModule,
  ],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup implements AfterViewInit, OnDestroy {
  signupForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  errorMessage: string | null = null;
  
  // Google Sign-in properties
  isGoogleLoading = false;
  googleErrorMessage = '';
  googleSuccessMessage = '';
  private readonly API_BASE_URL = this.getApiBaseUrl();
  private googleInitialized = false;

  constructor(
    private fb: FormBuilder,
    private AuthService: AuthService,
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private ngZone: NgZone,
    private router: Router
  ) {
    this.signupForm = this.fb.group(
      {
        userName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', Validators.required],
        confirmPassword: ['', Validators.required],
        user_type: ['Seeker'], // Default: Seeker
        companyName: [''],
        companyLocation: ['']
      },
      { validators: this.passwordMatchValidator }
    );

    this.signupForm.get('user_type')?.valueChanges.subscribe((value) => {
      this.updateCompanyValidators(value);
      this.updateGoogleFormValidators(value);
    });
  }

  ngAfterViewInit(): void {
    // Delay Google initialization to ensure DOM is ready
    setTimeout(() => {
      this.loadGoogleScript();
    }, 100);
  }

  ngOnDestroy(): void {
    // Clean up global callback
    delete (window as any).handleGoogleResponse;
  }

  private getApiBaseUrl(): string {
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isDevelopment ? 'http://localhost:5007/api' : 'https://localhost:5007/api';
  }

  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }

    return null;
  }

  updateCompanyValidators(userType: string) {
    const companyName = this.signupForm.get('companyName');
    const companyLocation = this.signupForm.get('companyLocation');

    if (userType === 'Employer') {
      companyName?.setValidators(Validators.required);
      companyLocation?.setValidators(Validators.required);
    } else {
      companyName?.clearValidators();
      companyLocation?.clearValidators();
      companyName?.setValue('');
      companyLocation?.setValue('');
    }

    companyName?.updateValueAndValidity();
    companyLocation?.updateValueAndValidity();
  }

  // Update validators for Google form when user type changes
  private updateGoogleFormValidators(userType: string): void {
    const companyName = this.signupForm.get('companyName');
    const companyLocation = this.signupForm.get('companyLocation');

    if (userType === 'Employer') {
      companyName?.setValidators([
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
      ]);
      companyLocation?.setValidators([
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(200)
      ]);
    } else {
      companyName?.clearValidators();
      companyLocation?.clearValidators();
      companyName?.setValue('');
      companyLocation?.setValue('');
    }

    companyName?.updateValueAndValidity();
    companyLocation?.updateValueAndValidity();
  }

  // Traditional form submission
  onSubmit() {
    if (this.signupForm.valid) {
      let payload = { ...this.signupForm.value };
      
      if (payload.user_type === 'Seeker') {
        delete payload.companyName;
        delete payload.companyLocation;
      }
      
      console.log('Payload sent to API:', payload);
    
      this.AuthService.register(payload).subscribe({
        next: (res) => {
          console.log('Registration success!', res);
          this.snackBar.open(`Registration successful!, ${res?.message}`, 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        },
        error: (err) => {
          console.error('Registration failed', err);
          this.snackBar.open(`Registration failed!, ${err?.message}`, 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
            
        const errorMsg = err?.error?.message || err?.message || '';
        const message = errorMsg.toLowerCase();
            
        if (message.includes('username') || message.includes('user')) {
          this.signupForm.get('userName')?.setErrors({ notUnique: true });
          this.signupForm.get('userName')?.markAsTouched();
        }
      
        if (message.includes('email')) {
          this.signupForm.get('email')?.setErrors({ notUnique: true });
          this.signupForm.get('email')?.markAsTouched();
        }
      }
      });
    } else {
      this.signupForm.markAllAsTouched();
    }
  }

  // Google Sign-in methods
  private loadGoogleScript(): void {
    if (typeof google !== 'undefined' && google.accounts) {
      this.initializeGoogleSignIn();
      return;
    }

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => this.initializeGoogleSignIn());
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('Google GSI script loaded');
      this.initializeGoogleSignIn();
    };
    script.onerror = (error) => {
      console.error('Failed to load Google GSI script:', error);
      this.googleErrorMessage = 'Failed to load Google Sign-in. Please refresh the page.';
    };
    
    document.head.appendChild(script);
  }

  private initializeGoogleSignIn(): void {
    try {
      if (typeof google === 'undefined' || !google.accounts) {
        setTimeout(() => this.initializeGoogleSignIn(), 1000);
        return;
      }

      if (this.googleInitialized) return;

      google.accounts.id.initialize({
        client_id: "224595746676-3mi5ivedv9khq6m9f2fmqff27vlc96t5.apps.googleusercontent.com",
        callback: (response: GoogleResponse) => {
          this.ngZone.run(() => this.handleGoogleSignup(response));
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false
      });

      // Render button after ensuring DOM is ready
      this.renderGoogleButton();
      this.googleInitialized = true;

    } catch (error) {
      console.error('Error initializing Google Sign-In:', error);
      this.googleErrorMessage = 'Failed to initialize Google Sign-up. Please refresh the page.';
    }
  }


  private renderGoogleButton(): void {
    const buttonElement = document.querySelector('.g_id_signin');
    if (buttonElement) {
      buttonElement.innerHTML = '';
      try {
        google.accounts.id.renderButton(buttonElement, {
          theme: "outline",
          size: "large",
          text: "signup_with",
          shape: "rectangular",
          width: 250
        });
        console.log('Google Sign-up button rendered successfully');
      } catch (renderError) {
        console.error('Error rendering Google button:', renderError);
        this.googleErrorMessage = 'Failed to load Google Sign-up button.';
      }
    } else {
      console.warn('Google button container not found, retrying...');
      setTimeout(() => this.renderGoogleButton(), 500);
    }
  }

  handleGoogleSignup(response: GoogleResponse): void {
    if (this.isGoogleLoading) return;

    this.clearGoogleMessages();

    // Validate form before proceeding (only company fields if Employer)
    if (!this.validateGoogleForm()) {
      return;
    }

    this.isGoogleLoading = true;
    const idToken = response.credential;
    const role = this.signupForm.value.user_type;

    const dto: any = {
      idToken: idToken,
      roleFromClient: role
    };

    if (role === 'Employer') {
      dto.companyName = this.signupForm.value.companyName.trim();
      dto.companyLocation = this.signupForm.value.companyLocation.trim();
    }

    this.http.post<LoginResponse>(`${this.API_BASE_URL}/Auth/ExternalLogin`, dto)
      .pipe(
        timeout(30000),
        catchError(error => {
          if (error.name === 'TimeoutError') {
            return of({
              succeeded: false,
              message: 'Request timed out. Please check your connection and try again.'
            } as LoginResponse);
          }
          throw error;
        })
      )
      .subscribe({
        next: (res: LoginResponse) => {
          this.handleGoogleSignupSuccess(res, role);
        },
        error: (error: HttpErrorResponse) => {
          this.handleGoogleSignupError(error);
        },
        complete: () => {
          this.isGoogleLoading = false;
        }
      });
  }

  private validateGoogleForm(): boolean {
    const role = this.signupForm.value.user_type;

    if (role === 'Employer') {
      const companyName = this.signupForm.value.companyName?.trim();
      const companyLocation = this.signupForm.value.companyLocation?.trim();

      if (!companyName || companyName.length < 2) {
        this.googleErrorMessage = 'Please provide a valid company name (minimum 2 characters).';
        return false;
      }

      if (!companyLocation || companyLocation.length < 3) {
        this.googleErrorMessage = 'Please provide a valid company location (minimum 3 characters).';
        return false;
      }
    }

    return true;
  }

  private handleGoogleSignupSuccess(response: LoginResponse, role: string): void {
    if (response.succeeded && response.token) {
      const finalRole = response.role || role;
      
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user_type', finalRole);
      
      if (response.expiration) {
        localStorage.setItem('tokenExpiration', response.expiration);
      }

      try {
        const tokenPayload = JSON.parse(atob(response.token.split('.')[1]));
        if (tokenPayload.email) {
          localStorage.setItem('user_email', tokenPayload.email);
        }
        if (tokenPayload.name || tokenPayload.given_name) {
          localStorage.setItem('user_name', tokenPayload.name || tokenPayload.given_name);
        }
        
        if (tokenPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']) {
          const jwtRole = tokenPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
          localStorage.setItem('user_type', jwtRole);
        }
        
      } catch (error) {
        console.log('Could not parse token payload:', error);
      }

      this.googleSuccessMessage = `Successfully registered as ${finalRole}!`;
      
      setTimeout(() => {
        this.redirectUser(finalRole);
      }, 1000);
    } else {
      this.googleErrorMessage = response.message || 'Registration failed. Please try again.';
    }
  }

  private handleGoogleSignupError(error: HttpErrorResponse): void {
    let errorMsg = 'Registration failed. Please try again.';
    
    if (error.status === 0) {
      errorMsg = 'Unable to connect to the server. Please check your connection.';
    } else if (error.error?.message) {
      errorMsg = error.error.message;
    } else if (error.status >= 500) {
      errorMsg = 'Server error occurred. Please try again later.';
    }

    this.googleErrorMessage = errorMsg;
  }

  private redirectUser(role: string): void {
    switch (role.toLowerCase()) {
      case 'employer':
        this.router.navigate(['/empDashboard']);
        break;
      case 'seeker':
        this.router.navigate(['/home']);
        break;
      default:
        this.router.navigate(['/dashboard']);
    }
  }

  private clearGoogleMessages(): void {
    this.googleErrorMessage = '';
    this.googleSuccessMessage = '';
  }

  // Getter for easy access in template
  get isEmployer(): boolean {
    return this.signupForm?.get('user_type')?.value === 'Employer';
  }

  get companyNameError(): string {
    const control = this.signupForm?.get('companyName');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Company name is required';
      if (control.errors['minlength']) return 'Company name must be at least 2 characters';
      if (control.errors['maxlength']) return 'Company name must not exceed 100 characters';
    }
    return '';
  }

  get companyLocationError(): string {
    const control = this.signupForm?.get('companyLocation');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Company location is required';
      if (control.errors['minlength']) return 'Company location must be at least 3 characters';
      if (control.errors['maxlength']) return 'Company location must not exceed 200 characters';
    }
    return '';
  }
}