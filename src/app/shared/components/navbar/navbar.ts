import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Footer } from "../footer/footer";
import { AuthService } from '../../../auth/auth-service';
import { ChatButton } from "../../../features/AIChat/chat-button/chat-button";

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Footer, MatSnackBarModule,ChatButton],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {

  userType: string | null = null;
  displayName: string = 'User';
  isLoggedIn: boolean = false;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.userType = this.authService.getUserType();
    this.displayName = this.buildDisplayName();
    this.isLoggedIn = this.authService.isLoggedIn();

    console.log('User Type:', this.userType);
    console.log('Display Name:', this.displayName);
    console.log('Is Logged In:', this.isLoggedIn);
  }

  logout(): void {
    this.authService.clearAuthData();
    this.isLoggedIn = false;
    
    this.snackBar.open('Logged out successfully', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
    
    this.router.navigate(['/login']);
  }

  isEmployer(): boolean {
    return this.userType === 'Employer';
  }

  isSeeker(): boolean {
    return this.userType === 'Seeker';
  }

  private buildDisplayName(): string {
    const userName = this.authService.getUserName();
    const companyName = this.authService.getCompanyName();

    if (this.isEmployer()) {
      return companyName || 'Company';
    }

    if (this.isSeeker()) {
      return userName || 'User';
    }
       
    
    return 'User';
  }
}
