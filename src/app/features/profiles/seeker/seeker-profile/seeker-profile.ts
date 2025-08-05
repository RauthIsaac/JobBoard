import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-seeker-profile',
  templateUrl: './seeker-profile.html',
  styleUrl: './seeker-profile.css',
  imports: [FormsModule],
})
export class SeekerProfileComponent {
  profile = {
    firstName: '',
    lastName: '',
    address: '',
    CV_URL: '',
  };
  
  saveProfile() {
    console.log('Profile saved:', this.profile);
  }
}
