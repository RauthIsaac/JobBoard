import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from "./shared/navbar/navbar";
import { Home } from "./features/Home/home/home";
import { Home } from "./features/Home/home/home";
import { Footer } from "./shared/footer/footer";


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Home, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'JobBoard';
}
