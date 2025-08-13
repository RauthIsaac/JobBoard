import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../../../../auth/auth-service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-profile',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatListModule,
    RouterLink,
    DatePipe
  ],
  templateUrl: './seeker-profile.html',
  styleUrl: './seeker-profile.css'
})
export class SeekerProfile implements OnInit{

  seekerData = signal<any>({});

  constructor(private AuthService: AuthService) { 
  }

  ngOnInit(): void {
    this.loadSeekerProfile();
  }


  loadSeekerProfile() {
    this.AuthService.getSeekerProfile().subscribe({
      next: (data) => {
        this.seekerData.set(data);
        console.log(this.seekerData());
      },
      error: (err) => {
        console.error('Error loading seeker profile:', err);
      }
    });
  }

}
