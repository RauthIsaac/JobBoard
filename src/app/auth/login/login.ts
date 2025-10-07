import { CommonModule, NgIf } from '@angular/common';
import { Component, NgZone, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth-service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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
  userName?: string;
  email?: string;
  userId?: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatSnackBarModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements AfterViewInit, OnDestroy {
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;
  
  // Google Sign-in properties - Updated to match signup
  isGoogleLoading = false;
  googleErrorMessage = '';
  googleSuccessMessage = '';
  private readonly API_BASE_URL = this.getApiBaseUrl();
  private googleInitialized = false;
  private googleScriptLoaded = false;

  constructor(
    private fb: FormBuilder, 
    private router: Router, 
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
      role: ['Seeker', Validators.required],   // Default role
      companyName: [''],
      companyLocation: ['']
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

  private clearMessages(): void {
    this.googleErrorMessage = '';
    this.googleSuccessMessage = '';
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

  // Traditional login method
  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      
      const loginPayload = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password,
        rememberMe: this.loginForm.value.rememberMe
      };
      
      this.authService.login(loginPayload).subscribe({
        next: (response) => {
          console.log(response);
          
          this.authService.saveAuthData(
            response.token, 
            response.role,
            response.userName,
            response.email || this.loginForm.get('email')?.value,
            response.userId
          );

          this.isLoading = false;
          this.snackBar.open('Login successful', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });

          const userType = response.role?.toLowerCase();
          if (userType === 'employer') {
            this.router.navigate(['/empDashboard']);
          } else if (userType === 'seeker'){
            this.router.navigate(['/home']);
          } else if (userType === 'admin'){
            this.router.navigate(['/admin'])
          }
        },
        error: () => {
          this.isLoading = false;
          this.snackBar.open('Login failed. Please check your credentials.', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        }
      });

    } else {
      this.loginForm.markAllAsTouched();
      this.snackBar.open('Please fill all fields correctly', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    }
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
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
          this.ngZone.run(() => this.handleGoogleLogin(response));
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false
      });

      this.renderGoogleButton();
      this.googleInitialized = true;
      this.clearMessages();

      console.log('Google Sign-in initialized successfully');

    } catch (error) {
      console.error('Error initializing Google Sign-in:', error);
      this.googleErrorMessage = 'Failed to initialize Google Sign-in. Please refresh the page.';
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
          text: 'signin_with',
          shape: 'rectangular',
          width: 100,
          logo_alignment: 'left',
          locale: 'en'
        });

        console.log('Google button rendered successfully');
        
      } catch (renderError) {
        console.error('Error rendering Google button:', renderError);
        this.googleErrorMessage = 'Failed to load Google Sign-in button.';
        this.cdr.detectChanges();
      }
    };

    // Start the rendering process
    tryRender();
  }

  handleGoogleLogin(response: GoogleResponse): void {
    if (this.isGoogleLoading) return;

    this.clearMessages();

    this.isGoogleLoading = true;
    const idToken = response.credential;

    const dto: any = { idToken }; 

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
          console.log('Google API Response:', res);
          this.handleGoogleLoginSuccess(res);
          this.cdr.detectChanges();
        },
        error: (error: HttpErrorResponse) => {
          this.handleGoogleLoginError(error);
          this.cdr.detectChanges();
        },
        complete: () => {
          this.isGoogleLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  private handleGoogleLoginSuccess(response: LoginResponse): void {
    if (response.succeeded && response.token) {
      const finalRole = response.role || 'seeker'; 

      this.authService.saveAuthData(
        response.token,
        finalRole,
        response.userName,
        response.email,
        response.userId
      );

      this.googleSuccessMessage = `Successfully logged in as ${finalRole}!`;

      setTimeout(() => {
        this.redirectUser(finalRole);
      }, 1500);
    } else {
      this.googleErrorMessage = response.message || 'Login failed. Please try again.';
    }
  }

  private handleGoogleLoginError(error: HttpErrorResponse): void {
    let errorMsg = 'Login failed. Please try again.';
    
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
}