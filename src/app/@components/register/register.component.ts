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

import { HttpClient } from '@angular/common/http';

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
    private http: HttpClient,
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

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

    if (!gmailRegex.test(this.email)) {
      return '請輸入正確的 Gmail 信箱';
    }

    return '';
  }

  register(): void {

    this.errorMessage = '';

    if (!this.emailVerified) {
      this.errorMessage = '請先完成 Email 驗證';
      return;
    }

    this.authService.register({
      userName: this.name,
      email: this.email,
      pwd: this.password,
      avatar: this.avatar ?? '',
    }).subscribe({
      next: (res) => {

        if (res.code === 200) {
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

    this.verifyEmailExist(this.email);
  }

  verifyEmailExist(email: string) {
    Swal.fire({
      title: '正在送驗證碼到你的gmail...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    this.http.post(`http://localhost:8080/users/send?email=${email}`,{},
    {
      responseType: 'text'
    }).subscribe({

      next: (res: any) => {
        Swal.close()
        Swal.fire('驗證碼已送出', '', 'success');
        this.showVerifyDialog();
      },
      error: (err) => {
        Swal.close()
        console.error(err);
        Swal.fire('送出失敗', '', 'error');
      }
    });
  }

  showVerifyDialog(){
    Swal.fire({
      title: '輸入驗證碼',
      input: 'text',
      inputPlaceholder: '請輸入驗證碼',
      showCancelButton: true,
      confirmButtonText: '驗證',
      cancelButtonText: '取消',

      preConfirm: async (verifyCode) => {

        if (!verifyCode) {
          Swal.showValidationMessage('請輸入驗證碼');
          return;
        }

        return verifyCode;
      }

    }).then((result) => {
      // 按取消
      if (!result.isConfirmed) {
        return;
      }

      if (result.isConfirmed) {
        Swal.fire({
          title: '驗證中...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        this.http.post(
          `http://localhost:8080/users/verify?email=${this.email}&code=${result.value}`,
        {},
        {
          responseType: 'text'
        }).subscribe({
          next: (res: any) => {
            Swal.close()
            if(res == "驗證成功"){
              this.emailVerified = true;
              Swal.fire('驗證成功', '', 'success');
              // 驗證成功才真正註冊
              this.register();
            }
            else{
              Swal.fire('驗證失敗', '', 'error');
            }
          },

        error: () => {
          Swal.close()
          Swal.fire('驗證失敗', '', 'error');
        }
      });

    }
   });
  }
}
