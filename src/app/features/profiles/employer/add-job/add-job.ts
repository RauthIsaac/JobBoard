import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-job',
  templateUrl: './add-job.html',
  styleUrls: ['./add-job.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class AddJob implements OnInit {
  jobForm: FormGroup;
  
  experienceLevels = [
    { value: 'entry', label: 'Entry Level' },
    { value: 'junior', label: 'Junior Level' },
    { value: 'senior', label: 'Senior Level' },
    { value: 'lead', label: 'Lead Level' },
    { value: 'manager', label: 'Manager Level' }
  ];

  jobTypes = [
    { value: 'full-time', label: 'Full-Time' },
    { value: 'part-time', label: 'Part-Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' }
  ];

  locationTypes = [
    { value: 'remote', label: 'Remote' },
    { value: 'on-site', label: 'On-Site' },
    { value: 'hybrid', label: 'Hybrid' }
  ];

  benefits = [
    'Health Insurance',
    'Retirement Plan', 
    'Paid Time Off',
    'Flexible Working Hours',
    'Competitive Salary',
    'Remote Work Options',
    'Health Benefits',
    'Wellness Programs',
    'Equipment Allowance',
    'Unlimited PTO',
    'Team Events',
    'Cutting-edge Technology'
  ];

  constructor(private fb: FormBuilder) {
    this.jobForm = this.createJobForm();
  }

  ngOnInit(): void {}

  createJobForm(): FormGroup {
    return this.fb.group({
      // Basic Job Information
      jobTitle: ['', [Validators.required, Validators.minLength(3)]],
      companyName: ['', [Validators.required]],
      companyLogo: [''],
      salary: ['', [Validators.required, Validators.min(0)]],
      
      // Job Overview
      experienceLevel: ['', Validators.required],
      jobType: ['', Validators.required],
      teamSize: ['', [Validators.required, Validators.pattern(/^\d+-\d+$/)]],
      locationType: ['', Validators.required],
      specificLocation: [''],
      
      // Company Details
      companySize: ['', Validators.required],
      industry: ['', Validators.required],
      companyLocation: ['', Validators.required],
      website: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      
      // Job Content
      jobDescription: ['', [Validators.required, Validators.minLength(50)]],
      keyRequirements: this.fb.array([]),
      aboutTheRole: ['', [Validators.required, Validators.minLength(30)]],
      jobResponsibilities: this.fb.array([]),
      
      // Benefits
      selectedBenefits: this.fb.array([]),
      additionalBenefits: this.fb.array([]),
      
      // Application Details
      applicationDeadline: [''],
      applyBy: ['', Validators.required],
      applicationInstructions: ['']
    });
  }

  // FormArray getters
  get keyRequirements(): FormArray {
    return this.jobForm.get('keyRequirements') as FormArray;
  }

  get jobResponsibilities(): FormArray {
    return this.jobForm.get('jobResponsibilities') as FormArray;
  }

  get selectedBenefits(): FormArray {
    return this.jobForm.get('selectedBenefits') as FormArray;
  }

  get additionalBenefits(): FormArray {
    return this.jobForm.get('additionalBenefits') as FormArray;
  }

  // Add/Remove FormArray items
  addKeyRequirement(): void {
    this.keyRequirements.push(this.fb.control('', Validators.required));
  }

  removeKeyRequirement(index: number): void {
    this.keyRequirements.removeAt(index);
  }

  addJobResponsibility(): void {
    this.jobResponsibilities.push(this.fb.control('', Validators.required));
  }

  removeJobResponsibility(index: number): void {
    this.jobResponsibilities.removeAt(index);
  }

  addAdditionalBenefit(): void {
    this.additionalBenefits.push(this.fb.control('', Validators.required));
  }

  removeAdditionalBenefit(index: number): void {
    this.additionalBenefits.removeAt(index);
  }

  // Handle benefit checkboxes
  onBenefitChange(benefit: string, isChecked: boolean): void {
    if (isChecked) {
      this.selectedBenefits.push(this.fb.control(benefit));
    } else {
      const index = this.selectedBenefits.controls.findIndex(
        x => x.value === benefit
      );
      if (index >= 0) {
        this.selectedBenefits.removeAt(index);
      }
    }
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.jobForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.jobForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['minlength']) return `${fieldName} is too short`;
      if (field.errors['pattern']) return `${fieldName} format is invalid`;
      if (field.errors['min']) return `${fieldName} must be greater than 0`;
    }
    return '';
  }

  // Submit form
  onSubmit(): void {
    if (this.jobForm.valid) {
      const jobData = this.jobForm.value;
      console.log('Job Data:', jobData);
      // Here you would typically send the data to your service
      // this.jobService.createJob(jobData).subscribe(...);
      alert('Job posted successfully!');
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.jobForm.controls).forEach(key => {
      const control = this.jobForm.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormArray) {
        control.controls.forEach(c => c.markAsTouched());
      }
    });
  }

  // Reset form
  onReset(): void {
    this.jobForm.reset();
    // Clear FormArrays
    while (this.keyRequirements.length !== 0) {
      this.keyRequirements.removeAt(0);
    }
    while (this.jobResponsibilities.length !== 0) {
      this.jobResponsibilities.removeAt(0);
    }
    while (this.selectedBenefits.length !== 0) {
      this.selectedBenefits.removeAt(0);
    }
    while (this.additionalBenefits.length !== 0) {
      this.additionalBenefits.removeAt(0);
    }
  }
}