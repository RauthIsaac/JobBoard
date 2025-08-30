// snackbar.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SnackbarConfig, SnackbarService } from '../snackbar-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-snackbar',
  imports: [CommonModule],
  templateUrl: './snackbar.html',
  styleUrls: ['./snackbar.css']
})
export class Snackbar implements OnInit, OnDestroy {
  show = false;
  message: string = '';
  type: string = 'info';
  duration: number = 3000;
  action?: string;
  private snackbarSubscription: Subscription = new Subscription();
  private timeoutId: any;

  constructor(private snackbarService: SnackbarService) {}

  ngOnInit(): void {
    this.snackbarSubscription = this.snackbarService.snackbarState.subscribe(
      (config: SnackbarConfig | null) => {
        if (config) {
          this.showSnackbar(config);
        } else {
          this.hideSnackbar();
        }
      }
    );
  }

  showSnackbar(config: SnackbarConfig): void {
    clearTimeout(this.timeoutId);
    
    this.message = config.message || '';
    this.type = config.type || 'info';
    this.duration = config.duration || 3000;
    this.action = config.action;

    this.show = true;

    if (this.duration > 0) {
      this.timeoutId = setTimeout(() => {
        this.hideSnackbar();
      }, this.duration);
    }
  }

  hideSnackbar(): void {
    this.show = false;
  }


  ngOnDestroy(): void {
    this.snackbarSubscription.unsubscribe();
    clearTimeout(this.timeoutId);
  }
}