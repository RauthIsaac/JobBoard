import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ApplicationService } from '../../../application-service';

@Component({
  selector: 'app-personal-info',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personal-info.html',
  styleUrl: './personal-info.css',
})
export class PersonalInfo implements OnInit {
  formData: any = {
    fullName: '',
    email: '',
    phoneNumber: '',
    currentLocation: '',
    currentJobTitle: '',
    yearsOfExperience: ''
  };

  constructor(private appService: ApplicationService, private router: Router) {}

  ngOnInit(): void {
    // Load existing data if available
    const existingData = this.appService.getData();
    if (existingData) {
      this.formData = {
        fullName: existingData.fullName || '',
        email: existingData.email || '',
        phoneNumber: existingData.phoneNumber || '',
        currentLocation: existingData.currentLocation || '',
        currentJobTitle: existingData.currentJobTitle || '',
        yearsOfExperience: existingData.yearsOfExperience || ''
      };
    }
  }

  saveAndNext(form: NgForm) {
    if (form.valid) {
      this.appService.setData(this.formData);
      this.router.navigate([`/seekerApp/${this.formData.jobId || 1}/documents`]);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(form.controls).forEach(key => {
        form.controls[key].markAsTouched();
      });
    }
  }
}