import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { JobsService } from '../jobs-service';
import { IJob } from '../../../shared/models/ijob';
import { ISkill } from '../../../shared/models/iskill';
import { ICategory } from '../../../shared/models/icategory';
import { SnackbarService } from '../../../shared/components/snackbar/snackbar-service';

@Component({
  selector: 'app-add-job',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './add-job.html',
  styleUrl: './add-job.css'
})
export class AddJob implements OnInit {
  jobForm!: FormGroup;
  isSubmitting = false;
  submitSuccess = false;
  skills = signal<ISkill[]>([]);
  categories = signal<ICategory[]>([]);
  
  formUpdated = signal<number>(0);
  skillSearchTerm = signal<string>('');
  categorySearchTerm = signal<string>('');

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

  selectedSkills = computed(() => {
    this.formUpdated();
    const selectedIds: number[] = this.jobForm.get('skills')?.value || [];
    return this.skills().filter(skill => selectedIds.includes(skill.id));
  });

  selectedCategories = computed(() => {
    this.formUpdated();
    const selectedIds: number[] = this.jobForm.get('categories')?.value || [];
    return this.categories().filter(category => selectedIds.includes(category.id));
  });

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

    // ✅ Dynamic stagger animation
    setTimeout(() => {
      const lines = document.querySelectorAll<HTMLElement>('.fade-line');
      lines.forEach((line, index) => {
        line.style.animationDelay = `${index * 0.15}s`;
        line.classList.add('visible');
      });
    }, 600);

  }

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

  getSkills(): void {
    this.jobsService.GetAllJobsSkills().subscribe({
      next: (skills: ISkill[]) => {
        if (Array.isArray(skills)) {
          this.skills.set(skills);
        } else {
          this.skills.set([]);
        }
      },
      error: () => {
        this.showError('Failed to load skills. Please try again.');
      }
    });
  }

  onSkillChange(skill: ISkill, checked: boolean): void {
    const currentSkills: number[] = this.jobForm.get('skills')?.value || [];
    if (checked && !currentSkills.includes(skill.id)) {
      this.jobForm.get('skills')?.setValue([...currentSkills, skill.id]);
    } else if (!checked) {
      this.jobForm.get('skills')?.setValue(currentSkills.filter(id => id !== skill.id));
    }
    this.triggerFormUpdate();
  }

  isSkillSelected(skillId: number): boolean {
    const selectedSkills: number[] = this.jobForm.get('skills')?.value || [];
    return selectedSkills.includes(skillId);
  }

  getCategories(): void {
    this.jobsService.GetAllJobsCategories().subscribe({
      next: (categories: ICategory[]) => {
        if (Array.isArray(categories)) {
          this.categories.set(categories);
        } else {
          this.categories.set([]);
        }
      },
      error: () => {
        this.showError('Failed to load categories. Please try again.');
      }
    });
  }

  onCategoryChange(category: ICategory, checked: boolean): void {
    const currentCategories: number[] = this.jobForm.get('categories')?.value || [];
    if (checked && !currentCategories.includes(category.id)) {
      this.jobForm.get('categories')?.setValue([...currentCategories, category.id]);
    } else if (!checked) {
      this.jobForm.get('categories')?.setValue(currentCategories.filter(id => id !== category.id));
    }
    this.triggerFormUpdate();
  }

  isCategorySelected(categoryId: number): boolean {
    const selectedCategories: number[] = this.jobForm.get('categories')?.value || [];
    return selectedCategories.includes(categoryId);
  }

  private triggerFormUpdate(): void {
    this.formUpdated.update(val => val + 1);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  onSubmit(): void {
    if (this.jobForm.invalid) {
      this.markFormGroupTouched(this.jobForm);
      this.showError('Please fix the errors in the form.');
      return;
    }

    this.isSubmitting = true;
    this.submitSuccess = false;

    const formData = this.jobForm.value;
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

    this.jobsService.createJob(jobData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.submitSuccess = true;
        this.showInfo('Job is under review now, Admin will approve it soon!');
        setTimeout(() => this.router.navigate(['/empDashboard']), 2000);
      },
      error: () => {
        this.isSubmitting = false;
        this.showError('Failed to create job. Please try again.');
      }
    });
  }

  onReset(): void {
    this.jobForm.reset();
    this.initForm();
    this.skillSearchTerm.set('');
    this.categorySearchTerm.set('');
    this.triggerFormUpdate();
  }

  showSuccess(message: string = 'Operation successful!', duration: number = 4000): void {
    this.snackbarService.show({ message, type: 'success', duration });
  }

  showInfo(message: string = 'Information message', duration: number = 5000): void {
    this.snackbarService.show({ message, type: 'info', duration });
  }

  showError(message: string = 'Something went wrong!', duration: number = 5000): void {
    this.snackbarService.show({ message, type: 'error', duration });
  }
}
