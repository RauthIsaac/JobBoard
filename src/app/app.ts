import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from "./shared/navbar/navbar";
import { Home } from "./Pages/blank-layout/home/home";
import { About } from "./Pages/blank-layout/about/about";
import { Contact } from "./Pages/blank-layout/contact/contact";
import { Footer } from "./shared/footer/footer";


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Home, About, Contact, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'JobBoard';
}
