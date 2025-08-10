import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';

import { routes } from './app.routes';
<<<<<<< HEAD
import { provideHttpClient, withInterceptors } from '@angular/common/http';
=======
import { provideHttpClient } from '@angular/common/http';
>>>>>>> main

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
<<<<<<< HEAD
    provideHttpClient(
      withInterceptors([]) 
    ),
    provideRouter(routes)
=======
    provideRouter(routes),
    provideHttpClient()
>>>>>>> main
  ]
};
