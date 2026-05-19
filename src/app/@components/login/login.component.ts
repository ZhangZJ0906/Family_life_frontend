import { AuthService } from './../../@services/auth.service';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  email = '123@example.com';
  password = '123';
  errorMessage = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}


  signIn() {
    const success = this.authService.login(this.email, this.password);

    if (!success) {
      this.errorMessage = 'Email 或密碼不正確';
      return;
    }

    this.errorMessage = '';
    this.router.navigate(['/shopping-list']);
  }


}
