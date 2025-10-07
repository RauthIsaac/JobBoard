import { Component, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { JobsService } from '../jobs-service';
import { ISkill } from '../../../shared/models/iskill';
import { ICategory } from '../../../shared/models/icategory';
import { SnackbarService } from '../../../shared/components/snackbar/snackbar-service';

@Component({
  selector: 'app-edit-job',
  standalone: true,
  templateUrl: './edit-job.html',
  styleUrls: ['./edit-job.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class EditJob implements OnInit {
  jobForm!: FormGroup;

  // signals
  isSubmitting = signal(false);
  submitSuccess = signal(false);
  submitError = signal<string | null>(null);
  isLoading = signal(true);

  // signals for skills & categories
  skills = signal<ISkill[]>([]);
  categories = signal<ICategory[]>([]);
  formUpdated = signal<number>(0);
  
  // Search functionality
  skillSearchTerm = signal<string>('');
  categorySearchTerm = signal<string>('');

  // Filtered signals based on search terms (limited to 10 items each)
  filteredSkills = computed(() => {
    const searchTerm = this.skillSearchTerm().toLowerCase();
    return this.skills()
      .filter(skill => skill.skillName.toLowerCase().includes(searchTerm))
      .slice(0, 10);
  });
  
  filteredCategories = computed(() => {
    const searchTerm = this.categorySearchTerm().toLowerCase();
    return this.categories()
      .filter(category => category.categoryName.toLowerCase().includes(searchTerm))
      .slice(0, 10);
  });

  // Computed properties for selected items (now reactive to form changes)
  selectedSkills = computed(() => {
    this.formUpdated(); // Trigger reactivity
    const selectedIds: number[] = this.jobForm?.get('skills')?.value || [];
    return this.skills().filter(skill => selectedIds.includes(skill.id));
  });

  selectedCategories = computed(() => {
    this.formUpdated(); // This needs to be triggered when categories change
    const selectedIds: number[] = this.jobForm?.get('categories')?.value || [];
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

  // dropdowns - matching backend enums exactly
  jobTypes = [
    { value: 'FullTime', label: 'Full Time' },
    { value: 'PartTime', label: 'Part Time' },
    { value: 'Freelance', label: 'Freelance' },
    { value: 'Internship', label: 'Internship' },
    { value: 'Temporary', label: 'Temporary' },
    { value: 'Contract', label: 'Contract' }
  ];
  
  workplaceTypes = [
    { value: 'OnSite', label: 'On-site' },
    { value: 'Remote', label: 'Remote' },
    { value: 'Hybrid', label: 'Hybrid' }
  ];
  
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
  
  educationLevels = [
    { value: 'HighSchool', label: 'High School' },
    { value: 'Bachelor', label: 'Bachelor\'s Degree' },
    { value: 'Diploma', label: 'Diploma' },
    { value: 'Master', label: 'Master\'s Degree' },
    { value: 'Doctorate', label: 'Doctorate (PhD)' },
    { value: 'NotSpecified', label: 'Not Specified' }
  ];

  jobId!: number;

  constructor(
    private fb: FormBuilder,
    private jobsService: JobsService,
    private route: ActivatedRoute,
    private router: Router,
    private snackbarService : SnackbarService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.jobId = Number(this.route.snapshot.paramMap.get('id'));
    
    if (!this.jobId || this.jobId <= 0) {
      this.submitError.set('Invalid job ID');
      this.router.navigate(['/empPostedJobs']);
      return;
    }

    // Load skills and categories first, then load job data
    this.loadSkillsAndCategories().then(() => {
      this.loadJobData();
    });
  }

  /*------------------------- Initialize Form -------------------------*/
  initForm(): void {
    this.jobForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(50)]],
      salary: [null, [Validators.required, Validators.min(0)]],
      workplaceType: ['', Validators.required],
      jobType: ['', Validators.required],
      expireDate: ['', Validators.required],
      requirements: [''],
      minTeamSize: [1, [Validators.required, Validators.min(1)]],
      maxTeamSize: [10, [Validators.required, Validators.min(1)]],
      educationLevel: ['', Validators.required],
      experienceLevel: ['', Validators.required],
      website: ['', [Validators.pattern('(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?')]],
      responsabilities: ['', [Validators.minLength(50)]],
      benefits: ['', [Validators.minLength(50)]],
      categories: [[]],
      skills: [[]],
    });
  }

  /*------------------------- Load Skills and Categories -------------------------*/
  private loadSkillsAndCategories(): Promise<void> {
    return new Promise((resolve) => {
      let skillsLoaded = false;
      let categoriesLoaded = false;
      
      const checkIfBothLoaded = () => {
        if (skillsLoaded && categoriesLoaded) {
          resolve();
        }
      };

      this.jobsService.GetAllJobsSkills().subscribe({
        next: (skills: ISkill[]) => {
          if (Array.isArray(skills)) {
            this.skills.set(skills);
            console.log('Fetched Skills:', this.skills());
          } else {
            console.error('Invalid skills data received:', skills);
            this.skills.set([]);
          }
          skillsLoaded = true;
          checkIfBothLoaded();
        },
        error: (error: any) => {
          console.error('Error fetching skills:', error);
          this.submitError.set('Failed to load skills. Please try again.');
          skillsLoaded = true;
          checkIfBothLoaded();
        }
      });

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
          categoriesLoaded = true;
          checkIfBothLoaded();
        },
        error: (error: any) => {
          console.error('Error fetching categories:', error);
          this.submitError.set('Failed to load categories. Please try again.');
          categoriesLoaded = true;
          checkIfBothLoaded();
        }
      });
    });
  }

  /*------------------------- Load Job Data -------------------------*/
  loadJobData() {
    this.isLoading.set(true);
    this.submitError.set(null);
    
    this.jobsService.GetJobDetails(this.jobId).subscribe({
      next: (job: any) => {
        console.log('Job data received:', job);
        
        // Format the date for HTML date input
        let formattedExpireDate = '';
        if (job.expireDate) {
          formattedExpireDate = new Date(job.expireDate).toISOString().split('T')[0];
        }

        // FIXED: Extract skill and category IDs properly
        let skillIds: number[] = [];
        let categoryIds: number[] = [];

        // Handle skills - check if it's an array of objects or array of strings
        if (job.skills && Array.isArray(job.skills)) {
          skillIds = job.skills.map((skill: any) => {
            // If skill is an object with id property
            if (typeof skill === 'object' && skill.id) {
              return skill.id;
            }
            // If skill is a string, find the matching skill ID
            if (typeof skill === 'string') {
              const matchedSkill = this.skills().find(s => s.skillName === skill);
              return matchedSkill ? matchedSkill.id : null;
            }
            // If skill is already a number
            if (typeof skill === 'number') {
              return skill;
            }
            return null;
          }).filter((id: number | null) => id !== null);
        }

        // Handle categories - check if it's an array of objects or array of strings
        if (job.categories && Array.isArray(job.categories)) {
          categoryIds = job.categories.map((category: any) => {
            // If category is an object with id property
            if (typeof category === 'object' && category.id) {
              return category.id;
            }
            // If category is a string, find the matching category ID
            if (typeof category === 'string') {
              const matchedCategory = this.categories().find(c => c.categoryName === category);
              return matchedCategory ? matchedCategory.id : null;
            }
            // If category is already a number
            if (typeof category === 'number') {
              return category;
            }
            return null;
          }).filter((id: number | null) => id !== null);
        }

        console.log('Extracted skill IDs:', skillIds);
        console.log('Extracted category IDs:', categoryIds);

        // Patch the form with job data
        this.jobForm.patchValue({
          title: job.title || '',
          description: job.description || '',
          salary: job.salary || 0,
          jobType: job.jobType || '',
          workplaceType: job.workplaceType || '',
          expireDate: formattedExpireDate,
          requirements: job.requirements || '',
          responsabilities: job.responsabilities || '',
          benefits: job.benefits || '',
          experienceLevel: job.experienceLevel || '',
          educationLevel: job.educationLevel || '',
          minTeamSize: job.minTeamSize || 1,
          maxTeamSize: job.maxTeamSize || 10,
          website: job.website || '',
          skills: skillIds,
          categories: categoryIds
        });

        this.triggerFormUpdate();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load job data:', error);
        this.submitError.set('Failed to load job data. Please try again.');
        this.isLoading.set(false);
      }
    });
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

  /*------------------------- Skill Methods -------------------------*/
  onSkillChange(skill: ISkill, checked: boolean): void {
    const currentSkills: number[] = this.jobForm.get('skills')?.value || [];

    if (checked) {
      if (!currentSkills.includes(skill.id)) {
        this.jobForm.get('skills')?.setValue([...currentSkills, skill.id]);
      }
    } else {
      this.jobForm.get('skills')?.setValue(currentSkills.filter(id => id !== skill.id));
    }

    this.triggerFormUpdate();
    console.log('Current selected skills:', this.jobForm.get('skills')?.value);
  }

  isSkillSelected(skillId: number): boolean {
    const selectedSkills: number[] = this.jobForm.get('skills')?.value || [];
    return selectedSkills.includes(skillId);
  }

  removeSelectedSkill(skillId: number): void {
    const currentSkills: number[] = this.jobForm.get('skills')?.value || [];
    this.jobForm.get('skills')?.setValue(currentSkills.filter(id => id !== skillId));
    this.triggerFormUpdate();
  }

  /*------------------------- Category Methods -------------------------*/
  onCategoryChange(category: ICategory, checked: boolean): void {
    const currentCategories: number[] = this.jobForm.get('categories')?.value || [];

    if (checked) {
      if (!currentCategories.includes(category.id)) {
        this.jobForm.get('categories')?.setValue([...currentCategories, category.id]);
      }
    } else {
      this.jobForm.get('categories')?.setValue(currentCategories.filter(id => id !== category.id));
    }

    this.triggerFormUpdate();
    console.log('Current selected categories:', this.jobForm.get('categories')?.value);
  }

  isCategorySelected(categoryId: number): boolean {
    const selectedCategories: number[] = this.jobForm.get('categories')?.value || [];
    return selectedCategories.includes(categoryId);
  }

  removeSelectedCategory(categoryId: number): void {
    const currentCategories: number[] = this.jobForm.get('categories')?.value || [];
    this.jobForm.get('categories')?.setValue(currentCategories.filter(id => id !== categoryId));
    this.triggerFormUpdate();
  }

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

  /*------------------------- Submit Form -------------------------*/
  onSubmit() {
    console.log('Form Submitted', this.jobForm.value);
    console.log('Form Valid:', this.jobForm.valid);

    if (this.jobForm.invalid) {
      console.log('Form is invalid');
      this.markFormGroupTouched(this.jobForm);
      this.submitError.set('Please fill in all required fields correctly.');
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);
    this.submitSuccess.set(false);

    // Extract data from form
    const formData = this.jobForm.value;
    
    // Get selected category and skill IDs
    const selectedCategoryIds = this.jobForm.get('categories')?.value || [];
    const selectedSkillIds = this.jobForm.get('skills')?.value || [];

    console.log('Selected Categories IDs:', selectedCategoryIds);
    console.log('Selected Skills IDs:', selectedSkillIds);

    // Prepare data with correct field names
    const jobData: any = {
      title: formData.title,
      description: formData.description,
      salary: formData.salary,
      workplaceType: formData.workplaceType,
      jobType: formData.jobType,
      expireDate: formData.expireDate,
      requirements: formData.requirements || '',
      responsabilities: formData.responsabilities || '',
      benefits: formData.benefits || '',
      experienceLevel: formData.experienceLevel,
      educationLevel: formData.educationLevel,
      minTeamSize: formData.minTeamSize || 1,
      maxTeamSize: formData.maxTeamSize || 10,
      website: formData.website || '',
      isActive: true,
      categoryIds: selectedCategoryIds,
      skillIds: selectedSkillIds
    };

    console.log('Final job data being sent:', jobData);

    this.jobsService.updateJob(this.jobId, jobData).subscribe({
      next: (response) => {
        console.log('Job updated successfully:', response);
        this.submitSuccess.set(true);
        this.isSubmitting.set(false);

        this.showSuccess('Job is under review now , Admin will approve it soon!');
        
        // Redirect after showing success message
        setTimeout(() => {
          this.router.navigate(['/empPostedJobs']);
        }, 2000);
      },
      error: (error) => {
        console.error('Failed to update job:', error);
        this.isSubmitting.set(false);
        
        // Extract error message
        let errorMessage = 'Failed to update job. Please try again.';
        if (error.error) {
          if (typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error.message) {
            errorMessage = error.error.message;
          } else if (error.error.errors) {
            // Handle validation errors
            const validationErrors = Object.values(error.error.errors).flat();
            errorMessage = validationErrors.join(', ');
          }
        }
        
        this.submitError.set(errorMessage);
      }
    });
  }

  /*------------------------- Reset Form -------------------------*/
  onReset() {
    this.jobForm.reset();
    this.initForm();
    this.skillSearchTerm.set('');
    this.categorySearchTerm.set('');
    this.submitError.set(null);
    this.submitSuccess.set(false);
    this.triggerFormUpdate();
    
    // Reload the original job data
    this.loadJobData();
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