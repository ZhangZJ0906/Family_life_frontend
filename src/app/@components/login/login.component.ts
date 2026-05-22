import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { User } from '../../@models/user.model';
import { AuthService } from '../../@services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  signIn(): void {
    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        if (res.code !== 200) {
          this.errorMessage = 'Email 或密碼不正確';
          return;
        }

        // console.log("id0001: " + res.userId)

        this.authService.setCurrentUser(this.buildLoginUser(res));
        localStorage.setItem('isLogin', 'true');
        this.router.navigate(['/home-page']);// 👉 登入成功後導向的頁面，可以自己改路徑。
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Email 或密碼不正確';
      }
    });
  }

  //** 後端回傳的 user 物件結構不太一致，這裡做一次轉換 */
  private buildLoginUser(res: any): User {
    const user = res?? {};

    return {
      user_id: user.user_id ?? user.userId ?? 0,
      name: user.name ?? user.userName ?? this.email,
      email: user.email ?? this.email,
      password: '',
      avatar: user.avatar ?? '',
      is_notify_by_enddate: user.is_notify_by_enddate?? true,
      is_notify_by_email: user.is_notify_by_email?? true,
      created_at: user.created_at ?? '',
      updated_at: user.updated_at ?? ''
    };
  }
}
