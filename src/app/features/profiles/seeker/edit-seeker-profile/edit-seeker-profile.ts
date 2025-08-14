// import { Component, OnInit, signal } from '@angular/core';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, AbstractControl } from '@angular/forms';
// import { MatCardModule } from "@angular/material/card";
// import { MatDividerModule } from "@angular/material/divider";
// import { MaterialModule } from "../../../../shared/material.module";
// import { AuthService } from '../../../../auth/auth-service';
// import { ProfilesService } from '../../profiles-service';
// import { CommonModule, NgFor, NgIf } from '@angular/common';
// import { MatOptionModule } from '@angular/material/core';
// import { MatSnackBar } from '@angular/material/snack-bar';
// import { Router } from '@angular/router';
// import { MatProgressSpinner } from '@angular/material/progress-spinner';
// import { MatSelectModule } from '@angular/material/select';
// import { MatChipsModule } from '@angular/material/chips';
// import { MatChipInputEvent } from '@angular/material/chips';
// import { COMMA, ENTER } from '@angular/cdk/keycodes';

// @Component({
//   selector: 'app-edit-seeker-profile',
//   imports: [ReactiveFormsModule, MatCardModule, MaterialModule, MatDividerModule, CommonModule, MatOptionModule, MatProgressSpinner, MatSelectModule, MatChipsModule],
//   providers: [ProfilesService],
//   templateUrl: './edit-seeker-profile.html',
//   styleUrl: './edit-seeker-profile.css'
// })
// export class EditSeekerProfile implements OnInit {
//   currentYear = new Date().getFullYear();
//   profileForm: FormGroup;
//   seekerData = signal<any>({});
//   isLoading = false;

//   selectedCVFile: File | null = null;


//   // Separator keys for chip input
//   readonly separatorKeysCodes = [ENTER, COMMA] as const;

//   // Enum options
//   genderOptions = [
//     { value: 'Male', label: 'Male' },
//     { value: 'Female', label: 'Female' }
//   ];

//   educationLevelOptions = [
//     { value: 0, label: 'High School' },
//     { value: 1, label: 'Bachelor' },
//     { value: 2, label: 'Diploma' },
//     { value: 3, label: 'Master' },
//     { value: 4, label: 'Doctorate' },
//     { value: 5, label: 'Not Specified' }
//   ];

//   constructor(
//     private authService: AuthService,
//     private fb: FormBuilder,
//     private snackBar: MatSnackBar,
//     private router: Router
//   ) {
//     this.profileForm = this.fb.group({
//       name: ['', [Validators.maxLength(100)]],
//       title: ['', [Validators.maxLength(100)]],
//       dateOfBirth: [''],
//       address: ['', [Validators.maxLength(200)]],
//       cvURL: ['', [Validators.pattern('https?://.+')]],
//       gender: [''],
//       summary: ['', [Validators.maxLength(1000)]],
//       profileImageURL: ['', [Validators.pattern('https?://.+')]],
//       email: ['', [Validators.email]],
//       skillName: [[]],
//       seekerExperiences: this.fb.array([]),
//       seekerEducations: this.fb.array([]),
//       certificateName: [[]],
//       interestName: [[]],
//       trainingName: [[]]
//     });
//   }

//   ngOnInit(): void {
//     this.loadSeekerProfile();
//   }

//   loadSeekerProfile(): void {
//     this.authService.getSeekerProfile().subscribe({
//       next: (data: any) => {
//         this.seekerData.set(data);
//         this.patchProfileForm(data);
//       },
//       error: (err: any) => {
//         console.error('Error loading seeker profile:', err);
//         this.snackBar.open('Failed to load profile data', 'Close', {
//           duration: 3000,
//           horizontalPosition: 'center',
//           verticalPosition: 'top'
//         });
//       }
//     });
//   }

//   private patchProfileForm(data: any): void {
//     // Convert date strings to proper format for date inputs
//     const dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '';
    
//     this.profileForm.patchValue({
//       name: data.name || '',
//       title: data.title || '',
//       dateOfBirth: dateOfBirth,
//       address: data.address || '',
//       cvURL: data.cvURL || '',
//       gender: data.gender || '',
//       summary: data.summary || '',
//       profileImageURL: data.profileImageURL || '',
//       email: data.email || '',
//       skillName: Array.isArray(data.skillName) ? data.skillName : [],
//       certificateName: Array.isArray(data.certificateName) ? data.certificateName : [],
//       interestName: Array.isArray(data.interestName) ? data.interestName : [],
//       trainingName: Array.isArray(data.trainingName) ? data.trainingName : []
//     });

