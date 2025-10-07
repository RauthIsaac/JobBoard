import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface SnackbarConfig {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {
  private snackbarSubject = new BehaviorSubject<SnackbarConfig | null>(null);
  snackbarState = this.snackbarSubject.asObservable();

  constructor(private zone: NgZone) {}

  show(config: SnackbarConfig): void {
    this.zone.run(() => {
      this.snackbarSubject.next(config);
    });
  }

  hide(): void {
    this.zone.run(() => {
      this.snackbarSubject.next(null);
    });
  }
}