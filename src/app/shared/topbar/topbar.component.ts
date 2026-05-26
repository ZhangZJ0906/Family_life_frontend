import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatBadgeModule } from '@angular/material/badge';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { NotifyDialogComponent } from '../../@group/notify-dialog/notify-dialog.component';
import { AuthService } from '../../@services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
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

  // 未讀通知數量，預設 0，避免畫面出現 undefined
  unreadCount = 0;

  // 手機版選單是否開啟
  isMenuOpen = false;

  selected = '';

  constructor(
    private dialog: MatDialog,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // 取得目前登入使用者
    const currentUser = this.authService.currentUser();

    // 如果沒有登入資料，先不呼叫後端，避免 user_id=undefined 或 0 出錯
    if (!currentUser || !currentUser.user_id) {
      this.user_id = 0;
      return;
    }

    this.user_id = currentUser.user_id;

    // 載入頭像
    this.loadAvatar();

    // 載入未讀通知數量
    this.getUnreadNotifyCount();

    // 監聽頭像更新事件
    window.addEventListener('avatarChanged', this.loadAvatar);
  }

  ngOnDestroy(): void {
    // 離開頁面時移除監聽
    window.removeEventListener('avatarChanged', this.loadAvatar);
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
    this.authService.logout();
  }

  // 取得未讀通知數量
  getUnreadNotifyCount(): void {
    if (!this.user_id) {
      this.unreadCount = 0;
      return;
    }

    this.http
      .get<any>(
        `http://localhost:8080/family_life/get_notify?user_id=${this.user_id}`
      )
      .subscribe({
        next: (res) => {
          const notifyList = (res.notifies || []).map((n: any) => ({
            ...n,
            isRead: Number(n.isRead),
          }));

          this.unreadCount = notifyList.filter(
            (n: any) => n.isRead !== 1
          ).length;
        },

        error: (err) => {
          console.log(err);
          this.unreadCount = 0;
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
    dialogRef.afterClosed().subscribe(() => {
      this.getUnreadNotifyCount();
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
        `http://localhost:8080/users/get_user_info?userId=${this.user_id}`
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
}
