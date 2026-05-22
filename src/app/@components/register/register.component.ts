import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../@services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  name = '';
  email = '';
  password = '';
  avatar = '';
  is_notify: boolean = true;

  register(): void {
    if (!this.email || !this.name || !this.password ) {
      alert('請完整填寫 姓名、Email、密碼');
      return;
    }

    if (this.password.length < 6) {
      alert('密碼至少需要 6 個字元');
      return;
    }

    this.authService.register({
      userName: this.name,
      email: this.email,
      pwd: this.password,
      avatar: this.avatar ?? '',
      notify: this.is_notify ?? true
    }).subscribe({
      next: (res) => {
        console.log('register response:', res);

        if (res.code === 200) {
          alert('註冊成功');
          this.router.navigate(['/login']);
          return;
        }
        alert(res.message ?? '註冊失敗');
      },
      error: (err) => {
      console.error(err);

      if (err.error?.message === 'PASSWORD_ERROR') {
        alert('密碼格式不正確，請至少輸入 6 個字元');
        return;
      }

      alert(err.error?.message ?? '註冊失敗');
    }
    });
  }


}
