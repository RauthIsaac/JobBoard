import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ApplicationService } from '../../../application-service';

@Component({
  selector: 'app-questions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './questions.html',
  styleUrl: './questions.css',
})
export class Questions implements OnInit {
  formData: any = {
    portfolioUrl: '',
    linkedInUrl: '',
    gitHubUrl: ''
  };

  // Validation errors
  validationErrors: any = {};

  // URL validation patterns
  private readonly URL_PATTERNS = {
    general: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    linkedin: /^https:\/\/(www\.)?linkedin\.com\/(in|pub)\/[a-zA-Z0-9\-_%]+\/?$/,
    github: /^https:\/\/(www\.)?github\.com\/[a-zA-Z0-9\-_]+\/?$/
  };

  constructor(
    private appService: ApplicationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load existing data if available
    const existingData = this.appService.getData();
    if (existingData) {
      this.formData = {
        portfolioUrl: existingData.portfolioUrl || '',
        linkedInUrl: existingData.linkedInUrl || '',
        gitHubUrl: existingData.gitHubUrl || ''
      };
    }
  }

  validatePortfolioUrl(): boolean {
    const url = this.formData.portfolioUrl.trim();
    this.validationErrors.portfolioUrl = '';
    
    if (!url) {
      this.validationErrors.portfolioUrl = 'Portfolio URL is required';
      return false;
    }

    if (!this.URL_PATTERNS.general.test(url)) {
      this.validationErrors.portfolioUrl = 'Please enter a valid URL starting with http:// or https://';
      return false;
    }

    if (url.length > 500) {
      this.validationErrors.portfolioUrl = 'URL is too long (maximum 500 characters)';
      return false;
    }

    // Check for common portfolio domains or patterns
    const portfolioDomains = [
      'portfolio', 'behance.net', 'dribbble.com', 'github.io', 'netlify.app', 
      'vercel.app', 'herokuapp.com', 'personal', 'website', 'dev'
    ];
    
    const isPortfolioLike = portfolioDomains.some(domain => 
      url.toLowerCase().includes(domain)
    );
    
    if (!isPortfolioLike) {
      // This is a warning, not an error - still valid but suggestion
      this.validationErrors.portfolioUrlWarning = 'Make sure this URL leads to your professional portfolio or personal website';
    }

    return true;
  }

  validateLinkedInUrl(): boolean {
    const url = this.formData.linkedInUrl.trim();
    this.validationErrors.linkedInUrl = '';
    
    if (!url) {
      this.validationErrors.linkedInUrl = 'LinkedIn URL is required';
      return false;
    }

    if (!this.URL_PATTERNS.general.test(url)) {
      this.validationErrors.linkedInUrl = 'Please enter a valid URL starting with http:// or https://';
      return false;
    }

    if (!this.URL_PATTERNS.linkedin.test(url)) {
      this.validationErrors.linkedInUrl = 'Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/your-profile)';
      return false;
    }

    if (url.length > 500) {
      this.validationErrors.linkedInUrl = 'URL is too long (maximum 500 characters)';
      return false;
    }

    return true;
  }

  validateGitHubUrl(): boolean {
    const url = this.formData.gitHubUrl.trim();
    this.validationErrors.gitHubUrl = '';
    
    if (!url) {
      this.validationErrors.gitHubUrl = 'GitHub URL is required';
      return false;
    }

    if (!this.URL_PATTERNS.general.test(url)) {
      this.validationErrors.gitHubUrl = 'Please enter a valid URL starting with http:// or https://';
      return false;
    }

    if (!this.URL_PATTERNS.github.test(url)) {
      this.validationErrors.gitHubUrl = 'Please enter a valid GitHub profile URL (e.g., https://github.com/your-username)';
      return false;
    }

    if (url.length > 500) {
      this.validationErrors.gitHubUrl = 'URL is too long (maximum 500 characters)';
      return false;
    }

    return true;
  }

  // Field-level validation on blur
  onFieldBlur(fieldName: string): void {
    switch(fieldName) {
      case 'portfolioUrl':
        this.validatePortfolioUrl();
        break;
      case 'linkedInUrl':
        this.validateLinkedInUrl();
        break;
      case 'gitHubUrl':
        this.validateGitHubUrl();
        break;
    }
  }

  // Real-time URL formatting and validation
  onUrlInput(fieldName: string, event: any): void {
    let value = event.target.value.trim();
    
    // Auto-add https:// if missing
    if (value && !value.match(/^https?:\/\//)) {
      value = 'https://' + value;
      this.formData[fieldName] = value;
    }

    // Clear previous warning when user is typing
    if (fieldName === 'portfolioUrl') {
      this.validationErrors.portfolioUrlWarning = '';
    }
  }

  // URL accessibility check (basic)
  async checkUrlAccessibility(url: string): Promise<boolean> {
    try {
      // This is a basic check - in a real application you might want to use a service
      // For now, we'll just validate the format
      return this.URL_PATTERNS.general.test(url);
    } catch {
      return false;
    }
  }

  // Get URL preview/domain
  getUrlDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return '';
    }
  }

  // Validate all fields
  validateAllFields(): boolean {
    const validations = [
      this.validatePortfolioUrl(),
      this.validateLinkedInUrl(),
      this.validateGitHubUrl()
    ];
    
    return validations.every(isValid => isValid);
  }

  // Auto-fill suggestions
  suggestLinkedInUrl(): void {
    if (!this.formData.linkedInUrl) {
      this.formData.linkedInUrl = 'https://linkedin.com/in/your-profile-name';
      setTimeout(() => {
        const input = document.querySelector('input[name="linkedInUrl"]') as HTMLInputElement;
        if (input) {
          input.select();
        }
      }, 100);
    }
  }

  suggestGitHubUrl(): void {
    if (!this.formData.gitHubUrl) {
      this.formData.gitHubUrl = 'https://github.com/your-username';
      setTimeout(() => {
        const input = document.querySelector('input[name="gitHubUrl"]') as HTMLInputElement;
        if (input) {
          input.select();
        }
      }, 100);
    }
  }

  goToPrevious() {
    this.router.navigate([`/seekerApp/${this.appService.getData().jobId}/documents`]);
  }

  // Helper method for template to check if form has validation errors (excluding warnings)
  hasValidationErrors(): boolean {
    return Object.keys(this.validationErrors).some(key => 
      key !== 'portfolioUrlWarning' && this.validationErrors[key]
    );
  }

  saveAndNext(form: NgForm) {
    // Trim all URLs
    this.formData.portfolioUrl = this.formData.portfolioUrl.trim();
    this.formData.linkedInUrl = this.formData.linkedInUrl.trim();
    this.formData.gitHubUrl = this.formData.gitHubUrl.trim();

    if (this.validateAllFields() && form.valid) {
      this.appService.setData(this.formData);
      this.router.navigate([`/seekerApp/${this.appService.getData().jobId}/review`]);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(form.controls).forEach(key => {
        form.controls[key].markAsTouched();
      });
    }
  }
}