//     const experiencesArray = this.seekerExperiences;
//     experiencesArray.clear();
//     if (Array.isArray(data.seekerExperiences)) {
//       data.seekerExperiences.forEach((exp: any) => {
//         experiencesArray.push(this.createExperienceFormGroup(exp));
//       });
//     }

//     const educationsArray = this.seekerEducations;
//     educationsArray.clear();
//     if (Array.isArray(data.seekerEducations)) {
//       data.seekerEducations.forEach((edu: any) => {
//         educationsArray.push(this.createEducationFormGroup(edu));
//       });
//     }
//   }

//   get seekerExperiences(): FormArray<FormGroup> {
//     return this.profileForm.get('seekerExperiences') as FormArray<FormGroup>;
//   }

//   get seekerEducations(): FormArray<FormGroup> {
//     return this.profileForm.get('seekerEducations') as FormArray<FormGroup>;
//   }

//   createExperienceFormGroup(experience?: any): FormGroup {
//     // Convert dates to proper format for date inputs
//     const startDate = experience?.startDate ? new Date(experience.startDate).toISOString().split('T')[0] : '';
//     const endDate = experience?.endDate ? new Date(experience.endDate).toISOString().split('T')[0] : '';
    
//     return this.fb.group({
//       id: [experience?.id || null],
//       jobTitle: [experience?.jobTitle || '', [Validators.required, Validators.maxLength(100)]],
//       companyName: [experience?.companyName || '', [Validators.required, Validators.maxLength(100)]],
//       location: [experience?.location || '', [Validators.maxLength(100)]],
//       startDate: [startDate, [Validators.required]],
//       endDate: [endDate],
//       description: [experience?.description || '', [Validators.maxLength(500)]]
//     });
//   }

//   addExperience(): void {
//     this.seekerExperiences.push(this.createExperienceFormGroup());
//   }

//   removeExperience(index: number): void {
//     this.seekerExperiences.removeAt(index);
//   }

//   createEducationFormGroup(education?: any): FormGroup {
//     // Convert date to proper format for date input
//     const date = education?.date ? new Date(education.date).toISOString().split('T')[0] : '';
    
//     return this.fb.group({
//       id: [education?.id || null],
//       major: [education?.major || '', [Validators.required, Validators.maxLength(100)]],
//       faculty: [education?.faculty || '', [Validators.required, Validators.maxLength(100)]],
//       university: [education?.university || '', [Validators.required, Validators.maxLength(100)]],
//       date: [date, [Validators.required]],
//       location: [education?.location || '', [Validators.maxLength(100)]],
//       GPA: [education?.GPA || '', [Validators.min(0), Validators.max(4)]],
//       educationLevel: [education?.educationLevel !== undefined ? education.educationLevel : 5, [Validators.required]]
//     });
//   }

//   addEducation(): void {
//     this.seekerEducations.push(this.createEducationFormGroup());
//   }

//   removeEducation(index: number): void {
//     this.seekerEducations.removeAt(index);
//   }

//   // Updated methods to handle MatChipInputEvent
//   addSkill(event: MatChipInputEvent): void {
//     const value = (event.value || '').trim();
//     if (value) {
//       const currentSkills = this.profileForm.get('skillName')?.value || [];
//       if (!currentSkills.includes(value)) {
//         const updatedSkills = [...currentSkills, value];
//         this.profileForm.patchValue({ skillName: updatedSkills });
//       }
//     }
//     // Clear the input value
//     event.chipInput!.clear();
//   }

//   removeSkill(index: number): void {
//     const currentSkills = this.profileForm.get('skillName')?.value || [];
//     currentSkills.splice(index, 1);
//     this.profileForm.patchValue({ skillName: currentSkills });
//   }

//   addCertificate(event: MatChipInputEvent): void {
//     const value = (event.value || '').trim();
//     if (value) {
//       const currentCerts = this.profileForm.get('certificateName')?.value || [];
//       if (!currentCerts.includes(value)) {
//         const updatedCerts = [...currentCerts, value];
//         this.profileForm.patchValue({ certificateName: updatedCerts });
//       }
//     }
//     // Clear the input value
//     event.chipInput!.clear();
//   }

