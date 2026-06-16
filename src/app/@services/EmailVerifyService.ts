import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class EmailVerifyService {

  private baseUrl = 'http://localhost:8080/users';

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
  private showVerifyDialog(email: string, onSuccess: () => void): void {

    const cooldownTime = 60;
    let timerInterval: ReturnType<typeof setInterval> | undefined;

    Swal.fire({
      title: '輸入驗證碼',
      html: `驗證碼將在 <b id="verify-countdown">${cooldownTime}</b> 秒後失效`,
      input: 'text',
      inputPlaceholder: '請輸入驗證碼',

      timer: cooldownTime * 100,
      timerProgressBar: true,

      showCancelButton: true,
      confirmButtonText: '驗證',
      cancelButtonText: '取消',

      allowOutsideClick: false,

      didOpen: () => {
        const countdownElement = Swal.getHtmlContainer()?.querySelector('#verify-countdown');
        const cancelButton = Swal.getCancelButton();

        timerInterval = setInterval(() => {
          const timerLeft = Swal.getTimerLeft();

          if (countdownElement && timerLeft !== undefined) {
            countdownElement.textContent = Math.ceil(
              timerLeft / 1000
            ).toString();
          }

          if (cooldownTime <= 0) {
          clearInterval(timerInterval);

          // 隱藏倒數提示文字
          const cooldownText = document.getElementById('cooldown-text');
          if (cooldownText) cooldownText.style.display = 'none';

          // 啟用取消按鈕，並將文字改成「重新發送」
          if (cancelButton) {
            cancelButton.disabled = false;
            cancelButton.textContent = '重新發送驗證碼';
            cancelButton.style.backgroundColor = '#6e7881'; // 調整成顯眼的按鈕顏色
            cancelButton.style.color = '#fff';
          }
        }

        }, 900);
      },

      // willClose: () => {
      //   if (timerInterval) {
      //     clearInterval(timerInterval);
      //   }
      // },
      preConfirm: (code) => {
        if (!code) {
          Swal.showValidationMessage('請輸入驗證碼');
        }
        return code;
      }
    }).then((result) => {

      if (!result.isConfirmed) return;

      Swal.fire({
        title: '驗證中...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      this.http.post(
        `${this.baseUrl}/verify?email=${email}&code=${result.value}`,
        {},
        { responseType: 'text' }
      ).subscribe({
        next: (res: any) => {

          Swal.close();

          if (res === '驗證成功') {
            // Swal.fire('驗證成功', '', 'success');
            onSuccess(); // ← 成功 callback
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
    });
  }
}
