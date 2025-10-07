import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { UserType } from '../app.routes'; 
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root'
})
export class RoleBasedRedirectGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
      return false;
    }

    const userType = this.authService.getUserType();

    if (userType === null) {
      this.router.navigate(['/home']);
      return false;
    }

    switch (userType) {
      case 'Admin':
        this.router.navigate(['/admin']);
        return false;
        
      case 'Employer':
        this.router.navigate(['/empDashboard']);
        return false;
        
      case 'Seeker':
        this.router.navigate(['/home']);
        return false;
        
      default:
        this.router.navigate(['/home']);
        return false;
    }
  }
}