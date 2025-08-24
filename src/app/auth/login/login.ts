import { CommonModule } from '@angular/common';
import { Component, NgZone, OnDestroy, AfterViewInit } from '@angular/core';
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
  
  // Google Sign-in properties
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
    private ngZone: NgZone
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
      role: ['Seeker', Validators.required],   // Default role
      companyName: [''],
      companyLocation: ['']
    });
  }

  ngAfterViewInit(): void {
    this.initializeGoogleSignIn();
  }

  ngOnDestroy(): void {
    delete (window as any).handleGoogleResponse;
  }

  private getApiBaseUrl(): string {
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isDevelopment ? 'http://localhost:5007/api' : 'https://localhost:5007/api';
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
          this.authService.saveAuthData(
            response.token, 
            response.role,
            response.userName || this.loginForm.get('email')?.value,
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
      if (typeof google === 'undefined' || !google.accounts) {
        setTimeout(() => this.initializeGoogleSignIn(), 1000);
        return;
      }

      if (this.googleInitialized) return;

      google.accounts.id.initialize({
        client_id: "224595746676-3mi5ivedv9khq6m9f2fmqff27vlc96t5.apps.googleusercontent.com",
        callback: (response: GoogleResponse) => {
          this.ngZone.run(() => this.handleGoogleLogin(response));
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
          text: "signin_with",
          shape: "rectangular",
          width: 250
        });
        console.log('Google Sign-in button rendered successfully');
      } catch (renderError) {
        console.error('Error rendering Google button:', renderError);
        this.googleErrorMessage = 'Failed to load Google Sign-up button.';
      }
    } else {
      console.warn('Google button container not found, retrying...');
      setTimeout(() => this.renderGoogleButton(), 500);
    }
  }

  handleGoogleLogin(response: GoogleResponse): void {
    if (this.isGoogleLoading) return;

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
        },
        error: (error: HttpErrorResponse) => {
          this.handleGoogleLoginError(error);
        },
        complete: () => {
          this.isGoogleLoading = false;
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
