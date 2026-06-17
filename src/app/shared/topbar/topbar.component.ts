import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatBadgeModule } from '@angular/material/badge';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatIcon } from "@angular/material/icon";
import { NotifySettingService } from '../../@services/NotifySettingService';
import { AuthService } from '../../@services/auth.service';
import { NotifyService } from '../../@services/NotifyService';
import { BrowserNotifyService } from '../../@services/BrowserNotifyService';
import { NotificationSocketService } from '../../@services/NotificationSocketService';

import { NotifyDialogComponent } from '../../@group/notify-dialog/notify-dialog.component';
import { environment } from '../../@models/user.model';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-topbar',
  imports: [
    RouterLink,
    RouterLinkActive,
    CommonModule,
    MatDialogModule,
    MatBadgeModule,
    FormsModule,
    MatIconModule,
  ],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent implements OnInit, OnDestroy {
  // 使用者頭像網址
  avatarUrl = '';

  // 目前登入使用者 id
  user_id = 0;

  //使用者名字
  user_name = '';

  // 未讀通知數量，預設 0，避免畫面出現 undefined
  unreadCount = 0;

  // 手機版選單是否開啟
  isMenuOpen = false;

  selected = '';

  //到期通知
  NotifyByEndDate!: boolean;

  //email通知
  NotifyByEmail!: boolean;
  Email = '';

  destroy$ = new Subject<void>(); //避免重複傳送
  lastUnreadCount = 0;

  constructor(
    private dialog: MatDialog,
    private http: HttpClient,
    private authService: AuthService,
    private notifyService: NotifyService,
    private browserNotify: BrowserNotifyService,
    private socketService: NotificationSocketService,
    private notifySettingService: NotifySettingService, //共享userInfo
  ) {
    this.notifySettingService.nameSubject$
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.user_name = value;
      });

    this.notifySettingService.emailSubject$
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.Email = value;
      });

    this.notifySettingService.notifyByEndDate$
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.NotifyByEndDate = value;

        if (value) {
          this.browserNotify.requestPermission();
        }
      });

    this.notifySettingService.notifyByEmail$
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.NotifyByEmail = value;
      });

    // console.log("NE: ", this.NotifyByEndDate)

    this.user_id = this.authService.currentUser()?.user_id ?? 0;
  }

  ngOnInit(): void {
    // 取得目前登入使用者
    const currentUser = this.authService.currentUser();

    this.socketService.unreadCount$.subscribe((count) => {
      this.unreadCount = count;
      this.notifyService.setUnreadCount(count);

      console.log('count: ', count);

      if (count > 0 && this.NotifyByEndDate) {
        console.log('success ');
        this.browserNotify.send(
          '家庭系統通知',
          `${this.user_name}目前有 ${count} 則未讀通知`,
        );
      }

      this.lastUnreadCount = count;
    });

    // 如果沒有登入資料，先不呼叫後端，避免 user_id=undefined 或 0 出錯
    if (!currentUser || !currentUser.user_id) {
      this.user_id = 0;
      return;
    }

    this.user_id = currentUser.user_id;

    this.getUnreadNotifyCount();

    this.socketService.connect(this.user_id);

    // 載入頭像
    this.loadAvatar();

    // 監聽頭像更新事件
    window.addEventListener('avatarChanged', this.loadAvatar);
  }

  ngOnDestroy(): void {
    // 離開頁面時移除監聽
    window.removeEventListener('avatarChanged', this.loadAvatar);
    this.socketService.disconnect();

    this.destroy$.next();
    this.destroy$.complete();
  }

  // 開關手機版選單
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  // 點擊導覽按鈕後關閉手機版選單
  closeMenu(): void {
    this.isMenuOpen = false;
  }

  // 登出
  logout(): void {
    Swal.fire({
      title: '確認登出',
      text: '確定要登出嗎？',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '登出',
      cancelButtonText: '取消',
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout();
      }
    });
  }

  // 取得未讀通知數量
  getUnreadNotifyCount(): void {
    if (!this.user_id) {
      return;
    }

    this.http
      .get<any>(
        `${environment.apiUrl}/family_life/get_notify?user_id=${this.user_id}`,
      )
      .subscribe({
        next: (res) => {
          const notifyList = (res.notifies || []).map((n: any) => ({
            ...n,
            isRead: Number(n.isRead),
          }));

          const unread = notifyList.filter((n: any) => n.isRead !== 1).length;
          // 🔥 只更新 service
          this.unreadCount = unread;

          this.notifyService.setUnreadCount(unread);
        },

        error: (err) => {
          console.log(err);
          this.notifyService.setUnreadCount(0);
        },
      });
  }

  // 開啟通知彈窗
  openNotifyDialog(): void {
    if (!this.user_id) {
      return;
    }

    const dialogRef = this.dialog.open(NotifyDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      panelClass: 'notify-dialog-panel',
      data: {
        userId: this.user_id,
      },
    });

    // 彈窗關閉後重新讀通知數量
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.unreadCount !== undefined) {
        this.unreadCount = result.unreadCount;
      } else {
        this.getUnreadNotifyCount();
      }
    });
  }

  // 讀取使用者頭像
  // 用箭頭函式，避免 window.addEventListener 呼叫時 this 指向錯誤
  loadAvatar = (): void => {
    if (!this.user_id) {
      this.avatarUrl = '';
      return;
    }

    this.http
      .get<any>(
        `${environment.apiUrl}/users/get_user_info?userId=${this.user_id}`,
      )
      .subscribe({
        next: (res) => {
          this.avatarUrl = res.avatar || '';
        },

        error: (err) => {
          console.log(err);
          this.avatarUrl = '';
        },
      });
  };
  //獲取圖片 用
  getAvatar(avatar: string): string {
    if (!avatar) return 'default.png';
    if (avatar.startsWith('http')) return avatar; // 舊資料相容
    return window.location.origin + avatar; // 自動補上當前 host
  }
  // //船Mail
  // sendEmailTest(Email: string) {
  //   this.http.get(
  //     `${environment.apiUrl}/users/test-mail?email=${Email}`,
  //     { responseType: 'text' }
  //   ).subscribe({
  //     next: (res) => {
  //       console.log("success:", res);
  //     },
  //     error: (err) => {
  //       console.log(err);
  //     }
  //   });
  // }
}
