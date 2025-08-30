import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Snackbar } from "./shared/components/snackbar/snackbar/snackbar";



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Snackbar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  
}
