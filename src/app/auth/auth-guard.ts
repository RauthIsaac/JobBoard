import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth-service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};

export const employerGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn() && authService.getUserType() === 'employer') {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};

export const seekerGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn() && authService.getUserType() === 'seeker') {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};

export const guestGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return true;
  } else {
    const userType = authService.getUserType();
    if (userType === 'employer') {
      router.navigate(['/employer/dashboard']);
    } else if (userType === 'seeker') {
      router.navigate(['/seeker/dashboard']);
    } else {
      router.navigate(['/home']);
    }
    return false;
  }
};