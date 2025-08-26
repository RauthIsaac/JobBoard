import { Component, NgZone, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { ReactiveFormsModule, FormGroup, Validators, AbstractControl, FormBuilder, FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material.module';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
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
    // Change minLength from 2 to 3 to match backend
    companyName?.setValidators([Validators.required, Validators.minLength(3), Validators.maxLength(100)]);
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
          width: 100,
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
    if (!this.validateGoogleForm()) {
    return;
  }
  this.isGoogleLoading = true;
    this.clearMessages();

    const role = this.signupForm.value.user_type;
    const companyName = this.isEmployer ? this.signupForm.value.companyName?.trim() : null;
    const companyLocation = this.isEmployer ? this.signupForm.value.companyLocation?.trim() : null;

    const payload = {
      idToken: response.credential,
      roleFromClient: role,
      companyName: companyName,
      companyLocation: companyLocation
    };

  console.log('Google signup payload:', payload);
  this.http.post<LoginResponse>(`${this.API_BASE_URL}/Auth/ExternalLogin`, payload)
    .pipe(
      timeout(30000),
      catchError((error: HttpErrorResponse) => {
        this.isGoogleLoading = false;
        this.handleGoogleSignupError(error);
        return of(null);
      })
    )
    .subscribe({
      next: (response) => {
        this.isGoogleLoading = false;
        if (response?.succeeded) {
          // بدلاً من الدخول مباشرة، أرسل إيميل تأكيد
          this.sendConfirmationEmailForGoogleUser(response, role);
        } else {
          this.googleErrorMessage = response?.message || 'Registration failed. Please try again.';
        }
      }
    });
}

private sendConfirmationEmailForGoogleUser(loginResponse: LoginResponse, role: string): void {
  // استخراج الإيميل من الـ token
  let userEmail = '';
  try {
    if (loginResponse.token) {
      const tokenPayload = JSON.parse(atob(loginResponse.token.split('.')[1]));
      
      // الطريقة الصحيحة لاستخراج الإيميل من JWT
      userEmail = tokenPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || // UserName
                 tokenPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || // Email claim
                 tokenPayload.email || // Standard email claim
                 tokenPayload.name; // Fallback to name
      
      console.log('Token payload:', tokenPayload);
      console.log('Extracted email:', userEmail);
    }
  } catch (error) {
    console.error('Could not extract email from token:', error);
    this.googleErrorMessage = 'Failed to process registration. Please try again.';
    return;
  }

  if (!userEmail) {
    this.googleErrorMessage = 'Failed to extract email address. Please try again.';
    console.error('No email found in token payload');
    return;
  }

  // التحقق من صحة الإيميل
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userEmail)) {
    this.googleErrorMessage = 'Invalid email address extracted from token.';
    console.error('Invalid email format:', userEmail);
    return;
  }

  console.log('Sending confirmation email to:', userEmail);

  // إرسال إيميل التأكيد
  this.http.post(`${this.API_BASE_URL}/Auth/send-confirmation-email`, `"${userEmail}"`, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .pipe(
    timeout(15000),
    catchError((error: HttpErrorResponse) => {
      console.error('Confirmation email error:', error);
      
      // إذا كان الخطأ بسبب أن الإيميل مؤكد بالفعل، اعرض رسالة مختلفة
      if (error.error?.message?.includes('already confirmed') || 
          error.error?.includes('already confirmed')) {
        this.handleAlreadyConfirmedUser(userEmail, role);
        return of(null);
      }
      
      // حتى لو فشل إرسال الإيميل، اعرض رسالة نجاح التسجيل
      this.showRegistrationSuccess(userEmail, role);
      return of(null);
    })
  )
  .subscribe({
    next: (emailResponse: any) => {
      console.log('Confirmation email response:', emailResponse);
      this.showRegistrationSuccess(userEmail, role);
    }
  });
}

private showRegistrationSuccess(email: string, role: string): void {
  this.googleSuccessMessage = `Account created successfully as ${role}! Please check your email (${email}) to confirm your account before logging in.`;
  
  this.snackBar.open(
    `Registration successful! Please check ${email} for confirmation email.`, 
    'Close', 
    {
      duration: 8000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    }
  );

  setTimeout(() => {
    this.router.navigate(['/login'], { 
      queryParams: { 
        message: 'Please confirm your email before logging in',
        email: email,
        newUser: 'true' 
      }
    });
  }, 3000);
}

 private validateGoogleForm(): boolean {
  const role = this.signupForm.value.user_type;

  if (role === 'Employer') {
    const companyName = this.signupForm.value.companyName?.trim();
    const companyLocation = this.signupForm.value.companyLocation?.trim();

    // Change minimum from 2 to 3 characters to match backend
    if (!companyName || companyName.length < 3) {
      this.googleErrorMessage = 'Please provide a valid company name (minimum 3 characters).';
      return false;
    }

    if (companyName.length > 100) {
      this.googleErrorMessage = 'Company name must not exceed 100 characters.';
      return false;
    }

    if (!companyLocation || companyLocation.length < 3) {
      this.googleErrorMessage = 'Please provide a valid company location (minimum 3 characters).';
      return false;
    }

    if (companyLocation.length > 200) {
      this.googleErrorMessage = 'Company location must not exceed 200 characters.';
      return false;
    }
  }

  return true;
}

  private handleAlreadyConfirmedUser(email: string, role: string): void {
  this.googleSuccessMessage = `Welcome back! Your account (${email}) is already confirmed. You can log in directly.`;
  
  this.snackBar.open(
    'Account already exists and is confirmed. Redirecting to login...', 
    'Close', 
    {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['info-snackbar']
    }
  );

  setTimeout(() => {
    this.router.navigate(['/login'], { 
      queryParams: { 
        email: email,
        message: 'Account already exists - please log in'
      }
    });
  }, 2000);
}

 private handleGoogleSignupError(error: HttpErrorResponse): void {
  let errorMsg = 'Registration failed. Please try again.';

  console.error('Google signup error:', error);

  if (error.status === 0) {
    errorMsg = 'Unable to connect to the server. Please check your connection.';
  } else if (error.error?.message) {
    errorMsg = error.error.message;
    
    // التحقق من وجود حساب مسبق
    if (errorMsg.toLowerCase().includes('already exists') || 
        errorMsg.toLowerCase().includes('user already exist')) {
      // استخراج الإيميل من Google token للمستخدم الموجود
      this.handleExistingGoogleUser(errorMsg);
      return;
    }
  } else if (error.status >= 500) {
    errorMsg = 'Server error occurred. Please try again later.';
  }

  this.googleErrorMessage = errorMsg;
}

private handleExistingGoogleUser(errorMessage: string): void {
  this.googleErrorMessage = 'An account with this Google email already exists. Please log in instead.';
  
  this.snackBar.open(
    'Account already exists. Redirecting to login...', 
    'Close', 
    {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['info-snackbar']
    }
  );

  setTimeout(() => {
    this.router.navigate(['/login'], {
      queryParams: { 
        message: 'Please log in with your existing account',
        source: 'google'
      }
    });
  }, 3000);
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
        // Change error message from 2 to 3 characters
        this.errorMessage = 'Company name must be at least 3 characters';
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
    // Change from 2 to 3 characters
    if (control.errors['minlength']) return 'Company name must be at least 3 characters';
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