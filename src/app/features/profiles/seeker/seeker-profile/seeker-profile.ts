import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule, MatChipInputEvent, MatChipGrid } from '@angular/material/chips'; 
import { COMMA, ENTER } from '@angular/cdk/keycodes';

@Component({
  standalone: true,
  selector: 'app-seeker-profile',
  templateUrl: './seeker-profile.html',
  styleUrl: './seeker-profile.css',
  imports: [
    FormsModule,
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
  ],
})
export class SeekerProfile {

  @ViewChild('chipList') chipList!: MatChipGrid;

  profile = {
    firstName: 'Samaa',
    lastName: 'Leza',
    address: '123 saad St, Fayoum',
    CV_URL: 'http://example.com/cv.pdf',
    bio: 'Experienced software developer with a passion for creating scalable web applications.',
    profilePictureUrl: '', 
    experience: [
      { jobTitle: 'Frontend Developer', company: 'Tech Solutions.', description: 'Developed user interfaces using Angular and Typescript.', startDate: '2020-01', endDate: '2023-01' }
    ],
    education: [
      { degree: 'B.Sc. in Computer Science', university: 'University of Technology', startDate: '2016-09', endDate: '2020-06' }
    ],
    skills: ['Angular', 'TypeScript', 'Angular Material CSS']
  };

  separatorKeysCodes: number[] = [ENTER, COMMA];
  
  addExperience() {
    this.profile.experience.push({ jobTitle: '', company: '', description: '', startDate: '', endDate: '' });
  }

  removeExperience(index: number) {
    this.profile.experience.splice(index, 1);
  }

  addEducation() {
    this.profile.education.push({ degree: '', university: '', startDate: '', endDate: '' });
  }

  removeEducation(index: number) {
    this.profile.education.splice(index, 1);
  }

  addSkill(event: MatChipInputEvent) {
    const value = (event.value || '').trim();

    if (value) {
      this.profile.skills.push(value);
    }

    if (event.chipInput) {
      event.chipInput.clear();
    }
  }

  removeSkill(index: number) {
    this.profile.skills.splice(index, 1);
  }

  // Function to handle file selection for profile picture
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        this.profile.profilePictureUrl = reader.result as string;
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  saveProfile() {
    console.log('Profile saved:', this.profile);
    
  }
}
