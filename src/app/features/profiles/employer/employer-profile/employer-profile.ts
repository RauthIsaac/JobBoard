import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

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


}
