import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

import { NotifyService } from '../../@services/NotifyService';
import { Calendar } from '@fullcalendar/core/index.js';

@Component({
  selector: 'app-notify-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './notify-dialog.component.html',
  styleUrl: './notify-dialog.component.scss'
})
export class NotifyDialogComponent implements OnInit {

  user_id!: string;

  notifies: any[] = [];

  filterType:
    | 'all'
    | 'invite'
    | 'group'
    | 'itemlist'
    | 'expense'
    | 'calendar'
    | 'calendar_self'
    | 'warring'
    | 'warring_self'
    | 'update' = 'all';

  unreadMap = {
    all: 0,
    invite: 0,
    group: 0,
    itemlist: 0,
    expense:0,
    calendar: 0,
    calendar_self: 0,
    warring: 0,
    warring_self: 0,
    update: 0
  };

  isLoading = true;

  constructor(
    public dialogRef: MatDialogRef<NotifyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient,
    private router: Router,
    private notifyService: NotifyService
  ) {
    this.user_id = data.userId;
  }

  ngOnInit(): void {
    this.getNotify();
  }

  getUnreadCountByType(type: string): number {

    const list = this.notifies || [];

    if (type === 'all') {
      return list.filter(n => Number(n.isRead) !== 1).length;
    }

    return list.filter(n =>
      Number(n.isRead) !== 1 && n.type === type
    ).length;

  }



