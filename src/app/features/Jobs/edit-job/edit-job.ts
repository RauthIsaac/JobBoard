import { Component, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { JobsService } from '../jobs-service';

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
  skills = signal<any[]>([]);
  categories = signal<any[]>([]);
  selectedSkills = signal<any[]>([]);
  selectedCategories = signal<any[]>([]);
  skillSearchTerm = signal('');
  categorySearchTerm = signal('');

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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.jobForm = this.fb.group({
      title: ['', Validators.required],
      salary: ['', Validators.required],
      jobType: ['', Validators.required],
      workplaceType: ['', Validators.required],
      expireDate: ['', Validators.required],
      description: ['', Validators.required],

      // extra fields
      requirements: [''],
      responsabilities: [''],
      benefits: [''],
      experienceLevel: ['', Validators.required],
      educationLevel: ['', Validators.required],

      // Fix: Use correct property names that match the DTO
      skillIds: [[]],
      categoryIds: [[]]
    });

    this.jobId = Number(this.route.snapshot.paramMap.get('id'));
    
    if (!this.jobId || this.jobId <= 0) {
      this.submitError.set('Invalid job ID');
      this.router.navigate(['/jobs']);
      return;
    }

    this.loadSkills();
    this.loadCategories();
    this.loadJobData();
  }

  // ---------------- load data ----------------
  loadJobData() {
    this.isLoading.set(true);
    this.submitError.set(null);
    
    this.jobsService.GetJobDetails(this.jobId).subscribe({
      next: (job: any) => {
        // Format the date for HTML date input
        if (job.expireDate) {
          job.expireDate = new Date(job.expireDate).toISOString().split('T')[0];
        }

        // Patch the form with job data
        this.jobForm.patchValue({
          title: job.title || '',
          salary: job.salary || '',
          jobType: job.jobType || '',
          workplaceType: job.workplaceType || '',
          expireDate: job.expireDate || '',
          description: job.description || '',
          requirements: job.requirements || '',
          responsabilities: job.responsabilities || '',
          benefits: job.benefits || '',
          experienceLevel: job.experienceLevel || '',
          educationLevel: job.educationLevel || '',
          skillIds: job.skills ? job.skills.map((s: any) => s.id) : [],
          categoryIds: job.categories ? job.categories.map((c: any) => c.id) : []
        });

        // Set selected items for UI display
        this.selectedSkills.set(job.skills || []);
        this.selectedCategories.set(job.categories || []);
        
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load job data:', error);
        this.submitError.set('Failed to load job data. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  loadSkills() {
    this.jobsService.GetAllJobsSkills().subscribe({
      next: (skills: any[]) => {
        this.skills.set(skills || []);
      },
      error: (error) => {
        console.error('Failed to load skills:', error);
      }
    });
  }

  loadCategories() {
    this.jobsService.GetAllJobsCategories().subscribe({
      next: (categories: any[]) => {
        this.categories.set(categories || []);
      },
      error: (error) => {
        console.error('Failed to load categories:', error);
      }
    });
  }

  // ---------------- search/filter ----------------
  filteredSkills = computed(() => {
    const term = this.skillSearchTerm().toLowerCase();
    return this.skills().filter(s => s.skillName && s.skillName.toLowerCase().includes(term));
  });

  filteredCategories = computed(() => {
    const term = this.categorySearchTerm().toLowerCase();
    return this.categories().filter(c => c.categoryName && c.categoryName.toLowerCase().includes(term));
  });

  onSkillSearch(term: string) {
    this.skillSearchTerm.set(term || '');
  }

  clearSkillSearch() {
    this.skillSearchTerm.set('');
  }

  onCategorySearch(term: string) {
    this.categorySearchTerm.set(term || '');
  }

  clearCategorySearch() {
    this.categorySearchTerm.set('');
  }

  // ---------------- selection ----------------
  isSkillSelected(id: number): boolean {
    return this.selectedSkills().some(s => s.id === id);
  }

  onSkillChange(skill: any, selected: boolean) {
    let currentSelected = this.selectedSkills();
    
    if (selected) {
      // Add skill if not already selected
      if (!currentSelected.some(s => s.id === skill.id)) {
        currentSelected = [...currentSelected, skill];
      }
    } else {
      // Remove skill
      currentSelected = currentSelected.filter(s => s.id !== skill.id);
    }
    
    this.selectedSkills.set(currentSelected);
    this.jobForm.get('skillIds')?.setValue(currentSelected.map(s => s.id));
  }

  removeSelectedSkill(id: number) {
    const updated = this.selectedSkills().filter(s => s.id !== id);
    this.selectedSkills.set(updated);
    this.jobForm.get('skillIds')?.setValue(updated.map(s => s.id));
  }

  isCategorySelected(id: number): boolean {
    return this.selectedCategories().some(c => c.id === id);
  }

  onCategoryChange(category: any, selected: boolean) {
    let currentSelected = this.selectedCategories();
    
    if (selected) {
      // Add category if not already selected
      if (!currentSelected.some(c => c.id === category.id)) {
        currentSelected = [...currentSelected, category];
      }
    } else {
      // Remove category
      currentSelected = currentSelected.filter(c => c.id !== category.id);
    }
    
    this.selectedCategories.set(currentSelected);
    this.jobForm.get('categoryIds')?.setValue(currentSelected.map(c => c.id));
  }

  removeSelectedCategory(id: number) {
    const updated = this.selectedCategories().filter(c => c.id !== id);
    this.selectedCategories.set(updated);
    this.jobForm.get('categoryIds')?.setValue(updated.map(c => c.id));
  }

  // ---------------- submit ----------------
  onSubmit() {
    if (this.jobForm.invalid) {
      this.markFormGroupTouched(this.jobForm);
      this.submitError.set('Please fill in all required fields correctly.');
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);
    this.submitSuccess.set(false);

    const formData = { ...this.jobForm.value };

    // Ensure arrays are not null
    formData.skillIds = formData.skillIds || [];
    formData.categoryIds = formData.categoryIds || [];

    console.log('Submitting job data:', formData);

    this.jobsService.updateJob(this.jobId, formData).subscribe({
      next: (response) => {
        console.log('Job updated successfully:', response);
        this.submitSuccess.set(true);
        this.isSubmitting.set(false);
        
        // Redirect after showing success message
        setTimeout(() => {
          this.router.navigate(['/jobs']);
        }, 1500);
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

  onReset() {
    this.jobForm.reset();
    this.selectedSkills.set([]);
    this.selectedCategories.set([]);
    this.skillSearchTerm.set('');
    this.categorySearchTerm.set('');
    this.submitError.set(null);
    this.submitSuccess.set(false);
    
    // Reload the original job data
    this.loadJobData();
  }

  // Helper method to mark all fields as touched for validation display
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}