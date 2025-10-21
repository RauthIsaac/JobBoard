import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { JobsService } from '../jobs-service';
import { IJob } from '../../../shared/models/ijob';
import { ISkill } from '../../../shared/models/iskill';
import { ICategory } from '../../../shared/models/icategory';
import { SnackbarService } from '../../../shared/components/snackbar/snackbar-service';

@Component({
  selector: 'app-add-job',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgIf, NgIf, RouterLink],
  templateUrl: './add-job.html',
  styleUrl: './add-job.css'
})
export class AddJob implements OnInit {
  jobForm!: FormGroup;
  isSubmitting = false;
  submitError: string | null = null;
  submitSuccess = false;
  skills = signal<ISkill[]>([]);
  categories = signal<ICategory[]>([]);
  
  // Signal to track form changes for reactive updates
  formUpdated = signal<number>(0);
  
  // Search functionality
  skillSearchTerm = signal<string>('');
  categorySearchTerm = signal<string>('');
  
  // Filtered signals based on search terms (limited to 10 items each)
  filteredSkills = computed(() => {
    const searchTerm = this.skillSearchTerm().toLowerCase();
    return this.skills()
      .filter(skill => skill.skillName.toLowerCase().includes(searchTerm))
      .slice(0, 10); // Limit to maximum 10 skills
  });
  
  filteredCategories = computed(() => {
    const searchTerm = this.categorySearchTerm().toLowerCase();
    return this.categories()
      .filter(category => category.categoryName.toLowerCase().includes(searchTerm))
      .slice(0, 10); // Limit to maximum 10 categories
  });

  // Computed properties for selected items (now reactive to form changes)
  selectedSkills = computed(() => {
    this.formUpdated(); // Trigger reactivity
    const selectedIds: number[] = this.jobForm.get('skills')?.value || [];
    return this.skills().filter(skill => selectedIds.includes(skill.id));
  });

  selectedCategories = computed(() => {
    this.formUpdated(); // This needs to be triggered when categories change
    const selectedIds: number[] = this.jobForm.get('categories')?.value || [];
    return this.categories().filter(category => selectedIds.includes(category.id));
  });

  // Computed properties for total counts
  totalMatchingSkills = computed(() => {
    const searchTerm = this.skillSearchTerm().toLowerCase();
    return this.skills().filter(skill => 
      skill.skillName.toLowerCase().includes(searchTerm)
    ).length;
  });

  totalMatchingCategories = computed(() => {
    const searchTerm = this.categorySearchTerm().toLowerCase();
    return this.categories().filter(category => 
      category.categoryName.toLowerCase().includes(searchTerm)
    ).length;
  });

