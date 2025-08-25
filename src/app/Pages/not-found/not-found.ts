import { Component, OnInit, signal } from '@angular/core';
import { AuthService } from '../../auth/auth-service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [CommonModule, RouterLink],
  templateUrl: './not-found.html',
  styleUrl: './not-found.css'
})
export class NotFound implements OnInit{

  userType :string | null = null;

  constructor(private authService:AuthService){}
  
  ngOnInit(): void {
    this.userType = this.getUserType();
  }
  

  getUserType(): string|null{
    return this.authService.getUserType();
  }


  isSeeker():boolean{
    return this.userType==='Seeker';
  }

  isEmployer():boolean{
    return this.userType==='Employer';
  }

  isAdmin():boolean{
    return this.userType==='Admin';
  }

}
