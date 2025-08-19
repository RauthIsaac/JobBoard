import { Component, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProfilesService } from '../../profiles-service';
import { AuthService } from '../../../../auth/auth-service';
import { CommonModule } from '@angular/common';
import { NgModel } from '@angular/forms';


@Component({
  selector: 'app-employer-profile-section',
  imports: [CommonModule],
  templateUrl: './employer-profile-section.html',
  styleUrl: './employer-profile-section.css'
})
export class EmployerProfileSection implements OnInit {

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
