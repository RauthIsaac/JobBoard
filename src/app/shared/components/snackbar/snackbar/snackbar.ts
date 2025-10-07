import { Component, OnInit, OnDestroy, EventEmitter, Output, ChangeDetectorRef } from '@angular/core';
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
  @Output() actionClicked = new EventEmitter<void>();
  private snackbarSubscription: Subscription = new Subscription();
  private timeoutId: any;

  constructor(
    private snackbarService: SnackbarService,
    private cdr: ChangeDetectorRef
  ) {}

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
    
    setTimeout(() => {
      this.show = true;
      this.cdr.detectChanges(); 

      if (this.duration > 0) {
        this.timeoutId = setTimeout(() => {
          this.hideSnackbar();
        }, this.duration);
      }
    }, 0);
  }

  hideSnackbar(): void {
    this.show = false;
    this.cdr.detectChanges();
  }

  onActionClick(): void {
    this.actionClicked.emit();
    this.hideSnackbar();
  }

  ngOnDestroy(): void {
    this.snackbarSubscription.unsubscribe();
    clearTimeout(this.timeoutId);
  }
}