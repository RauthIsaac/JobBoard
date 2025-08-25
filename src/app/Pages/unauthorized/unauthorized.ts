import { CommonModule } from '@angular/common';
import { Component} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth-service';


@Component({
  selector: 'app-unauthorized',
  imports: [RouterLink, CommonModule],
  templateUrl: './unauthorized.html',
  styleUrl: './unauthorized.css'
})
export class Unauthorized{

  constructor(private authService: AuthService){}

  isSeeker():boolean{
    return this.authService.isSeeker();
  }

  isEmployer():boolean{
    return this.authService.isEmployer();
  }
  
}
