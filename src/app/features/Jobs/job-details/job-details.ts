import { CurrencyPipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-job-details',
  imports: [CurrencyPipe,RouterLink],
  templateUrl: './job-details.html',
  styleUrl: './job-details.css'
})
export class JobDetails {



  isSaved:boolean = false;
  AddToSaved(): void {
    this.isSaved = !this.isSaved;
  }


}
