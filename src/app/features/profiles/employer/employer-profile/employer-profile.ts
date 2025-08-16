import { Component, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProfilesService } from '../../profiles-service';
import { AuthService } from '../../../../auth/auth-service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-employer-profile',
  imports: [RouterLink,CommonModule],
  templateUrl: './employer-profile.html',
  styleUrl: './employer-profile.css'
})
export class EmployerProfile implements OnInit {

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
