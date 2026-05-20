import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatBadgeModule } from '@angular/material/badge';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

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
    FormsModule
  ],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent implements OnInit, OnDestroy {

  avatarUrl = '';
  user_id!: number;
  unreadCount!: number;
  selected = '';

  constructor(
    private dialog: MatDialog,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {

    this.user_id = this.authService.currentUser()?.user_id ?? 0;

    this.loadAvatar();

    this.getUnreadNotifyCount();

    // 監聽頭像更新事件
    window.addEventListener('avatarChanged', this.loadAvatar);
  }

  getUnreadNotifyCount() {

    this.http.get<any>(
      `http://localhost:8080/family_life/get_notify?user_id=${this.user_id}`
    ).subscribe({

      next: (res) => {

        const notifyList = res.notifies || [];

        console.log(notifyList);
        this.unreadCount = notifyList.filter(
          (n: any) => n.isRead === 0
        ).length;

      },

      error: (err) => {
        console.log(err);
      }

    });

  }

  openNotifyDialog(): void {

    this.dialog.open(NotifyDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      panelClass: 'notify-dialog-panel',
      data: {
        userId: this.user_id,
      }
    });

  }

  ngOnDestroy(): void {

    // 離開頁面時移除監聽
    window.removeEventListener('avatarChanged', this.loadAvatar);

  }

  // 讀取 localStorage 裡的頭像
  loadAvatar = (): void => {
    this.avatarUrl = localStorage.getItem('avatarUrl') || '';
  };

}
