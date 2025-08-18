import { NgClass } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-app-view',
  imports: [NgClass],
  templateUrl: './app-view.html',
  styleUrl: './app-view.css'
})
export class AppView {


  isOpen: boolean = false;


  toggleCoverLetter() {
    this.isOpen = !this.isOpen;
  }

}
