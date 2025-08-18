import { Component } from '@angular/core';
import { AuthService } from '../../../auth/auth-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar-emp',
  imports: [],
  templateUrl: './navbar-emp.html',
  styleUrl: './navbar-emp.css'
})
export class NavbarEmp {

  constructor(private authService: AuthService, private snackBar: MatSnackBar, private router: Router) { }

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
