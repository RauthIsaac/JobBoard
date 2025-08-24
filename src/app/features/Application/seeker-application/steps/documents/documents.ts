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
  coverLetterError: string = '';
  
  // File validation constants
  readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
  readonly ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  readonly ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx'];

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
    
    if (!file) {
      this.selectedFile = null;
      return;
    }

    // Validate file type by MIME type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      this.fileError = 'Please upload a PDF or Word document only. Accepted formats: PDF, DOC, DOCX';
      this.selectedFile = null;
      this.clearFileInput(event.target);
      return;
    }

    // Validate file extension as backup
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !this.ALLOWED_EXTENSIONS.includes(fileExtension)) {
      this.fileError = 'Invalid file extension. Please upload files with .pdf, .doc, or .docx extensions only.';
      this.selectedFile = null;
      this.clearFileInput(event.target);
      return;
    }

    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      this.fileError = `File size (${fileSizeMB}MB) exceeds the 5MB limit. Please choose a smaller file.`;
      this.selectedFile = null;
      this.clearFileInput(event.target);
      return;
    }

    // Validate file name
    if (file.name.length > 255) {
      this.fileError = 'File name is too long. Please rename your file to be shorter than 255 characters.';
      this.selectedFile = null;
      this.clearFileInput(event.target);
      return;
    }

    // Check for special characters in filename that might cause issues
    if (!/^[\w\-. ]+$/.test(file.name.replace(/\.(pdf|doc|docx)$/i, ''))) {
      this.fileError = 'File name contains invalid characters. Please use only letters, numbers, spaces, hyphens, and periods.';
      this.selectedFile = null;
      this.clearFileInput(event.target);
      return;
    }

    // Additional validation for empty files
    if (file.size === 0) {
      this.fileError = 'The selected file appears to be empty. Please choose a valid document.';
      this.selectedFile = null;
      this.clearFileInput(event.target);
      return;
    }

    // File passed all validations
    this.selectedFile = file;
    this.fileError = '';
  }

  private clearFileInput(input: HTMLInputElement): void {
    input.value = '';
  }

  validateCoverLetter(): boolean {
    this.coverLetterError = '';
    
    if (this.coverLetter && this.coverLetter.trim()) {
      const trimmedLetter = this.coverLetter.trim();
      
      if (trimmedLetter.length < 50) {
        this.coverLetterError = 'Cover letter should be at least 50 characters long to be meaningful.';
        return false;
      }
      
      if (trimmedLetter.length > 2000) {
        this.coverLetterError = 'Cover letter is too long. Please keep it under 2000 characters.';
        return false;
      }

      // Check for minimum word count
      const wordCount = trimmedLetter.split(/\s+/).length;
      if (wordCount < 10) {
        this.coverLetterError = 'Cover letter should contain at least 10 words.';
        return false;
      }
    }
    
    return true;
  }

  onCoverLetterChange(): void {
    this.validateCoverLetter();
  }

  getFileTypeIcon(file: File): string {
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'fas fa-file-pdf text-danger';
      case 'doc':
      case 'docx':
        return 'fas fa-file-word text-primary';
      default:
        return 'fas fa-file';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  removeFile(): void {
    this.selectedFile = null;
    this.fileError = '';
    // Clear the file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  goToPrevious() {
    this.router.navigate([`/seekerApp/${this.appService.getData().jobId}/personal-info`]);
  }

  saveAndNext(form: NgForm) {
    // Validate cover letter if provided
    const isCoverLetterValid = this.validateCoverLetter();
    
    // Check if file is selected (required)
    if (!this.selectedFile) {
      this.fileError = 'Please select a resume file. This field is required.';
      return;
    }

    // Check for any file errors
    if (this.fileError) {
      return;
    }

    // Check cover letter validation
    if (!isCoverLetterValid) {
      return;
    }

    // All validations passed
    this.appService.setData({
      cvFile: this.selectedFile,
      coverLetter: this.coverLetter.trim()
    });
    
    this.router.navigate([`/seekerApp/${this.appService.getData().jobId}/questions`]);
  }

  // Drag and drop functionality
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      // Create a mock event object for the existing onFileSelected method
      const mockEvent = {
        target: {
          files: files
        }
      };
      this.onFileSelected(mockEvent);
    }
  }
}