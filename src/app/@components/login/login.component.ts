import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { User } from '../../@models/user.model';
import { AuthService } from '../../@services/auth.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  imports: [FormsModule,
            RouterLink,
            MatIconModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';
  showPassword: boolean = false;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  signIn(): void {
    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        if (res.code !== 200) {
          this.errorMessage = 'Email 或密碼不正確';
          return;
        }
        const payload = {
          user_id: res.userId,
          name: res.name,
          email: res.email,
          password: '',
          avatar: res.avatar ?? '',
          notifyByEndDate: res.notifyByEndDate ?? true,
          notifyByEmail: res.notifyByEmail ?? true,
          // created_at: res.created_at ??  '',
          // updated_at: res.updated_at ?? '',
        };
        this.authService.setCurrentUser(payload);
        sessionStorage.setItem('isLogin', 'true');
        this.router.navigate(['/home-page']); // 👉 登入成功後導向的頁面，可以自己改路徑。
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Email 或密碼不正確';
      },
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}
