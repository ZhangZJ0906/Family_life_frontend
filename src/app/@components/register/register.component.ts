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
      Swal.fire({
        icon: 'warning',
        title: '資料未填完整',
        text: '請完整填寫姓名、Email、密碼、確認密碼',
        confirmButtonText: '確認',
      });
      return;
    }

    if (this.passwordError) {
      Swal.fire({
        icon: 'warning',
        title: '密碼格式不正確',
        text: this.passwordError,
        confirmButtonText: '確認',
      });
      return;
    }

    if (this.password !== this.confirmPassword) {
      Swal.fire({
        icon: 'warning',
        title: '確認密碼錯誤',
        text: '兩次輸入的密碼不一致',
        confirmButtonText: '確認',
      });
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
          Swal.fire({
            icon: 'success',
            title: '註冊成功',
            text: '請使用新帳號登入',
            timer: 1200,
            showConfirmButton: false,
          }).then(() => {
            this.router.navigate(['/login']);
          });
          return;
        }

        Swal.fire({
          icon: 'error',
          title: '註冊失敗',
          text: res.message ?? '請稍後再試',
          confirmButtonText: '確認',
        });
      },
      error: (err) => {
      console.error(err);

      if (err.error?.message === 'PASSWORD_ERROR') {
        Swal.fire({
          icon: 'warning',
          title: '密碼格式不正確',
          text: '請至少輸入 6 個字元',
          confirmButtonText: '確認',
        });
        return;
      }

      Swal.fire({
        icon: 'error',
        title: '註冊失敗',
        text: err.error?.message ?? '請稍後再試',
        confirmButtonText: '確認',
      });
    }
    });
  }


}
