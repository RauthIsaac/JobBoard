// import { Component, OnInit } from '@angular/core';
// import { ActivatedRoute, Router } from '@angular/router';
// import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { AuthService } from '../auth/auth-service';

// @Component({
//   selector: 'app-verify-email',
//   templateUrl: './verify-email.component.html',
//   styleUrls: ['./verify-email.component.css']
// })
// export class VerifyEmailComponent implements OnInit {
//   verifyForm!: FormGroup;
//   email!: string;

//   constructor(
//     private fb: FormBuilder,
//     private route: ActivatedRoute,
//     private authService: AuthService,
//     private router: Router
//   ) {}

//   ngOnInit() {
//     this.email = this.route.snapshot.queryParamMap.get('email') || '';

//     this.verifyForm = this.fb.group({
//       code: ['', Validators.required]
//     });
//   }

//   onSubmit() {
//     if (this.verifyForm.valid) {
//       this.authService.verifyEmail({
//         email: this.email,
//         code: this.verifyForm.value.code
//       }).subscribe({
//         next: () => {
//           alert('Email verified successfully!');
//           this.router.navigate(['/login']);
//         },
//         error: (err:any) => {
//           alert('Verification failed: ' + err.error.message);
//         }
//       });
//     }
//   }
// }
