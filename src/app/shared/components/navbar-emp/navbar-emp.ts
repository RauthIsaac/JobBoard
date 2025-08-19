import { Component, Input } from '@angular/core';
import { AuthService } from '../../../auth/auth-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-navbar-emp',
  imports: [CommonModule, FormsModule],
  templateUrl: './navbar-emp.html',
  styleUrl: './navbar-emp.css'
})
export class NavbarEmp {

  constructor(private authService: AuthService, private snackBar: MatSnackBar, private router: Router) { }

  @Input() toggleSidebar: () => void = () => {}; // Input to receive toggleSidebar from parent
  @Input() isSidebarOpen: boolean = true; // Input to receive sidebar state
  userInitials = 'JD'; // Replace with actual user data from AuthService

   logout(): void {
    this.authService.clearAuthData();
    
    this.snackBar.open('Logged out successfully', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
    
    this.router.navigate(['/login']);
  }

}
