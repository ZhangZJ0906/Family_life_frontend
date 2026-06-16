import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { User } from '../../@models/user.model';
import { AuthService } from '../../@services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { HttpClientService } from '../../@services/http-client.service';
import Swal from 'sweetalert2';
import { NotifySettingService } from '../../@services/NotifySettingService';
import { EmailVerifyService } from './../../@services/EmailVerifyService';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, MatIconModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  email = '';
  checkEmail = '';
  password = '';
  errorMessage = '';
  showPassword: boolean = false;
  isForgotPwd: boolean = false;
  updatePwd: boolean = false;
  newPassword = '';
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,

    private notifySettingService: NotifySettingService, //共享userInfo
    private readonly emailVerifyService: EmailVerifyService,
    private readonly http: HttpClientService,

  ) {}

  signIn(): void {
  this.authService.login(this.email, this.password).subscribe({
    next: (res) => {
      if (res.code !== 200) {
        this.errorMessage = 'Email 或密碼不正確';

        Swal.fire({
          icon: 'error',
          title: '登入失敗',
          text: 'Email 或密碼不正確',
          confirmButtonText: '確認',
        });

        return;
      }

      const payload = {
        user_id: res.userId,
        name: res.name,
        email: res.email,
        password: '',
        avatar: res.avatar ?? '',
        notifyByEndDate: res.notifyByEndDate ?? true,
        notifyByEmail: res.notifyByEmail ?? false,
        // created_at: res.created_at ??  '',
        // updated_at: res.updated_at ?? '',
      };

      this.authService.setCurrentUser(payload);
      sessionStorage.setItem('isLogin', 'true');

      // 共享 userInfo
      this.notifySettingService.setName(res.name);
      this.notifySettingService.setNotifyByEndDate(res.notifyByEndDate);
      this.notifySettingService.setNotifyByEmail(res.notifyByEmail);

      Swal.fire({
        icon: 'success',
        title: '登入成功',
        text: `歡迎回來，${res.name}`,
        confirmButtonText: '確認',
        showConfirmButton: true,
      }).then(() => {
        this.router.navigate(['/home-page']);
      });
    },

    error: (err) => {
      console.error(err);
      this.errorMessage = 'Email 或密碼不正確';

      Swal.fire({
        icon: 'error',
        title: '登入失敗',
        text: 'Email 或密碼不正確',
        confirmButtonText: '確認',
      });
    },
  });
}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
  forGotPwd() {
    this.isForgotPwd = true;
  }
  getBackToLogin() {
    this.isForgotPwd = false;
    this.updatePwd = false;
  }

  checkEmailFromBackend() {
    this.http
      // .getApi(this.http.basicUrl + `users/checkEmail?email=${this.checkEmail}`)
      .getApi(`users/checkEmail?email=${this.checkEmail}`)
      .subscribe({
        next: (res: any) => {
          if (res.code != 200) {
            Swal.fire({
              title: '錯誤',
              icon: 'error',
              text: res.message || 'server 錯誤',
            });
            return;
          }
          this.emailVerifyService.sendVerifyCode(
            this.checkEmail,
            () => {
              this.updatePwd = true;
            }
          );
        },
        error(err) {
          Swal.fire({
            title: '錯誤',
            icon: 'error',
            text: err.message || 'server 錯誤',
          });
        },
      });
  }

  updatePassword() {
    if (this.newPassword.length < 6) {
      Swal.fire({
        title: '錯誤',
        icon: 'error',
        text: '密碼至少需要 6 個字元',
      });
      return;
    }
    const payload = {
      email: this.checkEmail,
      password: this.newPassword,
    };
    console.log(payload)

    this.http
      // .postApi(this.http.basicUrl+'users/updatePassword', payload)
      .postApi('users/updatePassword', payload)
      .subscribe({
      next: (res: any) => {
        if (res.code != 200) {
          Swal.fire({
            title: '錯誤',
            icon: 'error',
            text: res.message || 'server 錯誤',
          });
          return;
        }

        Swal.fire({
          title: '成功',
          icon: 'success',
        });
        this.newPassword = '';
        this.updatePwd = false;
        this.getBackToLogin();
      },
      error(err) {
        Swal.fire({
          title: '錯誤',
          icon: 'error',
          text: err.message || 'server 錯誤',
        });
      },
    });
  }
}
