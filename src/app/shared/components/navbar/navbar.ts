import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
// import { RouterOutlet } from "../../../../node_modules/@angular/router/router_module.d";
import { RouterOutlet } from '@angular/router';
import { Footer } from "../footer/footer";

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Footer],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {

}
