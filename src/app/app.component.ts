import { Component, inject } from '@angular/core';
import {  RouterOutlet } from '@angular/router';
import { AuthService } from './@services/auth.service';

@Component({
  selector: 'app-root',
  imports: [ RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;
  readonly isLoggedIn = this.authService.isLoggedIn;

  logout(): void {
    this.authService.logout();
  }
}
