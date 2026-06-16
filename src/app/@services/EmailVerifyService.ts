import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class EmailVerifyService {

  // private baseUrl = 'http://localhost:8080/users';
  private baseUrl = '/api';


  constructor(private http: HttpClient) {}

  /**
   * 發送驗證碼
   */
  sendVerifyCode(email: string, onSuccess: () => void, onError?: () => void): void {

    Swal.fire({
      title: '正在送驗證碼到你的 Gmail...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.http.post(
      `${this.baseUrl}/send?email=${email}`,
      {},
      { responseType: 'text' }
    ).subscribe({
      next: () => {
        Swal.close();
        Swal.fire('驗證碼已送出', '', 'success');
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
  private showVerifyDialog( email: string, onSuccess: () => void): void {
    const cooldownTime = 60;

    let remainingSeconds = cooldownTime;
    let timerInterval: ReturnType<typeof setInterval> | undefined;

    const startCountdown = (): void => {
    remainingSeconds = cooldownTime;

    const resendButton = Swal.getDenyButton();
    const countdownElement =
      Swal.getHtmlContainer()?.querySelector('#verify-countdown');

    if (resendButton) {
      resendButton.disabled = true;
      resendButton.textContent = `重新發送（${remainingSeconds}）`;
    }

    if (countdownElement) {
      countdownElement.textContent =
        `${remainingSeconds} 秒後可重新發送驗證碼`;
    }

    if (timerInterval) {
      clearInterval(timerInterval);
    }

    timerInterval = setInterval(() => {
      remainingSeconds--;

      if (resendButton) {
        resendButton.textContent =
          remainingSeconds > 0
            ? `重新發送（${remainingSeconds}）`
            : '重新發送';
      }

      if (countdownElement) {
        countdownElement.textContent =
          remainingSeconds > 0
            ? `${remainingSeconds} 秒後可重新發送驗證碼`
            : '現在可以重新發送驗證碼';
      }

      if (remainingSeconds <= 0) {
        clearInterval(timerInterval);

        if (resendButton) {
          resendButton.disabled = false;
        }
      }
    }, 1000);
  };

  Swal.fire({
    title: '輸入驗證碼',

    html: `
      <div id="verify-countdown">
        ${cooldownTime} 秒後可重新發送驗證碼
      </div>
    `,

    input: 'text',
    inputPlaceholder: '請輸入驗證碼',

    showCancelButton: true,
    showDenyButton: true,

    confirmButtonText: '驗證',
    denyButtonText: `重新發送（${cooldownTime}）`,
    cancelButtonText: '取消',

    allowOutsideClick: false,
    allowEscapeKey: false,

    didOpen: () => {
      startCountdown();
    },

    willClose: () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    },

    preConfirm: (code: string) => {
      const verifyCode = code?.trim();

      if (!verifyCode) {
        Swal.showValidationMessage('請輸入驗證碼');
        return false;
      }

      return verifyCode;
    },

    preDeny: async () => {
      if (remainingSeconds > 0) {
        return false;
      }

      const resendButton = Swal.getDenyButton();

      if (resendButton) {
        resendButton.disabled = true;
        resendButton.textContent = '發送中...';
      }

      try {
        await firstValueFrom(
          this.http.post(
            `${this.baseUrl}/send?email=${encodeURIComponent(email)}`,
            {},
            { responseType: 'text' }
          )
        );

        const countdownElement =
          Swal.getHtmlContainer()?.querySelector('#verify-countdown');

        if (countdownElement) {
          countdownElement.textContent = '驗證碼已重新發送';
        }

        startCountdown();
      } catch (err) {
        console.error('重新發送失敗：', err);

        Swal.showValidationMessage('重新發送失敗，請稍後再試');

        if (resendButton) {
          resendButton.disabled = false;
          resendButton.textContent = '重新發送';
        }
      }

      // 回傳 false，重新發送後不關閉 Swal
      return false;
    },
  }).then((result) => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    if (!result.isConfirmed) {
      return;
    }

    Swal.fire({
      title: '驗證中...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    this.http
      .post(
        `${this.baseUrl}/verify?email=${encodeURIComponent(email)}&code=${encodeURIComponent(result.value)}`,
        {},
        { responseType: 'text' }
      )
      .subscribe({
        next: (res: string) => {
          Swal.close();

          if (res.trim() === '驗證成功') {
            onSuccess();
            return;
          }

          Swal.fire({
            icon: 'error',
            title: '驗證失敗',
            text: '驗證碼不正確',
          });
        },

        error: (err) => {
          Swal.close();
          console.error(err);

          Swal.fire({
            icon: 'error',
            title: '驗證失敗',
            text: '驗證碼錯誤或已過期',
          });
        },
      });
  });
}
}
