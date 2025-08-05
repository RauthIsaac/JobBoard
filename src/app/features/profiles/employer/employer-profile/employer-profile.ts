import { Component, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProfilesService } from '../../profiles-service';

@Component({
  selector: 'app-employer-profile',
  imports: [RouterLink],
  templateUrl: './employer-profile.html',
  styleUrl: './employer-profile.css'
})
export class EmployerProfile {

  // Get their values from the API
  imagePath:string = "/empImage.png";
  logoPath:string = "/favicon.ico";



  constructor() {}
 


}
