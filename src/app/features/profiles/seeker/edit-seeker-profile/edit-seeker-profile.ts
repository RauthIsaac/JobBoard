import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, AbstractControl } from '@angular/forms';
import { MatCardModule } from "@angular/material/card";
import { MatDividerModule } from "@angular/material/divider";
import { MaterialModule } from "../../../../shared/material.module";
import { AuthService } from '../../../../auth/auth-service';
import { ProfilesService } from '../../profiles-service';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { MatOptionModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

@Component({
  selector: 'app-edit-seeker-profile',
  imports: [ReactiveFormsModule, MatCardModule, MaterialModule, MatDividerModule, CommonModule, MatOptionModule, MatProgressSpinner, MatSelectModule, MatChipsModule],
  providers: [ProfilesService],
  templateUrl: './edit-seeker-profile.html',
  styleUrl: './edit-seeker-profile.css'
})
export class EditSeekerProfile implements OnInit {
  currentYear = new Date().getFullYear();
  profileForm: FormGroup;
  seekerData = signal<any>({});
  isLoading = false;

  // Separator keys for chip input
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  // Enum options
  genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' }
  ];

  educationLevelOptions = [
    { value: 0, label: 'High School' },
    { value: 1, label: 'Bachelor' },
    { value: 2, label: 'Diploma' },
    { value: 3, label: 'Master' },
    { value: 4, label: 'Doctorate' },
    { value: 5, label: 'Not Specified' }
  ];

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.maxLength(100)]],
      title: ['', [Validators.maxLength(100)]],
      dateOfBirth: [''],
      address: ['', [Validators.maxLength(200)]],
      cvURL: ['', [Validators.pattern('https?://.+')]],
      gender: [''],
      summary: ['', [Validators.maxLength(1000)]],
      profileImageURL: ['', [Validators.pattern('https?://.+')]],
      email: ['', [Validators.email]],
      skillName: [[]],
      seekerExperiences: this.fb.array([]),
      seekerEducations: this.fb.array([]),
      certificateName: [[]],
      interestName: [[]],
      trainingName: [[]]
    });
  }

  ngOnInit(): void {
    this.loadSeekerProfile();
  }

  loadSeekerProfile(): void {
    this.authService.getSeekerProfile().subscribe({
      next: (data: any) => {
        this.seekerData.set(data);
        this.patchProfileForm(data);
      },
      error: (err: any) => {
        console.error('Error loading seeker profile:', err);
        this.snackBar.open('Failed to load profile data', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }

  private patchProfileForm(data: any): void {
    // Convert date strings to proper format for date inputs
    const dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '';
    
    this.profileForm.patchValue({
      name: data.name || '',
      title: data.title || '',
      dateOfBirth: dateOfBirth,
      address: data.address || '',
      cvURL: data.cvURL || '',
      gender: data.gender || '',
      summary: data.summary || '',
      profileImageURL: data.profileImageURL || '',
      email: data.email || '',
      skillName: Array.isArray(data.skillName) ? data.skillName : [],
      certificateName: Array.isArray(data.certificateName) ? data.certificateName : [],
      interestName: Array.isArray(data.interestName) ? data.interestName : [],
      trainingName: Array.isArray(data.trainingName) ? data.trainingName : []
    });

    const experiencesArray = this.seekerExperiences;
    experiencesArray.clear();
    if (Array.isArray(data.seekerExperiences)) {
      data.seekerExperiences.forEach((exp: any) => {
        experiencesArray.push(this.createExperienceFormGroup(exp));
      });
    }

    const educationsArray = this.seekerEducations;
    educationsArray.clear();
    if (Array.isArray(data.seekerEducations)) {
      data.seekerEducations.forEach((edu: any) => {
        educationsArray.push(this.createEducationFormGroup(edu));
      });
    }
  }

  get seekerExperiences(): FormArray<FormGroup> {
    return this.profileForm.get('seekerExperiences') as FormArray<FormGroup>;
  }

  get seekerEducations(): FormArray<FormGroup> {
    return this.profileForm.get('seekerEducations') as FormArray<FormGroup>;
  }

  createExperienceFormGroup(experience?: any): FormGroup {
    // Convert dates to proper format for date inputs
    const startDate = experience?.startDate ? new Date(experience.startDate).toISOString().split('T')[0] : '';
    const endDate = experience?.endDate ? new Date(experience.endDate).toISOString().split('T')[0] : '';
    
    return this.fb.group({
      id: [experience?.id || null],
      jobTitle: [experience?.jobTitle || '', [Validators.required, Validators.maxLength(100)]],
      companyName: [experience?.companyName || '', [Validators.required, Validators.maxLength(100)]],
      location: [experience?.location || '', [Validators.maxLength(100)]],
      startDate: [startDate, [Validators.required]],
      endDate: [endDate],
      description: [experience?.description || '', [Validators.maxLength(500)]]
    });
  }

  addExperience(): void {
    this.seekerExperiences.push(this.createExperienceFormGroup());
  }

  removeExperience(index: number): void {
    this.seekerExperiences.removeAt(index);
  }

  createEducationFormGroup(education?: any): FormGroup {
    // Convert date to proper format for date input
    const date = education?.date ? new Date(education.date).toISOString().split('T')[0] : '';
    
    return this.fb.group({
      id: [education?.id || null],
      major: [education?.major || '', [Validators.required, Validators.maxLength(100)]],
      faculty: [education?.faculty || '', [Validators.required, Validators.maxLength(100)]],
      university: [education?.university || '', [Validators.required, Validators.maxLength(100)]],
      date: [date, [Validators.required]],
      location: [education?.location || '', [Validators.maxLength(100)]],
      GPA: [education?.GPA || '', [Validators.min(0), Validators.max(4)]],
      educationLevel: [education?.educationLevel !== undefined ? education.educationLevel : 5, [Validators.required]]
    });
  }

  addEducation(): void {
    this.seekerEducations.push(this.createEducationFormGroup());
  }

  removeEducation(index: number): void {
    this.seekerEducations.removeAt(index);
  }

  // Updated methods to handle MatChipInputEvent
  addSkill(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      const currentSkills = this.profileForm.get('skillName')?.value || [];
      if (!currentSkills.includes(value)) {
        const updatedSkills = [...currentSkills, value];
        this.profileForm.patchValue({ skillName: updatedSkills });
      }
    }
    // Clear the input value
    event.chipInput!.clear();
  }

  removeSkill(index: number): void {
    const currentSkills = this.profileForm.get('skillName')?.value || [];
    currentSkills.splice(index, 1);
    this.profileForm.patchValue({ skillName: currentSkills });
  }

  addCertificate(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      const currentCerts = this.profileForm.get('certificateName')?.value || [];
      if (!currentCerts.includes(value)) {
        const updatedCerts = [...currentCerts, value];
        this.profileForm.patchValue({ certificateName: updatedCerts });
      }
    }
    // Clear the input value
    event.chipInput!.clear();
  }

  removeCertificate(index: number): void {
    const currentCerts = this.profileForm.get('certificateName')?.value || [];
    currentCerts.splice(index, 1);
    this.profileForm.patchValue({ certificateName: currentCerts });
  }

  addInterest(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      const currentInterests = this.profileForm.get('interestName')?.value || [];
      if (!currentInterests.includes(value)) {
        const updatedInterests = [...currentInterests, value];
        this.profileForm.patchValue({ interestName: updatedInterests });
      }
    }
    // Clear the input value
    event.chipInput!.clear();
  }

  removeInterest(index: number): void {
    const currentInterests = this.profileForm.get('interestName')?.value || [];
    currentInterests.splice(index, 1);
    this.profileForm.patchValue({ interestName: currentInterests });
  }

  addTraining(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      const currentTrainings = this.profileForm.get('trainingName')?.value || [];
      if (!currentTrainings.includes(value)) {
        const updatedTrainings = [...currentTrainings, value];
        this.profileForm.patchValue({ trainingName: updatedTrainings });
      }
    }
    // Clear the input value
    event.chipInput!.clear();
  }

  removeTraining(index: number): void {
    const currentTrainings = this.profileForm.get('trainingName')?.value || [];
    currentTrainings.splice(index, 1);
    this.profileForm.patchValue({ trainingName: currentTrainings });
  }

  saveProfile(): void {
    if (this.profileForm.valid) {
      this.isLoading = true;
      
      const formData = { ...this.profileForm.value };
      
      // Create the payload matching the backend DTO structure
      const payload = {
        Name: formData.name,
        Email: formData.email,
        PhoneNumber: null, // Add if needed
        Title: formData.title,
        Address: formData.address,
        DateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
        Gender: formData.gender,
        Summary: formData.summary,
        CV_Url: formData.cvURL,
        ProfileImageUrl: formData.profileImageURL,
        Skills: formData.skillName || [],
        Interests: formData.interestName || [],
        Certificates: formData.certificateName || [],
        Trainings: formData.trainingName || [],
        SeekerEducations: formData.seekerEducations?.map((edu: any) => ({
          Id: edu.id || null, // Match SeekerEducationUpdateDto (nullable Id)
          Major: edu.major,
          Faculty: edu.faculty,
          University: edu.university,
          Date: edu.date ? new Date(edu.date).toISOString() : null,
          Location: edu.location,
          GPA: edu.GPA ? parseFloat(edu.GPA) : null,
          EducationLevel: edu.educationLevel !== undefined ? parseInt(edu.educationLevel) : null
        })) || [],
        SeekerExperiences: formData.seekerExperiences?.map((exp: any) => ({
          Id: exp.id || null, // Match SeekerExperienceUpdateDto (nullable Id)
          JobTitle: exp.jobTitle,
          CompanyName: exp.companyName,
          Location: exp.location, // Now include Location
          StartDate: exp.startDate ? new Date(exp.startDate).toISOString() : null,
          EndDate: exp.endDate ? new Date(exp.endDate).toISOString() : null,
          Description: exp.description
        })) || []
      };
      
      console.log('Sending payload:', payload); // For debugging
      
      this.authService.updateSeekerProfile(payload).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.snackBar.open('Profile updated successfully!', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          this.loadSeekerProfile();
        },
        error: (err) => {
          this.isLoading = false;
          let errorMessage = 'Failed to update profile';
          
          console.error('Update error:', err); // For debugging
          
          if (err.error?.message) {
            errorMessage = err.error.message;
          } else if (err.error && typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (err.status === 401) {
            errorMessage = 'Unauthorized. Please login again.';
          } else if (err.status === 400) {
            errorMessage = 'Invalid data provided. Please check your input.';
          }

          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        }
      });
    } else {
      this.profileForm.markAllAsTouched();
      this.snackBar.open('Please fill all required fields correctly', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
    }
  }

  get f(): { [key: string]: AbstractControl } {
    return this.profileForm.controls;
  }
}