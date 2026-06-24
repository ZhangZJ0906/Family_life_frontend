import { EmailVerifyService } from './../../@services/EmailVerifyService';
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
    private readonly router: Router,
    private readonly emailVerifyService: EmailVerifyService
  ) {}

  errorMessage = '';
  successMessage = '';

  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  avatar = '';
  is_notify: boolean = true;

  emailVerified = false;

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

  get emailError(): string {
    if (!this.email) {
      return '';
    }

    if(this.email == "familyLifeTest123456@gmail.com"){
      return '官方email請勿使用';
    }

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z0-9.-]+(\.[a-zA-Z]{2,})$/;

    if (!gmailRegex.test(this.email)) {
      return '請輸入正確的 Email 信箱';
    }

    return '';
  }

  register(): void {

    this.errorMessage = '';

    // if (!this.emailVerified) {
    //   this.errorMessage = '請先完成 Email 驗證';
    //   return;
    // }

    this.authService.register({
      userName: this.name,
      email: this.email,
      pwd: this.password,
      avatar: this.avatar ?? '',
    }).subscribe({
      next: (res) => {
        if(res.message == "Email already exists"){
          Swal.fire({
            icon: 'error',
            title: '註冊失敗',
            text: 'Email已存在',
          });
          return;
        }

        else if (res.code === 200) {
          this.successMessage = '註冊成功，即將前往登入頁';

          Swal.fire({
            icon: 'success',
            title: '註冊成功',
            timer: 1200,
            showConfirmButton: false
          }).then(() => {
            this.router.navigate(['/login']);
          });

          return;
        }

        this.errorMessage = res.message ?? '註冊失敗';
      },
      error: (err) => {
        this.errorMessage =
          err.error?.message ?? '系統發生錯誤，請稍後再試';
      }
    });
  }

  startRegister(): void {

    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email || !this.name || !this.password || !this.confirmPassword) {
      this.errorMessage = '請完整填寫所有欄位';
      return;
    }

    if (this.emailError) {
      this.errorMessage = this.emailError;
      return;
    }

    if (this.passwordError) {
      this.errorMessage = this.passwordError;
      return;
    }

    if (this.confirmPasswordError) {
      this.errorMessage = this.confirmPasswordError;
      return;
    }

    this.emailVerifyService.sendVerifyCode(
      this.email,
      () => {
        this.emailVerified = true;
        this.register();
      }
    );
  }

}
