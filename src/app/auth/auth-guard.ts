// src/app/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  ActivatedRouteSnapshot, 
  Router, 
  UrlTree 
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth-service';

export type UserType = 'Admin' | 'Seeker' | 'Employer';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }

    const allowedUserTypes = route.data['allowedUserTypes'] as UserType[];
    
    if (!allowedUserTypes || allowedUserTypes.length === 0) {
      return true;
    }

    if (this.authService.hasPermission(allowedUserTypes)) {
      return true;
    }

    this.router.navigate(['/unauthorized']);
    return false;
  }
}