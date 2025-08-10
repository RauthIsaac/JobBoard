import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth-service';
import { MatCard } from "@angular/material/card";
import { CommonModule } from '@angular/common';
import { MaterialModule } from "../../shared/material.module";
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-confirm-email',
  templateUrl: './confirm-email.html',
  styleUrls: ['./confirm-email.css'],
  imports: [MatCard, CommonModule, MaterialModule, MatProgressSpinnerModule],
  standalone: true
})
export class ConfirmEmail implements OnInit, OnDestroy {
  message: string = 'Please check your email for confirmation link...';
  isVerifying: boolean = false;
  isSuccess: boolean = false;
  isError: boolean = false;
  
  private subscription: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // استخدام queryParamMap كـ Observable
    this.subscription.add(
      this.route.queryParamMap.subscribe(params => {
        const email = params.get('email');
        const token = params.get('token');
        
        console.log('Query params:', { email, token }); // للتأكد من وجود البيانات

        if (email && token) {
          // Auto-verify if we have both email and token
          this.verifyEmail(email, token);
        } else {
          // Invalid state
          this.message = 'Invalid confirmation link. Please try registering again.';
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