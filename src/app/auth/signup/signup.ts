import { Component } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, FormBuilder, FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material.module';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, FormsModule, RouterModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup {
 signupForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  

  constructor(
  private fb: FormBuilder,
  private router: Router
) {
  this.signupForm = this.fb.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    confirmPassword: ['', Validators.required]
  }, { validator: this.passwordMatchValidator });
}

  //validator ensure passwords match
  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }

    return null;
  }

  onSubmit() {
  if (this.signupForm.valid) {
    console.log("Form submitted!", this.signupForm.value);

    this.router.navigate(['/home']);
  } else {
    this.signupForm.markAllAsTouched();
  }
}

}
