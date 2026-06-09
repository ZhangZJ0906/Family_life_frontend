import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

    Swal.fire({
      title: '輸入驗證碼',
      input: 'text',
      inputPlaceholder: '請輸入驗證碼',
      showCancelButton: true,
      confirmButtonText: '驗證',
      cancelButtonText: '取消',

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
