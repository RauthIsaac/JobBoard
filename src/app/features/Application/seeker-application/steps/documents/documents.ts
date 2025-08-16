import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationService } from '../../../application-service';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './documents.html',
  styleUrl: './documents.css'
})
export class Documents implements OnInit {
  coverLetter: string = '';
  selectedFile: File | null = null;
  fileError: string = '';

  constructor(private appService: ApplicationService, private router: Router) {}

  ngOnInit(): void {
    // Load existing data if available
    const existingData = this.appService.getData();
    if (existingData) {
      this.coverLetter = existingData.coverLetter || '';
      this.selectedFile = existingData.cvFile || null;
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    this.fileError = '';
    
    if (file) {
      // Check file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        this.fileError = 'Please upload a PDF or Word document only.';
        this.selectedFile = null;
        return;
      }
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        this.fileError = 'File size must be less than 5MB.';
        this.selectedFile = null;
        return;
      }
      
      this.selectedFile = file;
    }
  }

  goToPrevious() {
    this.router.navigate([`/seekerApp/${this.appService.getData().jobId}/personal-info`]);
  }

  saveAndNext(form: NgForm) {
    if (this.selectedFile) {
      this.appService.setData({
        cvFile: this.selectedFile,
        coverLetter: this.coverLetter
      });
      this.router.navigate([`/seekerApp/${this.appService.getData().jobId}/questions`]);
    } else {
      this.fileError = 'Please select a resume file.';
    }
  }
}