//   removeCertificate(index: number): void {
//     const currentCerts = this.profileForm.get('certificateName')?.value || [];
//     currentCerts.splice(index, 1);
//     this.profileForm.patchValue({ certificateName: currentCerts });
//   }

//   addInterest(event: MatChipInputEvent): void {
//     const value = (event.value || '').trim();
//     if (value) {
//       const currentInterests = this.profileForm.get('interestName')?.value || [];
//       if (!currentInterests.includes(value)) {
//         const updatedInterests = [...currentInterests, value];
//         this.profileForm.patchValue({ interestName: updatedInterests });
//       }
//     }
//     // Clear the input value
//     event.chipInput!.clear();
//   }

//   removeInterest(index: number): void {
//     const currentInterests = this.profileForm.get('interestName')?.value || [];
//     currentInterests.splice(index, 1);
//     this.profileForm.patchValue({ interestName: currentInterests });
//   }

//   addTraining(event: MatChipInputEvent): void {
//     const value = (event.value || '').trim();
//     if (value) {
//       const currentTrainings = this.profileForm.get('trainingName')?.value || [];
//       if (!currentTrainings.includes(value)) {
//         const updatedTrainings = [...currentTrainings, value];
//         this.profileForm.patchValue({ trainingName: updatedTrainings });
//       }
//     }
//     // Clear the input value
//     event.chipInput!.clear();
//   }

//   removeTraining(index: number): void {
//     const currentTrainings = this.profileForm.get('trainingName')?.value || [];
//     currentTrainings.splice(index, 1);
//     this.profileForm.patchValue({ trainingName: currentTrainings });
//   }


//   saveProfile(): void {
//     if (this.profileForm.valid) {
//       this.isLoading = true;
      
//       const formData = { ...this.profileForm.value };
      
      
//       // Create the payload matching the backend DTO structure
//       const payload = {
//         Name: formData.name,
//         Email: formData.email,
//         PhoneNumber: null, // Add if needed
//         Title: formData.title,
//         Address: formData.address,
//         DateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : null,
//         Gender: formData.gender,
//         Summary: formData.summary,
//         CV_Url: formData.cvURL,
//         ProfileImageUrl: formData.profileImageURL,
//         Skills: formData.skillName || [],
//         Interests: formData.interestName || [],
//         Certificates: formData.certificateName || [],
//         Trainings: formData.trainingName || [],
//         SeekerEducations: formData.seekerEducations?.map((edu: any) => ({
//           Id: edu.id || null,
//           Major: edu.major,
//           Faculty: edu.faculty,
//           University: edu.university,
//           Date: edu.date ? new Date(edu.date).toISOString() : null,
//           Location: edu.location,
//           GPA: edu.GPA ? parseFloat(edu.GPA) : null,
//           EducationLevel: edu.educationLevel !== undefined ? parseInt(edu.educationLevel) : null
//         })) || [],
//         SeekerExperiences: formData.seekerExperiences?.map((exp: any) => ({
//           Id: exp.id || null, 
//           JobTitle: exp.jobTitle,
//           CompanyName: exp.companyName,
//           Location: exp.location, 
//           StartDate: exp.startDate ? new Date(exp.startDate).toISOString() : null,
//           EndDate: exp.endDate ? new Date(exp.endDate).toISOString() : null,
//           Description: exp.description
//         })) || []
//       };
      
//       console.log('Sending payload:', payload); // For debugging
      
//       this.authService.updateSeekerProfile(payload).subscribe({
//         next: (response) => {
//           this.isLoading = false;
//           this.snackBar.open('Profile updated successfully!', 'Close', {
//             duration: 3000,
//             horizontalPosition: 'center',
//             verticalPosition: 'top'
//           });
//           this.loadSeekerProfile();
//         },
//         error: (err) => {
//           this.isLoading = false;
//           let errorMessage = 'Failed to update profile';
          
//           console.error('Update error:', err); // For debugging
          
//           if (err.error?.message) {
//             errorMessage = err.error.message;
//           } else if (err.error && typeof err.error === 'string') {
//             errorMessage = err.error;
//           } else if (err.status === 401) {
//             errorMessage = 'Unauthorized. Please login again.';
//           } else if (err.status === 400) {
//             errorMessage = 'Invalid data provided. Please check your input.';
//           }