  getNotify() {
    this.isLoading = true;
    this.http.get<any>(
      `http://localhost:8080/family_life/get_notify?user_id=${this.user_id}`
    ).subscribe({
      next: (res) => {

        this.notifies = (res.notifies || []).map((n: any) => ({
          ...n,
          isRead: Number(n.isRead)
        }));

        this.calculateUnread();
        this.syncBadge();

        this.isLoading = false;

      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  // ========================
  // 🔥 計算各類未讀
  // ========================
  calculateUnread() {

    const list = this.notifies;

    this.unreadMap.all = list.filter(n => n.isRead !== 1).length;
    this.unreadMap.invite = list.filter(n => n.isRead !== 1 && n.type === 'invite').length;
    this.unreadMap.group = list.filter(n => n.isRead !== 1 && n.type === 'group').length;
    this.unreadMap.itemlist = list.filter(n => n.isRead !== 1 && n.type === 'itemlist').length;
    this.unreadMap.calendar = list.filter(n => n.isRead !== 1 && n.type === 'calendar').length;
    this.unreadMap.calendar_self = list.filter(n => n.isRead !== 1 && n.type === 'calendar_self').length;
    this.unreadMap.warring = list.filter(n => n.isRead !== 1 && n.type === 'warring').length;
    this.unreadMap.warring_self = list.filter(n => n.isRead !== 1 && n.type === 'warring_self').length;
    this.unreadMap.expense = list.filter(n => n.isRead !== 1 && n.type === 'expense').length;
    this.unreadMap.update = list.filter(n => n.isRead !== 1 && n.type === 'update').length;
  }

  // ========================
  // 🔥 同步 Topbar badge
  // ========================
  syncBadge() {
    const unread = this.notifies.filter(n => n.isRead !== 1).length;
    this.notifyService.setUnreadCount(unread);
  }

  // ========================
  // 🔥 點擊已讀
  // ========================
  markAsRead(n: any) {

    if (n.isRead === 1 || n.type === 'invite') return;

    this.showLoading('標記已讀中...');

    this.http.post(
      `http://localhost:8080/family_life/read_notify?notify_id=${n.id}`,
      {}
    ).subscribe({
      next: () => {

        this.closeLoading();

        n.isRead = 1;

        this.calculateUnread();
        this.syncBadge();
      },
      error: (err) => console.log(err)
    });
  }

  // ========================
  // 🔥 全部已讀
  // ========================
  markAllAsRead() {

    const unreadIds = this.notifies
      .filter(n => n.isRead !== 1 && n.type !== 'invite')
      .map(n => n.id);

    if (!unreadIds.length) return;
    this.showLoading('全部標記已讀中...');


    this.http.post(
      'http://localhost:8080/family_life/read_all_notify',
      { ids: unreadIds }
    ).subscribe({
      next: () => {
        this.closeLoading();

        this.notifies.forEach(n => n.isRead = 1);

        this.calculateUnread();
        this.syncBadge();
      },
      error: (err) => console.log(err)
    });
  }

  // ========================
  // 🔥 刪除已讀
  // ========================
  deleteRead() {

    const ids = this.notifies
      .filter(n => n.isRead === 1)
      .map(n => n.id);

    if (!ids.length) return;
    this.showLoading('刪除中...');

    this.http.post(
      'http://localhost:8080/family_life/delete_all_isReadNotify',
      { ids }
    ).subscribe({
      next: () => {

        this.closeLoading();

        this.notifies = this.notifies.filter(n => n.isRead !== 1);

        this.calculateUnread();
        this.syncBadge();
      },
      error: (err) => console.log(err)
    });
  }

  // ========================
  // 🔥 刪除單筆
  // ========================
  deleteNotify(n: any) {

    Swal.fire({
      title: "確定刪除?",
      text: "該通知不會還原",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "確定",
      cancelButtonText: "取消"
    }).then((result) => {

      if (!result.isConfirmed) return;

      this.showLoading('刪除中...');

      this.http.post(
        `http://localhost:8080/family_life/delete_notify?notify_id=${n.id}`,
        {}
      ).subscribe({
        next: () => {

          this.notifies = this.notifies.filter(x => x.id !== n.id);

          this.calculateUnread();
          this.syncBadge();

          Swal.fire({
            icon: 'success',
            title: '刪除成功'
          });

        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: '刪除失敗'
          });
        }
      });

    });
  }

  // ========================
  // 🔥 邀請
  // ========================
  acceptInvite(n: any) {

    n.status = 'accepted';
    n.isRead = 1;

    this.showLoading('處理中...');

    this.http.post(
      `http://localhost:8080/family_life/accept_join_group?user_id=${this.user_id}&group_id=${n.targetGroupId}&notify_id=${n.id}`,
      {}
    ).subscribe({
      next: () => {
        this.calculateUnread();
        this.syncBadge();
        Swal.fire('已加入該群組', '', 'success');
      },
      error: () => {
        Swal.fire('加入失敗', '', 'error');
      }
    });
  }

  rejectInvite(n: any) {

    n.status = 'rejected';
    n.isRead = 1;

    this.showLoading('處理中...');

    this.http.post(
      `http://localhost:8080/family_life/reject_join_group?user_id=${this.user_id}&group_id=${n.targetGroupId}&notify_id=${n.id}`,
      {}
    ).subscribe({
      next: () => {
        this.calculateUnread();
        this.syncBadge();
      },
      error: () => {
        Swal.fire('失敗', '', 'error');
      }
    });
  }

  // ========================
  // 🔥 導頁
  // ========================
  goItemList(n: any) {
    this.dialogRef.close();

    this.router.navigate(['/itemList', n.sendUserId]);
  }

  goCalendar(n: any) {
    this.dialogRef.close();

    this.router.navigate(['/calendar', n.sendUserId]);
  }

  goExpense(n:any){
    this.dialogRef.close();
    this.router.navigate(['/expenses'], { queryParams: { groupId: n.sendUserId } });
  }
  // ========================
  // 🔥 filter
  // ========================
  filteredNotifies() {

    if (this.filterType === 'all') return this.notifies;

    if (this.filterType === 'group') {
      return this.notifies.filter(n =>
        n.type === 'group' ||
        n.type === 'itemlist' ||
        n.type=== 'expense'
      );
    }

    if (this.filterType === 'calendar') {
      return this.notifies.filter(n =>
        n.type === 'calendar' || n.type === 'calendar_self' || n.type === 'warring' || n.type === 'warring_self'
      );
    }

    return this.notifies.filter(n => n.type === this.filterType);
  }

  // ========================
  // 🔥 close dialog
  // ========================
  close(): void {

    const unread = this.notifies.filter(n => n.isRead !== 1).length;

    // 回傳給 topbar（備用）
    this.dialogRef.close({
      unreadCount: unread
    });
  }

  //loading中....
  private showLoading(message = '處理中...') {
    Swal.fire({
      title: message,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  private closeLoading() {
    Swal.close();
  }
}
