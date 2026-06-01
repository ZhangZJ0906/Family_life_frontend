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

    console.log("通知權限:", Notification.permission);

    if (!('Notification' in window)) {
      console.log('此瀏覽器不支援通知');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.log('通知權限不是 granted，目前是:', Notification.permission);
      return;
    }

    try {
      const notification = new Notification(title, {
        body
      });

      console.log('通知已建立:', notification);

      notification.onclick = () => {
        window.focus();
        console.log("click notify, url:", url);

        if (url) {
          window.open(url, '_self');
        }

        notification.close();
      };

    } catch (error) {
      console.error('建立通知失敗:', error);
    }
  }
}
