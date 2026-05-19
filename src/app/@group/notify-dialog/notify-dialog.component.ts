import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

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
export class NotifyDialogComponent {

  user_id !: string;

  unreadMap = {
    all: 0,
    invite: 0,
    group: 0,
    update: 0
  };

  constructor(
    public dialogRef: MatDialogRef<NotifyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,

    private http: HttpClient,
  ) {
    this.user_id = data.userId;
  }

  filterType: 'all' | 'invite' | 'group' | 'update' = 'all';

  filteredNotifies() {
    if (this.filterType === 'all') {
      return this.notifies;
    }
    return this.notifies.filter(n => n.type === this.filterType);
  }

  notifies: any[] = [];

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.getNotify();
  }

  markAsRead(n: any) {

    // 已讀就不打 API
    if (n.isRead) {
      return;
    }

    this.http.post(
    `http://localhost:8080/family_life/read_notify?notify_id=${n.id}`,
    {}
    ).subscribe({

      next: () => {

        // 前端直接更新
        n.isRead = 1;

      },

      error: (err) => {
        console.log(err);
      }

    });

  }

  markAllAsRead() {

    const unreadIds = this.notifies
      .filter(n => !n.isRead)
      .map(n => n.id);

    if (unreadIds.length === 0) return;

    this.http.post(
      'http://localhost:8080/family_life/read_all_notify',
      {
        ids: unreadIds
      }
    ).subscribe({

      next: () => {

        this.notifies.forEach(n => n.isRead = 1);

        this.calculateUnread();

      },

      error: (err) => {
        console.log(err);
      }

    });

  }

  getUnreadCountByType(type: string): number {

    const list = this.notifies || [];

    if (type === 'all') {
      return list.filter(n => !n.isRead).length;
    }

    return list.filter(n =>
      !n.isRead && n.type === type
    ).length;

  }

  calculateUnread() {

    this.unreadMap.all = this.notifies.filter(n => !n.isRead).length;

    this.unreadMap.invite = this.notifies.filter(
      n => !n.isRead && n.type === 'invite'
    ).length;

    this.unreadMap.group = this.notifies.filter(
      n => !n.isRead && n.type === 'group'
    ).length;

    this.unreadMap.update = this.notifies.filter(
      n => !n.isRead && n.type === 'update'
    ).length;

  }

  getNotify(){
    this.http.get<any>(
      `http://localhost:8080/family_life/get_notify?user_id=${this.user_id}`
    ).subscribe({

      next: (res) => {
        // 後端如果是 groupMemberDao.getNotifyList(userId)
        this.notifies = res.notifies;

        this.calculateUnread();

        console.log('res:', res);
        console.log('notify:', this.notifies);
      },

      error: (err) => {
        console.log(err);
      }

    });
  }

  close(): void {
    this.dialogRef.close();
  }

  acceptInvite(n: any){

    n.status = 'accepted';

    this.http.post(
      `http://localhost:8080/family_life/accept_join_group?user_id=${this.user_id}&group_id=${n.targetGroupId}&notify_id=${n.id}`,
      {}
      ).subscribe({
        next: (res: any) => {
          console.log(res);
            Swal.fire({
              icon: 'success',
              title: `已加入該群組`
            });
          },
        error: (err) => {
          console.log(err);
          Swal.fire({
            icon: 'error',
            title: '加入失敗'
          });
        }
      });
  }

  rejectInvite(n: any) {

    n.status = 'rejected';

    this.http.post(
      `http://localhost:8080/family_life/reject_join_group?user_id=${this.user_id}&group_id=${n.targetGroupId}&notify_id=${n.id}`,
      {}
      ).subscribe({
        next: (res: any) => {
          console.log(res);
          },
        error: (err) => {
          console.log(err);
          Swal.fire({
            icon: 'error',
            title: '失敗'
          });
        }
      });
  }

  deleteRead(){
    const isReadIds = this.notifies
      .filter(n => n.isRead)
      .map(n => n.id);

    if (isReadIds.length === 0) return;

    this.http.post(
      'http://localhost:8080/family_life/delete_all_isReadNotify',
      {
        ids: isReadIds
      }
    ).subscribe({

      next: () => {

        // ✅ 關鍵：同步更新畫面
        this.notifies = this.notifies.filter(n => !n.isRead);

        // ✅ 重新計算 badge
        this.calculateUnread();

      },

      error: (err) => {
        console.log(err);
      }

    });
  }

  deleteNotify(n: any){
    Swal.fire({
          title: "確定刪除?",
          text: "該通知不會還原",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "確定",
          cancelButtonText: "取消"
        }).then((result) => {
          if (result.isConfirmed) {

            this.http.post(
              `http://localhost:8080/family_life/delete_notify?notify_id=${n.id}`,{}
            ).subscribe({

              next: (res: any) => {

                console.log(res);

                this.notifies = res.notifies;

                Swal.fire({
                  icon: 'success',
                  title: `刪除成功`
                });

                // 🔥 建議：重新載入群組列表
                this.getNotify();

              },

              error: (err) => {
                console.log(err);
                Swal.fire({
                icon: 'error',
                title: '刪除失敗'
              });
              }

            });
          }
        });

  }
}
