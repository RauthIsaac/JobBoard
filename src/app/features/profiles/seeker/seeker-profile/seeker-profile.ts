import { Component, OnInit, signal, Pipe, PipeTransform } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../../../../auth/auth-service';
import { RouterLink } from '@angular/router';

@Pipe({
  name: 'educationLevelName',
  standalone: true
})
export class EducationLevelPipe implements PipeTransform {
  private educationLevels: { [key: number]: string } = {
    0: 'High School',
    1: 'Bachelor',
    2: 'Diploma', 
    3: 'Master',
    4: 'Doctorate',
    5: 'Not Specified'
  };

  transform(value: number): string {
    return this.educationLevels[value] || 'Not Specified';
  }
}

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
    DatePipe,
    EducationLevelPipe,
  ],
  templateUrl: './seeker-profile.html',
  styleUrl: './seeker-profile.css'
})
export class SeekerProfile implements OnInit {

  seekerData = signal<any>({});

  constructor(private AuthService: AuthService) { 
  }

  ngOnInit(): void {
    this.loadSeekerProfile();
  }

  loadSeekerProfile() {
    this.AuthService.getSeekerProfile().subscribe({
      next: (data) => {
        console.log('Raw data from API:', data); // للتشخيص
        
        this.seekerData.set({
          ...data,
          skillName: this.parseIfStringArray(data.skillName),
          certificateName: this.parseIfStringArray(data.certificateName),
          interestName: this.parseIfStringArray(data.interestName),
          trainingName: this.parseIfStringArray(data.trainingName),
          // التأكد من أن الـ arrays موجودة
          seekerExperiences: Array.isArray(data.seekerExperiences) ? data.seekerExperiences : [],
          seekerEducations: Array.isArray(data.seekerEducations) ? data.seekerEducations : []
        });
        
        console.log('Processed seeker data:', this.seekerData()); // للتشخيص
      },
      error: (err) => {
        console.error('Error loading seeker profile:', err);
      }
    });
  }

  private parseIfStringArray(value: any): string[] {
    if (!value) return [];
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [value];
      }
    }
    return Array.isArray(value) ? value : [value];
  }

  // Track by function للأداء الأفضل
  trackByIndex(index: number, item: any): any {
    return index;
  }
}