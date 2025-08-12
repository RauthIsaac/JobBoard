import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Footer } from "../footer/footer";
import { AuthService } from '../../../auth/auth-service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Footer, MatSnackBarModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {

  constructor(
    public authService: AuthService, 
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  logout(): void {
    this.authService.clearAuthData();
    
    this.snackBar.open('Logged out successfully', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
    
    this.router.navigate(['/login']);
  }

  isEmployer(): boolean {
    return this.authService.getUserType() === 'employer';
  }

  isSeeker(): boolean {
    return this.authService.getUserType() === 'seeker';
  }

  getDisplayName(): string {
    const userName = this.authService.getUserName();
    const userEmail = this.authService.getUserEmail();
    
    if (userName && userName !== 'User') {
      return userName;
    }
    
    if (userEmail) {
      return userEmail.split('@')[0];
    }
    
    return 'User';
  }
}