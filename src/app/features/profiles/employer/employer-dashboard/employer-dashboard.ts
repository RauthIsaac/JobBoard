import { Component, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { ProfilesService } from '../../profiles-service';
import { AuthService } from '../../../../auth/auth-service';
import { CommonModule } from '@angular/common';
import { NgModel } from '@angular/forms';
import { NavbarEmp } from "../../../../shared/components/navbar-emp/navbar-emp";
import { RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-employer-dashboard',
  imports: [RouterLink, CommonModule, NavbarEmp, RouterOutlet,RouterLinkActive],
  templateUrl: './employer-dashboard.html',
  styleUrl: './employer-dashboard.css'
})
export class EmployerDashboard implements OnInit {

  empData = signal<any>({});


  constructor(private AuthService: AuthService) {

  }
  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.loadEmployerProfile();
  }

  loadEmployerProfile(): void {
    this.AuthService.getEmployerProfile().subscribe({
      next: (data) => {
        this.empData.set(data);
        console.log(this.empData());
      },
      error: (err) => {
        console.error('Error loading employer profile:', err);
      }
    });
  }

}
