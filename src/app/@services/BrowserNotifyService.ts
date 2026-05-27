import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BrowserNotifyService {

  // ======================
  // 請求通知權限
  // ======================
  requestPermission() {
    // console.log("permission", Notification.permission)
    if (!('Notification' in window)) {
      console.log('此瀏覽器不支援通知');
      return;
    }

    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }

  // ======================
  // 發送通知（可導頁）
  // ======================
  send(title: string, body: string, url?: string) {

    if (Notification.permission !== 'granted') return;

    const notification = new Notification(title, {
      body,
      icon: 'assets/logo.png'
    });

    notification.onclick = () => {
      window.focus();

      if (url) {
        window.open(url, '_self'); // SPA 建議用這個
      }

      notification.close();
    };
  }
}
