import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import Swal from 'sweetalert2';

import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';

import { ChatRoomComponent } from './../chat-room/chat-room.component';
import { GroupMemberDialogComponent } from '../group-member-dialog/group-member-dialog.component';
import { NotifyDialogComponent } from '../notify-dialog/notify-dialog.component';
import { TopbarComponent } from '../../shared/topbar/topbar.component';

import { AuthService } from '../../@services/auth.service';
import { environment } from '../../@models/user.model';


@Component({
  selector: 'app-group-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    GroupMemberDialogComponent,
    MatIconModule,
    MatBadgeModule,
    TopbarComponent
  ],
  templateUrl: './group-page.component.html',
  styleUrls: ['./group-page.component.scss']
})

export class GroupPageComponent{

  keyword = '';

  create = 0;

  currentPage = 1;

  groups: any[] = [];

  // 真正顯示的資料
  filteredGroups: any[] = [];

  unreadCount!: number;

  isLoading = true;

  constructor(
    private dialog: MatDialog,
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  user_id = 0;

  ngOnInit(): void {
    this.user_id = this.authService.currentUser()?.user_id ?? 0;
    if (!this.user_id) {
      console.error('user not ready');
      return;
    }
    this.getGroup();
    this.getUnreadNotifyCount();
  }

  getUnreadNotifyCount() {

    this.http.get<any>(
      `${environment.apiUrl}/family_life/get_notify?user_id=${this.user_id}`
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

  getGroup() {

    // const user_id = 1;

    this.isLoading = true;

    this.http.get<any>(
      `${environment.apiUrl}/family_life/get_group_list?user_id=${this.user_id}`
    ).subscribe({

      next: (res) => {
        console.log(res);

        this.groups = res.groupList;

        // 預設全部顯示
        this.filteredGroups = this.groups;

        this.isLoading = false;
        console.log(res.groupList);
      },

      error: (err) => {
        console.log(err);
        this.isLoading = false;
      }

    });

  }

  // 點搜尋按鈕
  searchGroups() {

    this.currentPage = 1;

    // 沒輸入
    if (!this.keyword.trim()) {

      this.filteredGroups = this.groups;
      return;

    }

    // 搜尋
    this.filteredGroups = this.groups.filter(group =>

      group.groupName
        .toLowerCase()
        .includes(this.keyword.toLowerCase())

      ||

      String(group.groupId)
        .includes(this.keyword)

    );

  }

  pageSize = 5;

  get totalPages(): number {
    return Math.ceil(this.filteredGroups.length / this.pageSize) || 1;
  }

  get pagedGroups() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredGroups.slice(
      startIndex,
      startIndex + this.pageSize
    );
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  truncateName(name: string): string {
    if (!name) return '';

    return name.length > 20
      ? name.substring(0, 20) + '....'
      : name;
  }

  openMemberDialog(group: any, user_id: any) {

    this.dialog.open(GroupMemberDialogComponent, {
      width: '500px',
      data: {
        group: group,
        userId: user_id
      }
    });

  }

  joinGroupDialog() {
    Swal.fire({
      title: '群組邀請碼',
      input: 'text',
      showCancelButton: true,
      confirmButtonText: '加入',
      cancelButtonText: '取消',
      showLoaderOnConfirm: true,

      preConfirm: async (inviteCode) => {
        if (!inviteCode) {
          Swal.showValidationMessage('請輸入邀請碼');
          return;
        }
        return inviteCode;
      }

    }).then((result) => {

      if (result.isConfirmed) {

        const invite_code = result.value;

        Swal.fire({
          title: '加入中...請稍後',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // this.http.post(
        //   'http://localhost:8080/family_life/join',
        //   {
        //     inviteCode: invite_code,
        //     userId: Number(this.user_id)
        //   }
        this.http.post(
          `${environment.apiUrl}/family_life/join`,
          {
            inviteCode: invite_code,
            userId: Number(this.user_id)
          }
        ).subscribe({

          next: (res: any) => {
            Swal.close();
            if (res.message === "this id is exist in this group") {
              Swal.fire('你已在群組', '', 'error');

            } else if (res.message === "group not exist") {
              Swal.fire('該群組不存在', '', 'error');

            } else {
              Swal.fire('加入成功', '', 'success');
              this.getGroup();
            }

          },

          error: () => {
            Swal.close()
            Swal.fire('加入失敗', '', 'error');
          }

        });

      }

    });
  }

  private chatDialogs = new Map<number, any>();

  openChatRoom(group: any) {
    const groupId = group.groupId;

    // ❌ 已經開過 → 不再開新視窗
    if (this.chatDialogs.has(groupId)) {

      return;
    }

    let offset = this.dialog.openDialogs.length * 30;

    const dialogRef = this.dialog.open(ChatRoomComponent, {
      position: {
        bottom: `${offset}px`,
        right: `${offset}px`
      },

      width: '420px',
      height: '650px',

      panelClass: 'chat-dialog',

      data: {
        groupId: group.groupId,
        groupName: group.groupName
      },

      // ⭐ 重點：允許多開
      disableClose: false,

      // ⭐ 避免覆蓋（可選）
      hasBackdrop: false,

      // ⭐ 每個 dialog 都可獨立互動
      autoFocus: false
    });

    // 👉 存起來
    this.chatDialogs.set(groupId, dialogRef);

    // 👉 關閉時移除紀錄
    dialogRef.afterClosed().subscribe(() => {
      this.chatDialogs.delete(groupId);
    });

  }

  openCreateDialog() {

    Swal.fire({
      title: '群組名稱',
      input: 'text',
      inputAttributes: {
        autocapitalize: 'off'
      },
      showCancelButton: true,
      confirmButtonText: '建立',
      cancelButtonText: '取消',
      showLoaderOnConfirm: true,

      preConfirm: async (groupName) => {

        if (!groupName) {
          Swal.showValidationMessage('請輸入群組名稱');
          return;
        }

        return groupName;
      },

      allowOutsideClick: () => !Swal.isLoading()

    }).then((result) => {

      if (result.isConfirmed) {

        const groupName = result.value;

        Swal.fire({
          title: '建立群組中...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // ✅ 呼叫後端 create API
        this.http.post(
          `${environment.apiUrl}/family_life/create`,
          {
            groupName: groupName,
            createBy: Number(this.user_id)
          }
        ).subscribe({
          next: (res: any) => {
            Swal.close()
            Swal.fire({
              icon: 'success',
              title: `${groupName} 建立成功`
            });

            // 🔥 建議：重新載入群組列表
            this.getGroup();

          },
          error: (err) => {
            console.log(err);
            Swal.close()
            Swal.fire({
              icon: 'error',
              title: '建立失敗'
            });
          }
        });

      }

    });

  }

  openNotifyDialog() {

    this.dialog.open(NotifyDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      panelClass: 'notify-dialog-panel',

      data: {
        userId: this.user_id,
      }
    });

  }

  openUpdateDialog(group: any, user_id: any) {

    let selectedFile: File | null = null;

    Swal.fire({

      title: '修改群組',

      html: `

        <div
          style="
            display:flex;
            flex-direction:column;
            align-items:center;
            gap:12px;
          "
        >

          <!-- 圖片預覽 -->
          <img
            id="avatarPreview"
            src="${group.avatar || ''}"
            style="
              width:100px;
              height:100px;
              border-radius:50%;
              object-fit:cover;
              border:2px solid #eee;
            "
          />

          <!-- 選擇圖片 -->
          <label
            for="groupAvatar"
            style="
              background:#2f80ed;
              color:white;
              padding:8px 16px;
              border-radius:10px;
              cursor:pointer;
              font-weight:600;
            "
          >
            選擇圖片
          </label>

          <input
            id="groupAvatar"
            type="file"
            accept="image/*"
            style="display:none;"
          />

          <!-- 檔名 -->
          <span
            id="fileName"
            style="
              font-size:13px;
              color:#666;
            "
          >
            尚未選擇圖片
          </span>

          <!-- 群組名稱 -->
          <input
            id="groupName"
            class="swal2-input"
            placeholder="群組名稱"
            value="${group.groupName}"
            style="margin-top:8px;"
          />

        </div>

      `,

      showCancelButton: true,
      confirmButtonText: '修改',
      cancelButtonText: '取消',

      didOpen: () => {

        const fileInput =
          document.getElementById(
            'groupAvatar'
          ) as HTMLInputElement;

        const preview =
          document.getElementById(
            'avatarPreview'
          ) as HTMLImageElement;

        const fileName = document.getElementById('fileName');

        fileInput.addEventListener('change', (event: any) => {

          selectedFile = event.target.files[0];

          if (!selectedFile) {
            return;
          }

          // 顯示檔名
          if (fileName) {
            fileName.textContent = selectedFile.name;
          }

          // 預覽圖片
          const reader = new FileReader();

          reader.onload = (e: any) => {
            preview.src = e.target.result;
          };

          reader.readAsDataURL(selectedFile);

        });
      },

      preConfirm: () => {

        const groupName =
          (
            document.getElementById(
              'groupName'
            ) as HTMLInputElement
          ).value;

        if (!groupName.trim()) {

          Swal.showValidationMessage(
            '請輸入群組名稱'
          );

          return;

        }

        return {
          groupName
        };

      }

    }).then((result) => {

      if (result.isConfirmed) {

        const formData = new FormData();

        formData.append(
          'groupId',
          group.groupId
        );

        formData.append(
          'groupName',
          result.value.groupName
        );

        if (selectedFile) {

          formData.append(
            'avatar',
            selectedFile
          );

        }

        formData.append(
          'createdBy',
          user_id
        );

        Swal.fire({
          title: '更新群組中...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });


        this.http.post(
          `${environment.apiUrl}/family_life/update_group`,
          formData
        ).subscribe({

          next: (res: any) => {
            Swal.close();
            Swal.fire({
              icon: 'success',
              title: '修改成功'
            });

            this.getGroup();

          },

          error: (err) => {
            Swal.close();
            console.log(err);

            Swal.fire({
              icon: 'error',
              title: '修改失敗'
            });

          }

        });

      }

    });

  }

  deleteGroup(group_id: any){
    Swal.fire({
      title: "確定解散?",
      text: "該群組不會還原",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "確定",
      cancelButtonText: "取消"
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: '解散中...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        this.http.delete(
          `${environment.apiUrl}/family_life/delete_group/${group_id}`,
        ).subscribe({

          next: (res: any) => {
            Swal.close();

            console.log(res);

            this.groups = res.groupList;

            Swal.fire({
              icon: 'success',
              title: `解散成功`
            });

            // 🔥 建議：重新載入群組列表
            this.getGroup();

          },

          error: (err) => {
            Swal.close()
            console.log(err);
          }

        });
      }
    });

  }

getAvatarUrl(avatar: string): string {
  if (!avatar) return 'default.png';
  if (avatar.startsWith('http')) return avatar; // 舊資料相容
  return environment.apiUrl + avatar; // 自動補上當前 host
}
}
