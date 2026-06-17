import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class EmailVerifyService {

  // private baseUrl = 'http://localhost:8080/users';
  private baseUrl = '/api';


  constructor(private http: HttpClient) {}

  verifyExpire = 300; // 5 分鐘
  resendCooldown = 60;

  verifyCountdown = 0;
  resendCountdown = 0;

  private verifyTimer?: ReturnType<typeof setInterval>;
  private resendTimer?: ReturnType<typeof setInterval>;

  /**
   * 發送驗證碼
   */
  sendVerifyCode(email: string, onSuccess: () => void, onError?: () => void): void {

    if (this.resendCountdown > 0) {
      Swal.fire(`請 ${this.resendCountdown} 秒後再重新發送`, '', 'info');
      return;
    }

    Swal.fire({
      title: '正在送驗證碼到你的 Gmail...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.http.post(
      `${this.baseUrl}/users/send?email=${email}`,
      {},
      { responseType: 'text' }
    ).subscribe({
      next: () => {
        Swal.close();

        this.startVerifyCountdown();
        this.startResendCooldown();

        Swal.fire('驗證碼已送出', `驗證碼 ${this.verifyExpire / 60} 分鐘內有效`, 'success');
        this.showVerifyDialog(email, onSuccess);
      },
      error: (err) => {
        Swal.close();
        console.error(err);
        Swal.fire('送出失敗', '', 'error');
        onError?.();
      }
    });
  }

  /**
   * 驗證 code dialog
   */
  private showVerifyDialog(email: string, onSuccess: () => void): void {
    Swal.fire({
      title: '輸入驗證碼',
      html: `
        <input id="verify-code" class="swal2-input" placeholder="請輸入驗證碼">
        <p style="font-size: 13px; color: #64748b;">
          驗證碼 ${Math.ceil(this.verifyCountdown / 60)} 分鐘內有效
        </p>
        <button id="resend-code" class="swal2-confirm swal2-styled" type="button"
          ${this.resendCountdown > 0 ? 'disabled' : ''}>
          ${this.resendCountdown > 0 ? `${this.resendCountdown} 秒後重新發送` : '重新發送驗證碼'}
        </button>
      `,
      showCancelButton: true,
      confirmButtonText: '驗證',
      cancelButtonText: '取消',
      didOpen: () => {
        const resendButton = document.getElementById('resend-code');

        resendButton?.addEventListener('click', () => {
          Swal.close();
          this.sendVerifyCode(email, onSuccess);
        });
      },
      preConfirm: () => {
        const input = document.getElementById('verify-code') as HTMLInputElement;
        const code = input?.value?.trim();

        if (!code) {
          Swal.showValidationMessage('請輸入驗證碼');
          return false;
        }

        if (this.verifyCountdown <= 0) {
          Swal.showValidationMessage('驗證碼已過期，請重新發送');
          return false;
        }

        return code;
      }
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.verifyCode(email, result.value, onSuccess);
    });
  }

  private startVerifyCountdown(): void {
    clearInterval(this.verifyTimer);

    this.verifyCountdown = this.verifyExpire;

    this.verifyTimer = setInterval(() => {
      this.verifyCountdown--;

      if (this.verifyCountdown <= 0) {
        clearInterval(this.verifyTimer);
        this.verifyCountdown = 0;
      }
    }, 1000);
  }

  private startResendCooldown(): void {
    clearInterval(this.resendTimer);

    this.resendCountdown = this.resendCooldown;

    this.resendTimer = setInterval(() => {
      this.resendCountdown--;

      if (this.resendCountdown <= 0) {
        clearInterval(this.resendTimer);
        this.resendCountdown = 0;
      }
    }, 1000);
  }

  private clearTimers(): void {
    clearInterval(this.verifyTimer);
    clearInterval(this.resendTimer);
    this.verifyCountdown = 0;
    this.resendCountdown = 0;
  }

  private verifyCode(email: string, code: string, onSuccess: () => void): void {
    Swal.fire({
      title: '驗證中...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.http.post(
      `${this.baseUrl}/verify?email=${email}&code=${code}`,
      {},
      { responseType: 'text' }
    ).subscribe({
      next: (res: any) => {
        Swal.close();

        if (res === '驗證成功') {
          this.clearTimers();
          onSuccess();
        } else {
          Swal.fire('驗證失敗', '', 'error');
        }
      },
      error: (err) => {
        Swal.close();
        console.error(err);
        Swal.fire('驗證失敗', '', 'error');
      }
    });
  }

}
