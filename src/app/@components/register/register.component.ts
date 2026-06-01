import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../@services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  imports: [CommonModule,
            FormsModule,
            RouterLink,
            MatIconModule,
            MatButtonModule,
            MatFormFieldModule,
            MatInputModule],
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
  confirmPassword = '';
  avatar = '';
  is_notify: boolean = true;

  get passwordError(): string {
    if (!this.password) {
      return '';
    }

    if (this.password.length < 6) {
      return '密碼至少需要 6 個字元';
    }

    return '';
  }

  get confirmPasswordError(): string {
    if (!this.confirmPassword) {
      return '';
    }

    if (this.password !== this.confirmPassword) {
      return '兩次輸入的密碼不一致';
    }

    return '';
  }

  register(): void {
    if (!this.email || !this.name || !this.password || !this.confirmPassword) {
      alert('請完整填寫 姓名、Email、密碼、確認密碼');
      return;
    }

    if (this.passwordError) {
      alert(this.passwordError);
      return;
    }

    if (this.password !== this.confirmPassword) {
      alert('兩次輸入的密碼不一致');
      return;
    }

    this.authService.register({
      userName: this.name,
      email: this.email,
      pwd: this.password,
      avatar: this.avatar ?? '',
      // notify: this.is_notify ?? true
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
