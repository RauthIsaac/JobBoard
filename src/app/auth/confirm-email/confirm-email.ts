// confirm-email.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth-service';
import { MatCard } from "@angular/material/card";
import { CommonModule } from '@angular/common';
import { MaterialModule } from "../../shared/material.module";
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { LoadingPage } from "../../shared/components/loading-page/loading-page";

@Component({
  selector: 'app-confirm-email',
  templateUrl: './confirm-email.html',
  styleUrls: ['./confirm-email.css'],
  imports: [MatCard, CommonModule, MaterialModule, MatProgressSpinnerModule, LoadingPage],
  standalone: true
})
export class ConfirmEmail implements OnInit, OnDestroy {
  message: string = 'Please check your email for confirmation link...';
  isVerifying: boolean = false;
  isSuccess: boolean = false;
  isError: boolean = false;
  isPasswordReset: boolean = false; // To distinguish between email confirmation and password reset
  
  private subscription: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.subscription.add(
      this.route.queryParamMap.subscribe(params => {
        const email = params.get('email');
        const token = params.get('token');
        const type = params.get('type');
        
        console.log('Query params:', { email, token, type });

        // Check if this is for password reset
        this.isPasswordReset = type === 'reset-password';

        if (email && token) {
          if (this.isPasswordReset) {
            // For password reset, redirect directly to reset-password page
            this.router.navigate(['/reset-password'], { 
              queryParams: { email, token } 
            });
          } else {
            // For regular email confirmation
            this.verifyEmail(email, token);
          }
        } else if (email && this.isPasswordReset) {
          // Just email provided for password reset - show waiting message
          this.message = 'Password reset email has been sent. Please check your email and click the reset link.';
        } else if (email && !this.isPasswordReset) {
          // Just email provided for regular confirmation
          this.message = 'Please check your email for confirmation link...';
        } else {
          // Invalid state
          this.message = 'Invalid confirmation link. Please try again.';
          this.isError = true;
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private verifyEmail(email: string, token: string) {
    this.isVerifying = true;
    this.isSuccess = false;
    this.isError = false;
    this.message = 'Verifying your email...';

    this.subscription.add(
      this.authService.verifyEmail({ email, token }).subscribe({
        next: (response) => {
          console.log('Email verified successfully!', response);
          this.isVerifying = false;
          this.isSuccess = true;
          this.message = '✅ Email verified successfully! Redirecting to login...';
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        },
        error: (err) => {
          console.error('Verification failed', err);
          this.isVerifying = false;
          this.isError = true;
          this.message = '❌ Email verification failed. The link may be expired or invalid.';
        }
      })
    );
  }
}