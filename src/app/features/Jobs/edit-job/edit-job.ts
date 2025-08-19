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

  // dropdowns
  jobTypes = [
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' }
  ];
  workplaceTypes = [
    { value: 'on-site', label: 'On-site' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' }
  ];
  experienceLevels = [
    { value: 'junior', label: 'Junior' },
    { value: 'mid', label: 'Mid Level' },
    { value: 'senior', label: 'Senior' }
  ];
  educationLevels = [
    { value: 'bachelor', label: 'Bachelor' },
    { value: 'master', label: 'Master' },
    { value: 'phd', label: 'PhD' }
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

      skills: [[]],
      categories: [[]]
    });

    this.jobId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadJobData();
    this.loadSkills();
    this.loadCategories();
  }

  // ---------------- load data ----------------
  loadJobData() {
    this.isLoading.set(true);
    this.jobsService.GetJobDetails(this.jobId).subscribe({
      next: (job: any) => {
        this.jobForm.patchValue(job);
        this.selectedSkills.set(job.skills || []);
        this.selectedCategories.set(job.categories || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.submitError.set('Failed to load job data');
        this.isLoading.set(false);
      }
    });
  }

  loadSkills() {
    this.jobsService.GetAllJobsSkills().subscribe((skills: any[]) => this.skills.set(skills));
  }

  loadCategories() {
    this.jobsService.GetAllJobsCategories().subscribe((categories: any[]) => this.categories.set(categories));
  }

  // ---------------- search/filter ----------------
  filteredSkills = computed(() => {
    const term = this.skillSearchTerm().toLowerCase();
    return this.skills().filter(s => s.skillName.toLowerCase().includes(term));
  });

  filteredCategories = computed(() => {
    const term = this.categorySearchTerm().toLowerCase();
    return this.categories().filter(c => c.categoryName.toLowerCase().includes(term));
  });

  onSkillSearch(term: string) {
    this.skillSearchTerm.set(term);
  }

  clearSkillSearch() {
    this.skillSearchTerm.set('');
  }

  onCategorySearch(term: string) {
    this.categorySearchTerm.set(term);
  }

  clearCategorySearch() {
    this.categorySearchTerm.set('');
  }

  // ---------------- selection ----------------
  isSkillSelected(id: number) {
    return this.selectedSkills().some(s => s.id === id);
  }

  onSkillChange(skill: any, selected: boolean) {
    if (selected) {
      this.selectedSkills.set([...this.selectedSkills(), skill]);
    } else {
      this.selectedSkills.set(this.selectedSkills().filter(s => s.id !== skill.id));
    }
    this.jobForm.get('skills')?.setValue(this.selectedSkills().map(s => s.id));
  }

  removeSelectedSkill(id: number) {
    this.selectedSkills.set(this.selectedSkills().filter(s => s.id !== id));
    this.jobForm.get('skills')?.setValue(this.selectedSkills().map(s => s.id));
  }

  isCategorySelected(id: number) {
    return this.selectedCategories().some(c => c.id === id);
  }

  onCategoryChange(category: any, selected: boolean) {
    if (selected) {
      this.selectedCategories.set([...this.selectedCategories(), category]);
    } else {
      this.selectedCategories.set(this.selectedCategories().filter(c => c.id !== category.id));
    }
    this.jobForm.get('categories')?.setValue(this.selectedCategories().map(c => c.id));
  }

  removeSelectedCategory(id: number) {
    this.selectedCategories.set(this.selectedCategories().filter(c => c.id !== id));
    this.jobForm.get('categories')?.setValue(this.selectedCategories().map(c => c.id));
  }

  // ---------------- submit ----------------
  onSubmit() {
    if (this.jobForm.invalid) return;

    this.isSubmitting.set(true);
    this.submitError.set(null);

    this.jobsService.updateJob(this.jobId, this.jobForm.value).subscribe({
      next: () => {
        this.submitSuccess.set(true);   // ✅ يظهر بس بعد الـ Save
        this.isSubmitting.set(false);
        setTimeout(() => this.router.navigate(['/jobs']), 1500);
      },
      error: () => {
        this.submitError.set('Failed to update job');
        this.isSubmitting.set(false);
      }
    });
  }

  onReset() {
    this.jobForm.reset();
    this.selectedSkills.set([]);
    this.selectedCategories.set([]);
  }
}
