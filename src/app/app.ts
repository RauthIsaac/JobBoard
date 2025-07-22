import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from "./shared/navbar/navbar";
import { Home } from "./features/Home/home/home";
import { Footer } from "./shared/footer/footer";


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'JobBoard';
}
