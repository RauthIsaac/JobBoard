import { Component, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../auth/auth-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarEmp } from '../../../../shared/components/navbar-emp/navbar-emp';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-employer-dashboard',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, FormsModule, NavbarEmp, RouterOutlet],
  templateUrl: './employer-dashboard.html',
  styleUrls: ['./employer-dashboard.css']
})
export class EmployerDashboard implements OnInit {
  
  isSidebarOpen = signal<boolean>(true);

empData = signal<any>({});

  constructor(
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.loadEmployerProfile();
  }

  loadEmployerProfile(): void {
    this.authService.getEmployerProfile().subscribe({
      next: (data) => {
        this.empData.set(data);
        console.log(this.empData());
      },
      error: (err) => {
        console.error('Error loading employer profile:', err);
      }
    });
  }

  toggleSidebar(): void {
    this.isSidebarOpen.update(isOpen => !isOpen);
  }

}