//           this.snackBar.open(errorMessage, 'Close', {
//             duration: 5000,
//             horizontalPosition: 'center',
//             verticalPosition: 'top'
//           });
//         }
//       });
//     } else {
//       this.profileForm.markAllAsTouched();
//       this.snackBar.open('Please fill all required fields correctly', 'Close', {
//         duration: 3000,
//         horizontalPosition: 'center',
//         verticalPosition: 'top'
//       });
//     }
//   }

//   get f(): { [key: string]: AbstractControl } {
//     return this.profileForm.controls;
//   }


//   onFileSelected(event: Event): void {
//     const input = event.target as HTMLInputElement;
//     if (input.files && input.files.length > 0) {
//       this.selectedCVFile = input.files[0];
//     }
//   }

// }


// =====================================================================
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, AbstractControl } from '@angular/forms';
import { MatCardModule } from "@angular/material/card";
import { MatDividerModule } from "@angular/material/divider";
import { MaterialModule } from "../../../../shared/material.module";
import { AuthService } from '../../../../auth/auth-service';
import { ProfilesService } from '../../profiles-service';
import { CommonModule } from '@angular/common';
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

  selectedCVFile: File | null = null;
  selectedImageFile: File | null = null;

  readonly separatorKeysCodes = [ENTER, COMMA] as const;

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
      cvURL: [''],
      gender: [''],
      summary: ['', [Validators.maxLength(1000)]],
      profileImageURL: [''],
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

  /**
   * Enhanced parsing function to handle deeply nested JSON strings
   */
  private parseComplexArray(value: any): string[] {
    if (!value) return [];
    
    console.log('Parsing value:', value, 'Type:', typeof value);
    
    // If it's already a clean array of strings
    if (Array.isArray(value) && value.every(item => typeof item === 'string' && !item.startsWith('['))) {
      return value;
    }
    
    let result: string[] = [];
    
    if (typeof value === 'string') {
      try {
        let parsed = JSON.parse(value);
        result = this.flattenAndCleanArray(parsed);
      } catch {
        result = [value];
      }
    } else if (Array.isArray(value)) {
      result = this.flattenAndCleanArray(value);
    } else {
      result = [String(value)];
    }
    
    console.log('Parsed result:', result);
    return result;
  }

  /**
   * Recursively flatten and clean nested arrays and JSON strings
   */
  private flattenAndCleanArray(arr: any): string[] {
    const result: string[] = [];
    
    const processItem = (item: any) => {
      if (typeof item === 'string') {
        // Check if it's a JSON string
        if ((item.startsWith('[') && item.endsWith(']')) || (item.startsWith('{') && item.endsWith('}'))) {
          try {
            const parsed = JSON.parse(item);
            if (Array.isArray(parsed)) {
              parsed.forEach(processItem);
            } else {
              result.push(String(parsed));
            }
          } catch {
            result.push(item);
          }
        } else {
          result.push(item);
        }
      } else if (Array.isArray(item)) {
        item.forEach(processItem);
      } else {
        result.push(String(item));
      }
    };
    
    if (Array.isArray(arr)) {
      arr.forEach(processItem);
    } else {
      processItem(arr);
    }
    
    return result.filter(item => item && item.trim() !== '');
  }

  loadSeekerProfile(): void {
    this.authService.getSeekerProfile().subscribe({
      next: (data: any) => {
        console.log('Loading profile data:', data);
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
    const dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '';
    
    this.profileForm.patchValue({
      name: data.name || '',
      title: data.title || '',
      dateOfBirth: dateOfBirth,
      address: data.address || '',
      cvURL: data.cV_Url || '', // Note the different case
      gender: data.gender || '',
      summary: data.summary || '',
      profileImageURL: data.profileImageUrl || '', // Note the different case
      email: data.email || '',
      skillName: this.parseComplexArray(data.skillName),
      certificateName: this.parseComplexArray(data.certificateName),
      interestName: this.parseComplexArray(data.interestName),
      trainingName: this.parseComplexArray(data.trainingName)
    });

    // Clear existing arrays
    this.seekerExperiences.clear();
    this.seekerEducations.clear();

    // Add experiences
    if (Array.isArray(data.seekerExperiences) && data.seekerExperiences.length > 0) {
      data.seekerExperiences.forEach((exp: any) => {
        this.seekerExperiences.push(this.createExperienceFormGroup(exp));
      });
    }

    // Add educations
    if (Array.isArray(data.seekerEducations) && data.seekerEducations.length > 0) {
      data.seekerEducations.forEach((edu: any) => {
        this.seekerEducations.push(this.createEducationFormGroup(edu));
      });
    }

    console.log('Form after patch:', this.profileForm.value);
  }

  get seekerExperiences(): FormArray<FormGroup> {
    return this.profileForm.get('seekerExperiences') as FormArray<FormGroup>;
  }

  get seekerEducations(): FormArray<FormGroup> {
    return this.profileForm.get('seekerEducations') as FormArray<FormGroup>;
  }

  createExperienceFormGroup(experience?: any): FormGroup {
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

  addSkill(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      const currentSkills = this.profileForm.get('skillName')?.value || [];
      if (!currentSkills.includes(value)) {
        this.profileForm.patchValue({ skillName: [...currentSkills, value] });
      }
    }
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
        this.profileForm.patchValue({ certificateName: [...currentCerts, value] });
      }
    }
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
        this.profileForm.patchValue({ interestName: [...currentInterests, value] });
      }
    }
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
        this.profileForm.patchValue({ trainingName: [...currentTrainings, value] });
      }
    }
    event.chipInput!.clear();
  }

  removeTraining(index: number): void {
    const currentTrainings = this.profileForm.get('trainingName')?.value || [];
    currentTrainings.splice(index, 1);
    this.profileForm.patchValue({ trainingName: currentTrainings });
  }

  saveProfile(): void {
    console.log('Saving profile with form data:', this.profileForm.value);
    
    if (this.profileForm.valid) {
      this.isLoading = true;
      const formData = new FormData();

      // Basic information
      formData.append('Name', this.profileForm.value.name || '');
      formData.append('Email', this.profileForm.value.email || '');
      formData.append('PhoneNumber', '');
      formData.append('Title', this.profileForm.value.title || '');
      formData.append('Address', this.profileForm.value.address || '');
      formData.append('DateOfBirth', this.profileForm.value.dateOfBirth ? new Date(this.profileForm.value.dateOfBirth).toISOString() : '');
      formData.append('Gender', this.profileForm.value.gender || '');
      formData.append('Summary', this.profileForm.value.summary || '');

      // File uploads
      if (this.selectedCVFile) {
        formData.append('CV', this.selectedCVFile);
      }

      if (this.selectedImageFile) {
        formData.append('ProfileImage', this.selectedImageFile);
      }

      // Arrays - sending as clean JSON arrays
      const skills = this.profileForm.value.skillName || [];
      if (skills.length > 0) {
        formData.append('Skills', JSON.stringify(skills));
      }

      const interests = this.profileForm.value.interestName || [];
      if (interests.length > 0) {
        formData.append('Interests', JSON.stringify(interests));
      }

      const certificates = this.profileForm.value.certificateName || [];
      if (certificates.length > 0) {
        formData.append('Certificates', JSON.stringify(certificates));
      }

      const trainings = this.profileForm.value.trainingName || [];
      if (trainings.length > 0) {
        formData.append('Trainings', JSON.stringify(trainings));
      }

      // Education data
      const educationData = this.profileForm.value.seekerEducations || [];
      if (educationData.length > 0) {
        const educations = educationData.map((edu: any) => ({
          Id: edu.id || null,
          Major: edu.major || '',
          Faculty: edu.faculty || '',
          University: edu.university || '',
          Date: edu.date ? new Date(edu.date).toISOString() : null,
          Location: edu.location || '',
          GPA: edu.GPA ? parseFloat(edu.GPA) : null,
          EducationLevel: edu.educationLevel !== undefined ? parseInt(edu.educationLevel) : 5
        }));
        formData.append('SeekerEducations', JSON.stringify(educations));
        console.log('Sending education data:', educations);
      }

      // Experience data
      const experienceData = this.profileForm.value.seekerExperiences || [];
      if (experienceData.length > 0) {
        const experiences = experienceData.map((exp: any) => ({
          Id: exp.id || null, 
          JobTitle: exp.jobTitle || '',
          CompanyName: exp.companyName || '',
          Location: exp.location || '', 
          StartDate: exp.startDate ? new Date(exp.startDate).toISOString() : null,
          EndDate: exp.endDate ? new Date(exp.endDate).toISOString() : null,
          Description: exp.description || ''
        }));
        formData.append('SeekerExperiences', JSON.stringify(experiences));
        console.log('Sending experience data:', experiences);
      }

      // Debug: Log what we're sending
      console.log('FormData contents:');
      formData.forEach((value, key) => {
        console.log(`${key}:`, value instanceof File ? `File: ${value.name}` : value);
      });

      this.authService.updateSeekerProfile(formData).subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('Profile updated successfully:', response);
          this.snackBar.open('Profile updated successfully!', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          // Reload the profile to see changes
          this.loadSeekerProfile();
        },
        error: (err) => {
          this.isLoading = false;
          this.handleSaveError(err);
        }
      });

    } else {
      this.handleFormValidationErrors();
    }
  }

  private handleSaveError(err: any): void {
    let errorMessage = 'Failed to update profile';
    console.error('Update error:', err);

    if (err.error?.message) {
      errorMessage = err.error.message;
    } else if (err.error && typeof err.error === 'string') {
      errorMessage = err.error;
    } else if (err.status === 401) {
      errorMessage = 'Unauthorized. Please login again.';
    } else if (err.status === 400) {
      errorMessage = 'Invalid data provided. Please check your input.';
    } else if (err.status === 413) {
      errorMessage = 'File size too large. Please choose smaller files.';
    }

    this.snackBar.open(errorMessage, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  private handleFormValidationErrors(): void {
    console.log('Form is invalid:', this.profileForm.errors);
    console.log('Form controls with errors:', this.getFormValidationErrors());
    
    this.profileForm.markAllAsTouched();
    this.snackBar.open('Please fill all required fields correctly', 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  getFormValidationErrors() {
    let formErrors: any = {};

    Object.keys(this.profileForm.controls).forEach(key => {
      const controlErrors = this.profileForm.get(key)?.errors;
      if (controlErrors) {
        formErrors[key] = controlErrors;
      }
    });

    // Check FormArrays
    this.seekerExperiences.controls.forEach((group, index) => {
      const groupErrors: any = {};
      Object.keys(group.controls).forEach(field => {
        const fieldControl = group.get(field);
        if (fieldControl && fieldControl.errors) {
          groupErrors[field] = fieldControl.errors;
        }
      });
      if (Object.keys(groupErrors).length > 0) {
        formErrors[`experience_${index}`] = groupErrors;
      }
    });

    this.seekerEducations.controls.forEach((group, index) => {
      const groupErrors: any = {};
      Object.keys(group.controls).forEach(field => {
        const fieldControl = group.get(field);
        if (fieldControl && fieldControl.errors) {
          groupErrors[field] = fieldControl.errors;
        }
      });
      if (Object.keys(groupErrors).length > 0) {
        formErrors[`education_${index}`] = groupErrors;
      }
    });

    return formErrors;
  }

  get f(): { [key: string]: AbstractControl } {
    return this.profileForm.controls;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedCVFile = input.files[0];
      
      // Validate file type and size
      const file = input.files[0];
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      if (!allowedTypes.includes(file.type)) {
        this.snackBar.open('Please select a PDF, DOC, or DOCX file', 'Close', { duration: 3000 });
        input.value = '';
        this.selectedCVFile = null;
        return;
      }
      
      if (file.size > maxSize) {
        this.snackBar.open('File size must be less than 10MB', 'Close', { duration: 3000 });
        input.value = '';
        this.selectedCVFile = null;
        return;
      }
      
      console.log('CV file selected:', this.selectedCVFile.name);
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedImageFile = input.files[0];
      
      // Validate file type and size
      const file = input.files[0];
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      
      if (!allowedTypes.includes(file.type)) {
        this.snackBar.open('Please select a valid image file (JPEG, PNG, GIF, WebP)', 'Close', { duration: 3000 });
        input.value = '';
        this.selectedImageFile = null;
        return;
      }
      
      if (file.size > maxSize) {
        this.snackBar.open('Image size must be less than 5MB', 'Close', { duration: 3000 });
        input.value = '';
        this.selectedImageFile = null;
        return;
      }
      
      console.log('Image file selected:', this.selectedImageFile.name);
    }
  }
}