  // Options for select fields
  experienceLevels = [
    { value: 'Student', label: 'Student' },
    { value: 'Internship', label: 'Internship' },
    { value: 'EntryLevel', label: 'Entry Level' },
    { value: 'Experienced', label: 'Experienced' },
    { value: 'TeamLeader', label: 'Team Leader' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Director', label: 'Director' },
    { value: 'Executive', label: 'Executive' },
    { value: 'NotSpecified', label: 'Not Specified' }
  ];

  jobTypes = [
    { value: 'FullTime', label: 'Full Time' },
    { value: 'PartTime', label: 'Part Time' },
    { value: 'Freelance', label: 'Freelance' },
    { value: 'Internship', label: 'Internship' },
    { value: 'Temporary', label: 'Temporary' },
    { value: 'Contract', label: 'Contract' }
  ];

  workplaceTypes = [
    { value: 'OnSite', label: 'On Site' },
    { value: 'Remote', label: 'Remote' },
    { value: 'Hybrid', label: 'Hybrid' }
  ];

  educationLevels = [
    { value: 'HighSchool', label: 'High School' },
    { value: 'Bachelor', label: 'Bachelor' },
    { value: 'Diploma', label: 'Diploma' },
    { value: 'Master', label: 'Master' },
    { value: 'Doctorate', label: 'Doctorate' },
    { value: 'NotSpecified', label: 'Not Specified' }
  ];

  /*------------------------- Constructor -------------------------*/
  constructor(
    private fb: FormBuilder,
    private jobsService: JobsService,
    private router: Router,
    private snackbarService: SnackbarService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.getSkills();
    this.getCategories();

    // Dynamic stagger animation
    setTimeout(() => {
      const lines = document.querySelectorAll<HTMLElement>('.fade-line');
      lines.forEach((line, index) => {
        line.style.animationDelay = `${index * 0.15}s`;
        line.classList.add('visible');
      });
    }, 600);
  }

  /*------------------------- Initialize Form -------------------------*/
  initForm(): void {
    this.jobForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(50)]],
      salary: [null, [Validators.required, Validators.min(0)]],
      workplaceType: ['', Validators.required],
      jobType: ['', Validators.required],
      expireDate: ['', [Validators.required, this.futureDateValidator]],
      requirements: [''],
      minTeamSize: [1, [Validators.required, Validators.min(1)]],
      maxTeamSize: [10, [Validators.required, Validators.min(1)]],
      educationLevel: ['', Validators.required],
      experienceLevel: ['', Validators.required],
      website: ['', [Validators.pattern('(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?')]],
      responsabilities: ['', [Validators.minLength(50)]],
      benefits: ['', [Validators.minLength(50)]],
      categories: [[], [Validators.required, Validators.minLength(1)]],
      skills: [[], [Validators.required, Validators.minLength(1)]],
    }, { validators: this.teamSizeValidator });
  }

  /*------------------------- Custom Validators -------------------------*/
  // Validator to ensure expireDate is in the future
  futureDateValidator(control: any) {
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return { pastDate: true };
    }
    return null;
  }

  // Validator to ensure maxTeamSize >= minTeamSize
  teamSizeValidator(group: FormGroup) {
    const min = group.get('minTeamSize')?.value;
    const max = group.get('maxTeamSize')?.value;
    
    if (min && max && max < min) {
      return { teamSizeInvalid: true };
    }
    return null;
  }

  /*------------------------- Search Methods -------------------------*/
  onSkillSearch(searchTerm: string): void {
    this.skillSearchTerm.set(searchTerm);
  }
  
  onCategorySearch(searchTerm: string): void {
    this.categorySearchTerm.set(searchTerm);
  }
  
  clearSkillSearch(): void {
    this.skillSearchTerm.set('');
  }
  
  clearCategorySearch(): void {
    this.categorySearchTerm.set('');
  }

  /*------------------------- Remove Selected Items -------------------------*/
  removeSelectedSkill(skillId: number): void {
    const currentSkills: number[] = this.jobForm.get('skills')?.value || [];
    this.jobForm.get('skills')?.setValue(currentSkills.filter(id => id !== skillId));
    this.triggerFormUpdate();
  }

  removeSelectedCategory(categoryId: number): void {
    const currentCategories: number[] = this.jobForm.get('categories')?.value || [];
    this.jobForm.get('categories')?.setValue(currentCategories.filter(id => id !== categoryId));
    this.triggerFormUpdate();
  }

  /*------------------------- Get Skills -------------------------*/
  //#region Skills
  getSkills(): void {
    this.jobsService.GetAllJobsSkills().subscribe({
      next: (skills: ISkill[]) => {
        if (Array.isArray(skills)) {
          this.skills.set(skills);
          console.log('Fetched Skills:', this.skills());
        } else {
          console.error('Invalid skills data received:', skills);
          this.skills.set([]);
        }
      },
      error: (error: any) => {
        console.error('Error fetching skills:', error);
        this.submitError = 'Failed to load skills. Please try again.';
      }
    });
  }

  onSkillChange(skill: ISkill, checked: boolean): void {
    const currentSkills: number[] = this.jobForm.get('skills')?.value || [];

    if (checked) {
      // Add skill id if not already present
      if (!currentSkills.includes(skill.id)) {
        this.jobForm.get('skills')?.setValue([...currentSkills, skill.id]);
      }
    } else {
      // Remove skill id if present
      this.jobForm.get('skills')?.setValue(currentSkills.filter(id => id !== skill.id));
    }

    this.triggerFormUpdate();
    console.log('Current selected skills:', this.jobForm.get('skills')?.value);
  }

  isSkillSelected(skillId: number): boolean {
    const selectedSkills: number[] = this.jobForm.get('skills')?.value || [];
    return selectedSkills.includes(skillId);
  }
  //#endregion

  /*------------------------- Get Categories -------------------------*/
  //#region Categories
  getCategories(): void {
    this.jobsService.GetAllJobsCategories().subscribe({
      next: (categories: ICategory[]) => {
        if (Array.isArray(categories)) {
          const validCategories = categories.map(cat => ({
            id: cat.id,
            categoryName: cat.categoryName || 'No Name',
          }));
          this.categories.set(validCategories);
          console.log('Fetched Categories:', this.categories());
        } else {
          console.error('Invalid categories data received:', categories);
          this.categories.set([]);
        }
      },
      error: (error: any) => {
        console.error('Error fetching categories:', error);
        this.submitError = 'Failed to load categories. Please try again.';
      }
    });
  }

  onCategoryChange(category: ICategory, checked: boolean): void {
    const currentCategories: number[] = this.jobForm.get('categories')?.value || [];

    if (checked) {
      if (!currentCategories.includes(category.id)) {
        this.jobForm.get('categories')?.setValue([...currentCategories, category.id]);
      }
    } else {
      this.jobForm.get('categories')?.setValue(currentCategories.filter(id => id !== category.id));
    }

    // Trigger reactive updates
    this.triggerFormUpdate();

    console.log('Current selected categories:', this.jobForm.get('categories')?.value);
  }

  isCategorySelected(categoryId: number): boolean {
    const selectedCategories: number[] = this.jobForm.get('categories')?.value || [];
    return selectedCategories.includes(categoryId);
  }
  //#endregion

  // Helper method to trigger reactive updates
  private triggerFormUpdate(): void {
    this.formUpdated.update(val => val + 1);
  }
  
  // Helper method to mark all controls in a form group as touched
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /*------------------------- Form Submission -------------------------*/
  onSubmit(): void {
    console.log('Form Submitted', this.jobForm.value);
    console.log('Form Valid:', this.jobForm.valid);
    console.log('Form Errors:', this.jobForm.errors);

    if (this.jobForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      console.log('Form is invalid');
      this.markFormGroupTouched(this.jobForm);
      
      // Display specific validation errors
      if (this.jobForm.errors?.['teamSizeInvalid']) {
        this.submitError = 'Maximum team size must be greater than or equal to minimum team size.';
      } else if (this.jobForm.get('expireDate')?.errors?.['pastDate']) {
        this.submitError = 'Application deadline must be a future date.';
      } else if (this.jobForm.get('skills')?.errors?.['required']) {
        this.submitError = 'Please select at least one skill.';
      } else if (this.jobForm.get('categories')?.errors?.['required']) {
        this.submitError = 'Please select at least one category.';
      } else {
        this.submitError = 'Please fix all errors in the form before submitting.';
      }
      return;
    }

    this.isSubmitting = true;
    this.submitError = null;
    this.submitSuccess = false;

    // Prepare the job data
    const formData = this.jobForm.value;
    
    // Create job object based on IJob interface
    const jobData: Partial<IJob> = {
      title: formData.title,
      description: formData.description,
      salary: formData.salary,
      workplaceType: formData.workplaceType,
      jobType: formData.jobType,
      postedDate: new Date(),
      expireDate: new Date(formData.expireDate),
      requirements: formData.requirements,
      minTeamSize: formData.minTeamSize,
      maxTeamSize: formData.maxTeamSize,
      educationLevel: formData.educationLevel,
      experienceLevel: formData.experienceLevel,
      isActive: true,
      companyName: formData.companyName,
      companyLocation: formData.companyLocation,
      website: formData.website,
      responsabilities: formData.responsabilities,
      benefits: formData.benefits,
      categoryIds: formData.categories,
      skillIds: formData.skills
    };

    // Call the service to create the job
    this.jobsService.createJob(jobData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.submitSuccess = true;

        this.showSuccess('Job is under review now! Administrator will approve it soon.');
        // Navigate to job details page or employer profile
        setTimeout(() => {
          this.router.navigate(['/empDashboard']);
        }, 2000);
      },
      error: (error: any) => {
        this.isSubmitting = false;
        this.submitError = 'Failed to create job. Please try again.';
        this.showError(this.submitError);
        console.error('Error creating job:', error);
      }
    });
  }

  /*------------------------- Reset Form -------------------------*/
  onReset(): void {
    this.jobForm.reset();
    this.initForm();
    // Clear search terms when resetting
    this.skillSearchTerm.set('');
    this.categorySearchTerm.set('');
    // Trigger update for selected items
    this.triggerFormUpdate();
    // Clear error messages
    this.submitError = null;
    this.submitSuccess = false;
  }


  //#region Snackbar Methods
  showSuccess(message: string = 'Operation successful!', duration: number = 4000, action: string = 'Undo'): void {
    console.log('Showing success snackbar');
    this.snackbarService.show({
      message,
      type: 'success',
      duration,
      action
    });
  }

  showInfo(message: string = 'Information message', duration: number = 5000): void {
    this.snackbarService.show({
      message,
      type: 'info',
      duration
    });
  }

  showError(message: string = 'Something went wrong!', duration: number = 5000): void {
    this.snackbarService.show({
      message,
      type: 'error',
      duration
    });
  }

  //#endregion  

}