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

  // Validation error messages
  validationErrors: any = {};

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

  // Custom validation methods
  validateFullName(): boolean {
    const name = this.formData.fullName.trim();
    this.validationErrors.fullName = '';
    
    if (!name) {
      this.validationErrors.fullName = 'Full name is required';
      return false;
    }
    if (name.length < 2) {
      this.validationErrors.fullName = 'Full name must be at least 2 characters';
      return false;
    }
    if (name.length > 100) {
      this.validationErrors.fullName = 'Full name must not exceed 100 characters';
      return false;
    }
    if (!/^[a-zA-Z\s'-]+$/.test(name)) {
      this.validationErrors.fullName = 'Full name can only contain letters, spaces, hyphens, and apostrophes';
      return false;
    }
    return true;
  }

  validateEmail(): boolean {
    const email = this.formData.email.trim();
    this.validationErrors.email = '';
    
    if (!email) {
      this.validationErrors.email = 'Email is required';
      return false;
    }
    
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
      this.validationErrors.email = 'Please enter a valid email address';
      return false;
    }
    
    if (email.length > 254) {
      this.validationErrors.email = 'Email address is too long';
      return false;
    }
    return true;
  }

  validatePhoneNumber(): boolean {
    const phone = this.formData.phoneNumber.trim();
    this.validationErrors.phoneNumber = '';
    
    if (!phone) {
      this.validationErrors.phoneNumber = 'Phone number is required';
      return false;
    }
    
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    
    if (digitsOnly.length < 10) {
      this.validationErrors.phoneNumber = 'Phone number must be at least 10 digits';
      return false;
    }
    
    if (digitsOnly.length > 15) {
      this.validationErrors.phoneNumber = 'Phone number must not exceed 15 digits';
      return false;
    }
    
    // Allow common phone number formats
    const phonePattern = /^[\+]?[\d\s\-\(\)\.]{10,20}$/;
    if (!phonePattern.test(phone)) {
      this.validationErrors.phoneNumber = 'Please enter a valid phone number';
      return false;
    }
    return true;
  }

  validateCurrentLocation(): boolean {
    const location = this.formData.currentLocation.trim();
    this.validationErrors.currentLocation = '';
    
    if (!location) {
      this.validationErrors.currentLocation = 'Current location is required';
      return false;
    }
    if (location.length < 2) {
      this.validationErrors.currentLocation = 'Location must be at least 2 characters';
      return false;
    }
    if (location.length > 100) {
      this.validationErrors.currentLocation = 'Location must not exceed 100 characters';
      return false;
    }
    return true;
  }

  validateCurrentJobTitle(): boolean {
    const jobTitle = this.formData.currentJobTitle.trim();
    this.validationErrors.currentJobTitle = '';
    
    if (!jobTitle) {
      this.validationErrors.currentJobTitle = 'Current job title is required';
      return false;
    }
    if (jobTitle.length < 2) {
      this.validationErrors.currentJobTitle = 'Job title must be at least 2 characters';
      return false;
    }
    if (jobTitle.length > 100) {
      this.validationErrors.currentJobTitle = 'Job title must not exceed 100 characters';
      return false;
    }
    return true;
  }

  validateYearsOfExperience(): boolean {
    const years = this.formData.yearsOfExperience;
    this.validationErrors.yearsOfExperience = '';
    
    if (years === '' || years === null || years === undefined) {
      this.validationErrors.yearsOfExperience = 'Years of experience is required';
      return false;
    }
    
    const yearsNum = Number(years);
    if (isNaN(yearsNum)) {
      this.validationErrors.yearsOfExperience = 'Please enter a valid number';
      return false;
    }
    
    if (yearsNum < 0) {
      this.validationErrors.yearsOfExperience = 'Years of experience cannot be negative';
      return false;
    }
    
    if (yearsNum > 50) {
      this.validationErrors.yearsOfExperience = 'Years of experience seems too high. Please verify.';
      return false;
    }
    
    // Check for decimal places
    if (years.toString().includes('.') && years.toString().split('.')[1].length > 1) {
      this.validationErrors.yearsOfExperience = 'Please use at most 1 decimal place';
      return false;
    }
    
    return true;
  }

  // Field-level validation on blur
  onFieldBlur(fieldName: string): void {
    switch(fieldName) {
      case 'fullName':
        this.validateFullName();
        break;
      case 'email':
        this.validateEmail();
        break;
      case 'phoneNumber':
        this.validatePhoneNumber();
        break;
      case 'currentLocation':
        this.validateCurrentLocation();
        break;
      case 'currentJobTitle':
        this.validateCurrentJobTitle();
        break;
      case 'yearsOfExperience':
        this.validateYearsOfExperience();
        break;
    }
  }

  // Real-time validation for phone number formatting
  onPhoneInput(event: any): void {
    let value = event.target.value.replace(/\D/g, ''); // Remove non-digits
    
    // Format as (XXX) XXX-XXXX for US numbers
    if (value.length >= 6) {
      value = `(${value.slice(0,3)}) ${value.slice(3,6)}-${value.slice(6,10)}`;
    } else if (value.length >= 3) {
      value = `(${value.slice(0,3)}) ${value.slice(3)}`;
    }
    
    this.formData.phoneNumber = value;
    this.validatePhoneNumber();
  }

  // Validate all fields
  validateAllFields(): boolean {
    const validations = [
      this.validateFullName(),
      this.validateEmail(),
      this.validatePhoneNumber(),
      this.validateCurrentLocation(),
      this.validateCurrentJobTitle(),
      this.validateYearsOfExperience()
    ];
    
    return validations.every(isValid => isValid);
  }

  // Helper method for template to check if form has validation errors
  hasValidationErrors(): boolean {
    return Object.keys(this.validationErrors).some(key => this.validationErrors[key]);
  }

  saveAndNext(form: NgForm) {
    // Trim all string fields
    this.formData.fullName = this.formData.fullName.trim();
    this.formData.email = this.formData.email.trim();
    this.formData.phoneNumber = this.formData.phoneNumber.trim();
    this.formData.currentLocation = this.formData.currentLocation.trim();
    this.formData.currentJobTitle = this.formData.currentJobTitle.trim();
    
    if (this.validateAllFields() && form.valid) {
      this.appService.setData(this.formData);
      this.router.navigate([`/seekerApp/${this.appService.getData().jobId}/documents`]);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(form.controls).forEach(key => {
        form.controls[key].markAsTouched();
      });
    }
  }
}