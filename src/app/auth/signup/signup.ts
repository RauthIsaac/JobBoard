import { AuthService } from './../auth-service';
import { Component } from '@angular/core';
import { ReactiveFormsModule,FormGroup,Validators,AbstractControl,FormBuilder,FormsModule} from '@angular/forms';
import { MaterialModule } from '../../shared/material.module';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    FormsModule,
    RouterModule,
    MatRadioModule,
  ],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup {
  signupForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private AuthService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.signupForm = this.fb.group(
      {
        userName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', Validators.required],
        confirmPassword: ['', Validators.required],
        user_type: ['Seeker'], // Default: Seeker
        companyName: [''],
        companyLocation: ['']
      },
      { validators: this.passwordMatchValidator }
    );

    this.signupForm.get('user_type')?.valueChanges.subscribe((value) => {
      this.updateCompanyValidators(value);
    });
  }

  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }

    return null;
  }

  updateCompanyValidators(userType: string) {
    const companyName = this.signupForm.get('companyName');
    const companyLocation = this.signupForm.get('companyLocation');

    if (userType === 'Employer') {
      companyName?.setValidators(Validators.required);
      companyLocation?.setValidators(Validators.required);
    } else {
      companyName?.clearValidators();
      companyLocation?.clearValidators();
      companyName?.setValue('');
      companyLocation?.setValue('');
    }

    companyName?.updateValueAndValidity();
    companyLocation?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.signupForm.valid) {
      let payload = { ...this.signupForm.value };
      
      if (payload.user_type === 'Seeker') {
        delete payload.companyName;
        delete payload.companyLocation;
      }
      
      console.log('Payload sent to API:', payload);
    
      this.AuthService.register(payload).subscribe({
        next: (res) => {
          console.log('Registration success!', res);
          this.snackBar.open(`Registration successful!, ${res?.message}`, 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        },
        error: (err) => {
          console.error('Registration failed', err);
          this.snackBar.open(`Registration failed!, ${err?.message}`, 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
            
        const errorMsg = err?.error?.message || err?.message || '';
        const message = errorMsg.toLowerCase();
            
        if (message.includes('username') || message.includes('user')) {
          this.signupForm.get('userName')?.setErrors({ notUnique: true });
          this.signupForm.get('userName')?.markAsTouched();
        }
      
        if (message.includes('email')) {
          this.signupForm.get('email')?.setErrors({ notUnique: true });
          this.signupForm.get('email')?.markAsTouched();
        }
      }
      });
    } else {
      this.signupForm.markAllAsTouched();
    }
  }

}
