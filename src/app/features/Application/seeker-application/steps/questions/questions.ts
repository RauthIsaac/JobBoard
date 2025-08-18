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

  goToPrevious() {
    this.router.navigate([`/seekerApp/${this.appService.getData().jobId}/documents`]);
  }

  saveAndNext(form: NgForm) {
    if (form.valid) {
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