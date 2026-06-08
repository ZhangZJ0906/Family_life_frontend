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

  register(): void {

    if (!this.emailVerified) {

      Swal.fire({
        icon: 'warning',
        title: '請先完成Email驗證'
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

  startRegister(): void {

    if (!this.email || !this.name || !this.password || !this.confirmPassword) {
      Swal.fire({
        icon: 'warning',
        title: '資料未填完整',
        text: '請完整填寫資料'
      });
      return;
    }

    if (this.passwordError) {
      Swal.fire({
        icon: 'warning',
        title: '密碼格式不正確',
        text: this.passwordError
      });
      return;
    }

    if (this.confirmPasswordError) {
      Swal.fire({
        icon: 'warning',
        title: '確認密碼錯誤',
        text: this.confirmPasswordError
      });
      return;
    }

    // 開始寄驗證碼
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
