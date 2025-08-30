// snackbar.service.ts
import { Injectable, TemplateRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface SnackbarConfig {
  message?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: string;
  template?: TemplateRef<any>;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {
  private snackbarSubject = new BehaviorSubject<SnackbarConfig | null>(null);
  public snackbarState = this.snackbarSubject.asObservable();

  show(config: SnackbarConfig): void {
    this.snackbarSubject.next({
      type: 'info',
      duration: 3000,
      ...config
    });
  }

  hide(): void {
    this.snackbarSubject.next(null);
  }
}