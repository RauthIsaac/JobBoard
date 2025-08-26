import { Component, NgZone, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { ReactiveFormsModule, FormGroup, Validators, AbstractControl, FormBuilder, FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material.module';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, timeout, catchError } from 'rxjs';
import { AuthService } from '../auth-service';

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
  styleUrls: ['./signup.css']
}) 
export class Signup implements AfterViewInit, OnDestroy {
  signupForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  errorMessage: string | null = null;
  isGoogleLoading = false;
  googleErrorMessage = '';
  googleSuccessMessage = '';
  private readonly API_BASE_URL = this.getApiBaseUrl();
  private googleInitialized = false;
  private googleScriptLoaded = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private ngZone: NgZone,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.signupForm = this.fb.group(
      {
        userName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9]+$/)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
        confirmPassword: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
        user_type: ['Seeker', Validators.required],
        companyName: [''],
        companyLocation: ['']
      },
      { validators: this.passwordMatchValidator }
    );

    this.signupForm.get('user_type')?.valueChanges.subscribe((value) => {
      this.updateCompanyValidators(value);
    });

    // Clear error messages when main fields change
    this.signupForm.get('userName')?.valueChanges.subscribe(() => {
      if (this.errorMessage && this.errorMessage.includes('Username already exists')) {
        this.clearErrorMessages();
      }
    });

    this.signupForm.get('email')?.valueChanges.subscribe(() => {
      if (this.errorMessage && (this.errorMessage.includes('Email already exists') || this.errorMessage.includes('already exists'))) {
        this.clearErrorMessages();
      }
    });

    this.signupForm.valueChanges.subscribe(() => {
      if (this.errorMessage) {
        setTimeout(() => {
          if (this.errorMessage && this.errorMessage.includes('already exists')) {
            this.clearErrorMessages();
          }
        }, 1000);
      }
    });

    // Load Google script immediately
    this.loadGoogleScript();
  }

  ngAfterViewInit(): void {
    // Try to initialize Google if script is already loaded
    if (this.googleScriptLoaded) {
      this.initializeGoogleSignIn();
    } else {
      // Check every 100ms if script is loaded
      const checkInterval = setInterval(() => {
        if (this.googleScriptLoaded) {
          this.initializeGoogleSignIn();
          clearInterval(checkInterval);
        }
      }, 100);

      // Clear interval after 10 seconds to prevent infinite checking
      setTimeout(() => {
        clearInterval(checkInterval);
      }, 10000);
    }
  }

  ngOnDestroy(): void {
    delete (window as any).handleGoogleResponse;
  }

  private getApiBaseUrl(): string {
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isDevelopment ? 'http://localhost:5007/api' : 'https://localhost:5007/api';
  }

  private clearErrorMessages(): void {
    this.errorMessage = null;
    this.googleErrorMessage = '';
    this.googleSuccessMessage = '';
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
      companyName?.setValidators([Validators.required, Validators.minLength(2), Validators.maxLength(100)]);
      companyLocation?.setValidators([Validators.required, Validators.minLength(3), Validators.maxLength(200)]);
    } else {
      companyName?.clearValidators();
      companyLocation?.clearValidators();
      companyName?.setValue('');
      companyLocation?.setValue('');
    }

    companyName?.updateValueAndValidity();
    companyLocation?.updateValueAndValidity();
  }

  private loadGoogleScript(): void {
    // Check if script is already loaded
    if (typeof google !== 'undefined' && google.accounts) {
      this.googleScriptLoaded = true;
      return;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      this.googleScriptLoaded = true;
      return;
    }

    // Create and load the script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('Google GSI script loaded');
      this.googleScriptLoaded = true;
      this.ngZone.run(() => {
        this.initializeGoogleSignIn();
      });
    };
    
    script.onerror = (error) => {
      console.error('Failed to load Google GSI script:', error);
      this.googleErrorMessage = 'Failed to load Google Sign-in. Please refresh the page.';
      this.cdr.detectChanges();
    };

    document.head.appendChild(script);
  }

  private initializeGoogleSignIn(): void {
    try {
      // Wait for Google to be available
      if (typeof google === 'undefined' || !google.accounts) {
        console.log('Google not ready yet, retrying...');
        setTimeout(() => this.initializeGoogleSignIn(), 500);
        return;
      }

      if (this.googleInitialized) {
        console.log('Google already initialized');
        return;
      }

      console.log('Initializing Google Sign-in...');

      google.accounts.id.initialize({
        client_id: "224595746676-3mi5ivedv9khq6m9f2fmqff27vlc96t5.apps.googleusercontent.com",
        callback: (response: GoogleResponse) => {
          this.ngZone.run(() => this.handleGoogleSignup(response));
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false
      });

      this.renderGoogleButton();
      this.googleInitialized = true;
      this.clearErrorMessages();

      console.log('Google Sign-in initialized successfully');

    } catch (error) {
      console.error('Error initializing Google Sign-in:', error);
      this.googleErrorMessage = 'Failed to initialize Google Sign-up. Please refresh the page.';
      this.cdr.detectChanges();
    }
  }

  private renderGoogleButton(): void {
    const maxAttempts = 10;
    let attempts = 0;
    
    const tryRender = () => {
      const buttonElement = document.querySelector('.g_id_signin') as HTMLElement;
      
      if (!buttonElement) {
        attempts++;
        if (attempts < maxAttempts) {
          console.log(`Button container not found, attempt ${attempts}/${maxAttempts}`);
          setTimeout(tryRender, 200);
        } else {
          console.error('Google button container not found after maximum attempts');
          this.googleErrorMessage = 'Google button container not found.';
          this.cdr.detectChanges();
        }
        return;
      }

      try {
        // Clear any existing content
        buttonElement.innerHTML = '';
        
        // Render the Google button
        google.accounts.id.renderButton(buttonElement, {
          theme: 'filled_blue',
          size: 'large',
          text: 'signup_with',
          shape: 'rectangular',
          width: 300,
          logo_alignment: 'left',
          locale: 'en'
        });

        console.log('Google button rendered successfully');
        
      } catch (renderError) {
        console.error('Error rendering Google button:', renderError);
        this.googleErrorMessage = 'Failed to load Google Sign-up button.';
        this.cdr.detectChanges();
      }
    };

    // Start the rendering process
    tryRender();
  }

  handleGoogleSignup(response: GoogleResponse): void {
    if (this.isGoogleLoading) return;

    this.clearMessages();

    if (!this.validateGoogleForm()) {
      this.cdr.detectChanges();
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
      dto.companyName = this.signupForm.value.companyName?.trim();
      dto.companyLocation = this.signupForm.value.companyLocation?.trim();
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
          this.cdr.detectChanges();
        },
        error: (error: HttpErrorResponse) => {
          this.handleGoogleSignupError(error);
          this.cdr.detectChanges();
        },
        complete: () => {
          this.isGoogleLoading = false;
          this.cdr.detectChanges();
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

  private clearMessages(): void {
    this.googleErrorMessage = '';
    this.googleSuccessMessage = '';
    this.errorMessage = null;
  }

  // Traditional form submission method
  private validateForm(): boolean {
    this.errorMessage = null;
    this.googleErrorMessage = '';

    if (!this.signupForm.valid) {
      this.signupForm.markAllAsTouched();

      const userName = this.signupForm.get('userName');
      const email = this.signupForm.get('email');
      const password = this.signupForm.get('password');
      const confirmPassword = this.signupForm.get('confirmPassword');
      const companyName = this.signupForm.get('companyName');
      const companyLocation = this.signupForm.get('companyLocation');

      if (userName?.errors?.['required']) {
        this.errorMessage = 'Username is required';
        return false;
      }
      if (userName?.errors?.['minlength']) {
        this.errorMessage = 'Username must be at least 3 characters';
        return false;
      }
      if (userName?.errors?.['pattern']) {
        this.errorMessage = 'Username can only contain letters and numbers';
        return false;
      }
      if (email?.errors?.['required']) {
        this.errorMessage = 'Email is required';
        return false;
      }
      if (email?.errors?.['email']) {
        this.errorMessage = 'Please enter a valid email address';
        return false;
      }
      if (password?.errors?.['required']) {
        this.errorMessage = 'Password is required';
        return false;
      }
      if (password?.errors?.['minlength']) {
        this.errorMessage = 'Password must be at least 6 characters';
        return false;
      }
      if (confirmPassword?.errors?.['required']) {
        this.errorMessage = 'Please confirm your password';
        return false;
      }
      if (this.signupForm.errors?.['passwordMismatch']) {
        this.errorMessage = 'Passwords do not match';
        return false;
      }

      if (this.signupForm.get('user_type')?.value === 'Employer') {
        if (!companyName?.value?.trim()) {
          this.errorMessage = 'Company name is required for employers';
          return false;
        }
        if (!companyLocation?.value?.trim()) {
          this.errorMessage = 'Company location is required for employers';
          return false;
        }
        if (companyName?.errors?.['minlength']) {
          this.errorMessage = 'Company name must be at least 2 characters';
          return false;
        }
        if (companyLocation?.errors?.['minlength']) {
          this.errorMessage = 'Company location must be at least 3 characters';
          return false;
        }
      }

      return false;
    }
    return true;
  }

  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    let payload = { ...this.signupForm.value };

    if (payload.user_type === 'Seeker') {
      delete payload.companyName;
      delete payload.companyLocation;
    }

    console.log('Payload sent to backend:', payload);

    this.authService.register(payload).subscribe({
      next: (res) => {
        this.errorMessage = null;
        this.signupForm.get('userName')?.setErrors(null);
        this.signupForm.get('email')?.setErrors(null);
        this.snackBar.open(`Registration successful! ${res?.message || 'Account created.'}`, 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.router.navigate(['/login']);
      },
      error: (err: HttpErrorResponse) => {
        console.log('Error response:', err);
        
        this.errorMessage = null;
        this.signupForm.get('userName')?.setErrors(null);
        this.signupForm.get('email')?.setErrors(null);

        let errorMsg = 'Registration failed. Please try again.';

        if (err?.error) {
          if (typeof err.error === 'string') {
            errorMsg = err.error;
          } else if (err.error.message) {
            errorMsg = err.error.message;
          } else if (err.error.error) {
            errorMsg = err.error.error;
          }
        } else if (err?.message) {
          errorMsg = err.message;
        }

        const message = errorMsg.toLowerCase();
        
        if (message.includes('user already exists') || message.includes('user already exist')) {
          this.errorMessage = 'An account with this information already exists. Please try with different details.';
        } else if (message.includes('username')) {
          this.signupForm.get('userName')?.setErrors({ notUnique: true });
          this.signupForm.get('userName')?.markAsTouched();
          this.errorMessage = 'Username already exists';
        } else if (message.includes('email')) {
          this.signupForm.get('email')?.setErrors({ notUnique: true });
          this.signupForm.get('email')?.markAsTouched();
          this.errorMessage = 'Email already exists';
        } else {
          this.errorMessage = errorMsg;
        }

        this.cdr.detectChanges();
        
        this.snackBar.open(this.errorMessage, 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  // Getter properties for form validation
  get isEmployer(): boolean {
    return this.signupForm.get('user_type')?.value === 'Employer';
  }

  get userNameError(): string {
    const control = this.signupForm.get('userName');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Username is required';
      if (control.errors['minlength']) return 'Username must be at least 3 characters';
      if (control.errors['maxlength']) return 'Username must not exceed 50 characters';
      if (control.errors['pattern']) return 'Username can only contain letters and numbers';
      if (control.errors['notUnique']) return 'Username already exists';
    }
    return '';
  }

  get emailError(): string {
    const control = this.signupForm.get('email');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Email is required';
      if (control.errors['email']) return 'Please enter a valid email address';
      if (control.errors['notUnique']) return 'Email already exists';
    }
    return '';
  }

  get passwordError(): string {
    const control = this.signupForm.get('password');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Password is required';
      if (control.errors['minlength']) return 'Password must be at least 6 characters';
      if (control.errors['maxlength']) return 'Password must not exceed 100 characters';
    }
    return '';
  }

  get confirmPasswordError(): string {
    const control = this.signupForm.get('confirmPassword');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Please confirm your password';
      if (control.errors['maxlength']) return 'Confirm password must not exceed 100 characters';
    }
    if (this.signupForm.errors?.['passwordMismatch'] && control?.touched) {
      return 'Passwords do not match';
    }
    return '';
  }

  get companyNameError(): string {
    const control = this.signupForm.get('companyName');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Company name is required';
      if (control.errors['minlength']) return 'Company name must be at least 2 characters';
      if (control.errors['maxlength']) return 'Company name must not exceed 100 characters';
    }
    return '';
  }

  get companyLocationError(): string {
    const control = this.signupForm.get('companyLocation');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Company location is required';
      if (control.errors['minlength']) return 'Company location must be at least 3 characters';
      if (control.errors['maxlength']) return 'Company location must not exceed 200 characters';
    }
    return '';
  }

  // This method is no longer needed since we're using the automatic Google button
  initiateGoogleSignup(): void {
    if (!google || !google.accounts) {
      this.googleErrorMessage = 'Google Sign-in not available. Please refresh the page.';
      return;
    }
    
    if (!this.validateGoogleForm()) {
      return;
    }
    
    google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        this.googleErrorMessage = 'Sign-up cancelled. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }
}