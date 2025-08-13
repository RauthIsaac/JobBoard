import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatStepperModule } from '@angular/material/stepper';
import { MatStepper } from '@angular/material/stepper';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-seeker-application',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatListModule,
    MatStepperModule,
    ReactiveFormsModule
  ],
  templateUrl: './seeker-application.html',
  styleUrls: ['./seeker-application.css']
})
export class SeekerApplication implements OnInit {

  personalInfoForm: FormGroup;
  yearsOfExperience: string[] = ['Less than 1 year', '1-3 years', '3-5 years', '6-10 years', '10+ years'];
  workAuthorizations: string[] = ['US Citizen', 'Permanent Resident', 'H1B Visa', 'Other'];

  @ViewChild('stepper') stepper!: MatStepper;

  constructor(private fb: FormBuilder) {
    this.personalInfoForm = this.fb.group({
      fullName: ['', Validators.required],
      emailAddress: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', Validators.required],
      currentLocation: ['', Validators.required],
      currentJobTitle: [''],
      yearsOfExperience: ['', Validators.required],
      availableStartDate: ['', Validators.required],
      workAuthorization: ['', Validators.required],
    });
  }

  ngOnInit(): void {
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.personalInfoForm.get(fieldName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  saveDraft(): void {
    console.log('Form saved as draft:', this.personalInfoForm.value);
  }

  submitApplication(): void {
    if (this.personalInfoForm.valid) {
      console.log('Form submitted successfully!', this.personalInfoForm.value);
    } else {
      this.personalInfoForm.markAllAsTouched();
      console.log('Form is invalid. Please check the fields.');
    }
  }
}