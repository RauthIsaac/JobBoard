import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { JobsService } from '../../../Jobs/jobs-service';
import { IJob } from '../../../../shared/models/ijob';
import { ISkill } from '../../../../shared/models/iskill';
import { ICategory } from '../../../../shared/models/icategory';

@Component({
  selector: 'app-add-job',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule,NgIf,NgIf],
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

  
  newSkill = '';
  newCategory = '';
  nextSkillId = 11;
  nextCategoryId = 6;

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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.getSkills();
    this.getCategories();
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
      requirements: ['', Validators.required],
      minTeamSize: [1, [Validators.required, Validators.min(1)]],
      maxTeamSize: [10, [Validators.required, Validators.min(1)]],
      educationLevel: ['', Validators.required],
      experienceLevel: ['', Validators.required],
      website: ['', [Validators.pattern('(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?')]],
      responsabilities: ['', [Validators.required, Validators.minLength(50)]],
      benefits: ['', [Validators.required, Validators.minLength(50)]],
      categories: [[]],
      skills: [[]],
    });
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

    console.log('Current selected skills:', this.jobForm.get('skills')?.value);
  }

  isSkillSelected(skillId: number): boolean {
    const selectedSkills: number[] = this.jobForm.get('skills')?.value || [];
    return selectedSkills.includes(skillId);
  }

  // Add a new custom skill
  addNewSkill(): void {

    if (this.newSkill.trim() === '') return;

    // Split by commas to allow adding multiple skills at once
    const skillsToAdd = this.newSkill.split(',').map(s => s.trim()).filter(s => s !== '');

    for (const skillName of skillsToAdd) {
      const existingSkill = this.skills().find(s => 
        s.skillName.toLowerCase() === skillName.toLowerCase()
      );

      if (existingSkill) {
        if (!this.isSkillSelected(existingSkill.id)) {
          this.onSkillChange(existingSkill, true);
        }
      } else {
        const newSkillObj: ISkill = {
          id: this.nextSkillId++,
          skillName: skillName,
        };
        this.skills.update(skills => [...skills, newSkillObj]);
        this.onSkillChange(newSkillObj, true);
      }
    }

    this.newSkill = '';
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

    console.log('Current selected categories:', this.jobForm.get('categories')?.value);

  }

  isCategorySelected(categoryId: number): boolean {
    const selectedCategories: number[] = this.jobForm.get('categories')?.value || [];
    return selectedCategories.includes(categoryId);
  }

  // Add a new custom category
  addNewCategory(): void {
    if (this.newCategory.trim() === '') return;

    const categoriesToAdd = this.newCategory.split(',')
      .map(c => c.trim())
      .filter(c => c !== '');

    for (const categoryName of categoriesToAdd) {
      const existingCategory = this.categories().find(c => 
        c.categoryName.toLowerCase() === categoryName.toLowerCase()
      );

      if (existingCategory) {
        if (!this.isCategorySelected(existingCategory.id)) {
          this.onCategoryChange(existingCategory, true);
        }
      } else {
        const newCategoryObj: ICategory = {
          id: this.nextCategoryId++,
          categoryName: categoryName,
        };

        this.categories.update(cats => [...cats, newCategoryObj]);
        this.onCategoryChange(newCategoryObj, true);
      }
    }

    this.newCategory = '';
  }

  //#endregion
 

  
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
        // Navigate to job details page or employer profile
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 2000);
      },
      error: (error:any) => {

        this.isSubmitting = false;
        this.submitError = 'Failed to create job. Please try again.';
        console.error('Error creating job:', error);
      }
    });
  }

  /*------------------------- Reset Form -------------------------*/
  onReset(): void {
    this.jobForm.reset();
    this.initForm();
  }



}  


