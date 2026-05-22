import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';


import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

import { HttpClientService } from './@services/http-client.service';


export const appConfig: ApplicationConfig = {
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideHttpClient()]
=======
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes),provideHttpClient()]

>>>>>>> origin/feature-calendar
=======
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideHttpClient()]
>>>>>>> 2dcfdd2922ed702026575f2e79bf3d3a598e4c93
=======


  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes),provideHttpClient(), HttpClientService],





>>>>>>> main
};

