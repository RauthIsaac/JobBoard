import { Component, NgZone, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { timeout, catchError, of } from 'rxjs';

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
  selector: 'app-external-login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './external-login.html',
  styleUrls: ['./external-login.css']
})
export class ExternalLogin implements OnInit, AfterViewInit, OnDestroy {
  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  // Make API URL configurable for different environments
  private readonly API_BASE_URL = this.getApiBaseUrl();
  private googleInitialized = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private ngZone: NgZone,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
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
    // Check if running in development mode by checking hostname
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isDevelopment) {
      // Use HTTP for local development
      return 'http://localhost:5007/api';
    }
    
    return 'https://localhost:5007/api';
  }

  private initializeForm(): void {
    this.loginForm = this.fb.group({
      role: ['Seeker', Validators.required],
      companyName: [''],
      companyLocation: ['']
    });

    // Add conditional validators when role changes
    this.loginForm.get('role')?.valueChanges.subscribe(role => {
      this.updateValidators(role);
    });
  }

  private updateValidators(role: string): void {
    const companyNameControl = this.loginForm.get('companyName');
    const companyLocationControl = this.loginForm.get('companyLocation');

    if (role === 'Employer' || role === 'employer') {
      companyNameControl?.setValidators([
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
      ]);
      companyLocationControl?.setValidators([
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(200)
      ]);
      
      companyNameControl?.enable();
      companyLocationControl?.enable();
    } else {
      companyNameControl?.clearValidators();
      companyLocationControl?.clearValidators();
      companyNameControl?.setValue('');
      companyLocationControl?.setValue('');
      
      companyNameControl?.disable();
      companyLocationControl?.disable();
    }

    companyNameControl?.updateValueAndValidity();
    companyLocationControl?.updateValueAndValidity();
  }

  private loadGoogleScript(): void {
    // Check if Google script is already loaded
    if (typeof google !== 'undefined' && google.accounts) {
      this.initializeGoogleSignIn();
      return;
    }

    // Check if script is already in DOM
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => this.initializeGoogleSignIn());
      return;
    }

    // Load Google script
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
      this.errorMessage = 'Failed to load Google Sign-in. Please refresh the page.';
    };
    
    document.head.appendChild(script);
  }

  private initializeGoogleSignIn(): void {
    try {
      if (typeof google === 'undefined' || !google.accounts) {
        console.error('Google Sign-In library not available, retrying...');
        setTimeout(() => this.initializeGoogleSignIn(), 1000);
        return;
      }

      if (this.googleInitialized) {
        return;
      }

      console.log('Initializing Google Sign-In');

      // Initialize Google Sign-In
      google.accounts.id.initialize({
        client_id: "224595746676-3mi5ivedv9khq6m9f2fmqff27vlc96t5.apps.googleusercontent.com",
        callback: (response: GoogleResponse) => {
          console.log('Google callback triggered:', response);
          this.ngZone.run(() => {
            this.handleLogin(response);
          });
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false
      });

      // Wait a bit more for initialization then render button
      setTimeout(() => {
        const buttonElement = document.querySelector('.g_id_signin');
        if (buttonElement) {
          console.log('Button container found, rendering Google button...');
          
          // Clear any existing content
          buttonElement.innerHTML = '';
          
          try {
            google.accounts.id.renderButton(
              buttonElement,
              { 
                theme: "outline", 
                size: "large",
                text: "continue_with",
                shape: "rectangular",
                width: 250
              }
            );
            
            this.googleInitialized = true;
            console.log('Google Sign-in button rendered successfully');
            
            // Verify button was actually rendered
            setTimeout(() => {
              const renderedButton = buttonElement.querySelector('div[role="button"]');
              if (!renderedButton) {
                console.warn('Button may not have rendered properly, trying again...');
                this.googleInitialized = false;
                this.initializeGoogleSignIn();
              }
            }, 500);
            
          } catch (renderError) {
            console.error('Error rendering Google button:', renderError);
            this.errorMessage = 'Failed to load Google Sign-in button. Please refresh the page.';
          }
        } else {
          console.error('Google button container (.g_id_signin) not found in DOM');
          this.errorMessage = 'Sign-in interface not ready. Please refresh the page.';
        }
      }, 500); // Increased delay

    } catch (error) {
      console.error('Error initializing Google Sign-In:', error);
      this.errorMessage = 'Failed to initialize Google Sign-in. Please refresh the page.';
    }
  }

  handleLogin(response: GoogleResponse): void {
    if (this.isLoading) {
      console.log('Login already in progress, ignoring duplicate request');
      return;
    }

    this.clearMessages();

    // Validate form before proceeding
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    const idToken = response.credential;
    const role = this.loginForm.value.role;

    console.log('Starting login process for role:', role);

    const dto: any = {
      idToken: idToken,
      roleFromClient: role
    };

    if (role === 'Employer' || role === 'employer') {
      dto.companyName = this.loginForm.value.companyName.trim();
      dto.companyLocation = this.loginForm.value.companyLocation.trim();
    }

    // Add timeout to the HTTP request using RxJS operator
    this.http.post<LoginResponse>(`${this.API_BASE_URL}/Auth/ExternalLogin`, dto)
      .pipe(
        timeout(30000), // 30 second timeout
        catchError(error => {
          // Handle timeout errors
          if (error.name === 'TimeoutError') {
            return of({
              succeeded: false,
              message: 'Request timed out. Please check your connection and try again.'
            } as LoginResponse);
          }
          throw error; // Re-throw other errors
        })
      )
      .subscribe({
        next: (res: LoginResponse) => {
          console.log('Login response received:', res);
          this.handleLoginSuccess(res, role);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Login error:', error);
          this.handleLoginError(error);
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  private validateForm(): boolean {
    const role = this.loginForm.value.role;

    if (role === 'Employer') {
      const companyName = this.loginForm.value.companyName?.trim();
      const companyLocation = this.loginForm.value.companyLocation?.trim();

      if (!companyName || companyName.length < 2) {
        this.errorMessage = 'Please provide a valid company name (minimum 2 characters).';
        return false;
      }

      if (!companyLocation || companyLocation.length < 3) {
        this.errorMessage = 'Please provide a valid company location (minimum 3 characters).';
        return false;
      }
    }

    return true;
  }

private handleLoginSuccess(response: LoginResponse, role: string): void {
  if (response.succeeded && response.token) {
    // استخدام الـ role من الـ server response أولاً
    const finalRole = response.role || role;
    
    // Store token using the same keys as AuthService expects
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('user_type', finalRole); // استخدام finalRole
    
    if (response.expiration) {
      localStorage.setItem('tokenExpiration', response.expiration);
    }

    // Also store user email from JWT token if available
    try {
      const tokenPayload = JSON.parse(atob(response.token.split('.')[1]));
      if (tokenPayload.email) {
        localStorage.setItem('user_email', tokenPayload.email);
      }
      if (tokenPayload.name || tokenPayload.given_name) {
        localStorage.setItem('user_name', tokenPayload.name || tokenPayload.given_name);
      }
      
      // استخراج الـ role من الـ JWT token أيضاً للتأكد
      if (tokenPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']) {
        const jwtRole = tokenPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        localStorage.setItem('user_type', jwtRole);
        console.log('Role from JWT token:', jwtRole);
      }
      
    } catch (error) {
      console.log('Could not parse token payload:', error);
    }

    this.successMessage = `Successfully logged in as ${finalRole}!`;
    
    console.log('✅ Login Success:', {
      serverRole: response.role,
      clientRole: role,
      finalRole: finalRole,
      expiration: response.expiration,
      storedKeys: {
        auth_token: 'auth_token',
        user_type: finalRole
      }
    });

    // استخدام finalRole في التوجيه
    setTimeout(() => {
      this.redirectUser(finalRole);
    }, 1000);
  } else {
    this.errorMessage = response.message || 'Login failed. Please try again.';
  }
}

private getStoredUserRole(): string | null {
  return localStorage.getItem('user_type');
}

// إضافة method لتنظيف localStorage عند الحاجة
private clearStoredAuth(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_type');
  localStorage.removeItem('tokenExpiration');
  localStorage.removeItem('user_email');
  localStorage.removeItem('user_name');
}

// إضافة debugging method
private debugStoredData(): void {
  console.log('Stored auth data:', {
    token: localStorage.getItem('auth_token') ? 'exists' : 'missing',
    userType: localStorage.getItem('user_type'),
    expiration: localStorage.getItem('tokenExpiration'),
    email: localStorage.getItem('user_email'),
    name: localStorage.getItem('user_name')
  });
}

  private handleLoginError(error: HttpErrorResponse): void {
    console.error('❌ Login Failed:', error);
    
    let errorMsg = 'Login failed. Please try again.';
    
    if (error.status === 0) {
      // Network error - likely connection issue
      errorMsg = 'Unable to connect to the server. Please check:\n' +
                '• Your internet connection\n' +
                '• The server is running\n' +
                '• Try using HTTP instead of HTTPS for local development';
    } else if (error.error?.message) {
      errorMsg = error.error.message;
    } else if (error.error && typeof error.error === 'string') {
      errorMsg = error.error;
    } else if (error.status >= 500) {
      errorMsg = 'Server error occurred. Please try again later.';
    } else if (error.status === 404) {
      errorMsg = 'Login endpoint not found. Please check the API configuration.';
    } else if (error.status >= 400 && error.status < 500) {
      errorMsg = 'Invalid login request. Please check your information.';
    }

    this.errorMessage = errorMsg;
  }
private redirectUser(role: string): void {
  // استخدام الـ role من الـ response بدلاً من الـ form value
  const actualRole = role || this.loginForm.value.role;
  
  console.log('Redirecting user with role:', actualRole);
  
  // التأكد من تطابق الـ role مع المتوقع
  switch (actualRole.toLowerCase()) {
    case 'employer':
      console.log('Navigating to employer dashboard...');
      this.router.navigate(['/empDashboard']);
      break;
    case 'seeker':
      console.log('Navigating to seeker home...');
      this.router.navigate(['/home']);
      break;
    default:
      console.log('Unknown role, navigating to default dashboard:', actualRole);
      this.router.navigate(['/dashboard']);
  }
}

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Manual retry method for debugging
  retryConnection(): void {
    this.clearMessages();
    this.isLoading = true;
    
    // Simple test request to check connectivity
    this.http.get(`${this.API_BASE_URL}/health`)
      .pipe(
        timeout(10000), // 10 second timeout
        catchError(error => {
          if (error.name === 'TimeoutError') {
            return of({
              error: 'Connection timeout - server may be unavailable'
            });
          }
          throw error;
        })
      )
      .subscribe({
        next: (response) => {
          console.log('Server connectivity test passed:', response);
          this.successMessage = 'Server connection successful!';
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Server connectivity test failed:', error);
          this.handleLoginError(error);
          this.isLoading = false;
        }
      });
  }

  // Getter for easy access in template
  get isEmployer(): boolean {
    return this.loginForm?.get('role')?.value === 'Employer';
  }

  get companyNameError(): string {
    const control = this.loginForm?.get('companyName');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Company name is required';
      if (control.errors['minlength']) return 'Company name must be at least 2 characters';
      if (control.errors['maxlength']) return 'Company name must not exceed 100 characters';
    }
    return '';
  }

  get companyLocationError(): string {
    const control = this.loginForm?.get('companyLocation');
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Company location is required';
      if (control.errors['minlength']) return 'Company location must be at least 3 characters';
      if (control.errors['maxlength']) return 'Company location must not exceed 200 characters';
    }
    return '';
  }
}

// Add this interface if you don't have environment configuration
declare const environment: {
  production: boolean;
};