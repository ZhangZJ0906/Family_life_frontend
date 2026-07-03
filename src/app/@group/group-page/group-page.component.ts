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
    const dialogRef = this.dialog.open(GroupMemberDialogComponent, {
      width: '500px',
      data: {
        group,
        userId: user_id
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      // 如果 dialog 有做「退出/變動」
      if (result?.refreshed) {
        this.getGroup(); // ← 重新抓群組列表
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

    // 已經開過 → 不再開新視窗
    if (this.chatDialogs.has(groupId)) {
      return;
    }

    const isMobile = window.innerWidth <= 600;

    const offset = this.dialog.openDialogs.length * 30;

    const dialogRef = this.dialog.open(ChatRoomComponent, {
      // 手機全螢幕不要 position；桌機才靠右下角
      position: isMobile
        ? {}
        : {
            bottom: `${offset}px`,
            right: `${offset}px`
          },

      // 手機全螢幕；桌機固定大小
      width: isMobile ? '100vw' : '420px',
      height: isMobile ? '100dvh' : '650px',

      maxWidth: isMobile ? '100vw' : '95vw',
      maxHeight: isMobile ? '100dvh' : '90vh',

      panelClass: isMobile
        ? ['chat-dialog', 'chat-dialog-mobile']
        : ['chat-dialog'],

      data: {
        groupId: group.groupId,
        groupName: group.groupName,
        isMobile: isMobile
      },

      disableClose: false,

      // 手機建議有 backdrop，桌機多開才不要 backdrop
      hasBackdrop: isMobile ? true : false,

      autoFocus: false
    });

    this.chatDialogs.set(groupId, dialogRef);

    dialogRef.afterClosed().subscribe(() => {
      this.chatDialogs.delete(groupId);
    });
  }

  //取代字元 => 把「危險字元」變成「純文字」
  escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
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

      // ✅ 前端防呆 + 基本 XSS 防護
      preConfirm: (groupName) => {

        if (!groupName || !groupName.trim()) {
          Swal.showValidationMessage('請輸入群組名稱');
          return;
        }

        // 🚨 防止奇怪控制字元 / injection（加強版）
        const cleanName = groupName
          .trim()
          .replace(/[<>]/g, ''); // 防止 < > 基本 payload

        return cleanName;
      },

      allowOutsideClick: () => !Swal.isLoading()

    }).then((result) => {

      if (!result.isConfirmed) return;

      const groupName = result.value;

      Swal.fire({
        title: '建立群組中...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      this.http.post(
        `${environment.apiUrl}/family_life/create`,
        {
          groupName: groupName,
          createBy: Number(this.user_id)
        }
      ).subscribe({

        next: (res: any) => {
          Swal.close();

          // ⚠️ title 也要避免 HTML injection
          Swal.fire({
            icon: 'success',
            title: this.escapeHtml(groupName) + ' 建立成功'
          });

          this.getGroup();
        },

        error: () => {
          Swal.close();
          Swal.fire({
            icon: 'error',
            title: '建立失敗'
          });
        }
      });

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

      // ❌ 不用 html（避免 XSS）
      showCancelButton: true,
      confirmButtonText: '修改',
      cancelButtonText: '取消',

      didOpen: () => {
        const container = Swal.getHtmlContainer();

        if (!container) return;

        // 清空
        container.innerHTML = '';

        // ===== 外層排版（跟你原本 SweetAlert 類似 vertical layout）=====
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '12px';

        // ===== 圖片 =====
        const img = document.createElement('img');
        img.src = group.avatar || 'assets/default-avatar.png';
        img.style.width = '100px';
        img.style.height = '100px';
        img.style.borderRadius = '50%';
        img.style.objectFit = 'cover';
        img.style.border = '2px solid #eee';

        // ===== file input =====
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';

        const fileBtn = document.createElement('button');
        fileBtn.innerText = '選擇圖片';
        fileBtn.style.background = '#2f80ed';
        fileBtn.style.color = '#fff';
        fileBtn.style.border = 'none';
        fileBtn.style.padding = '8px 16px';
        fileBtn.style.borderRadius = '10px';
        fileBtn.style.cursor = 'pointer';

        const fileName = document.createElement('span');
        fileName.innerText = '尚未選擇圖片';
        fileName.style.fontSize = '13px';
        fileName.style.color = '#666';

        fileBtn.onclick = () => fileInput.click();

        fileInput.addEventListener('change', (e: any) => {
          selectedFile = e.target.files[0];

          if (!selectedFile) return;

          fileName.innerText = selectedFile.name;

          const reader = new FileReader();
          reader.onload = (ev: any) => {
            img.src = ev.target.result;
          };
          reader.readAsDataURL(selectedFile);
        });

        // ===== group name input =====
        const input = document.createElement('input');
        input.type = 'text';
        input.value = group.groupName;
        input.placeholder = '群組名稱';

        input.style.width = '80%';
        input.style.padding = '8px';
        input.style.border = '1px solid #ddd';
        input.style.borderRadius = '6px';

        // ===== append =====
        wrapper.appendChild(img);
        wrapper.appendChild(fileBtn);
        wrapper.appendChild(fileInput);
        wrapper.appendChild(fileName);
        wrapper.appendChild(input);

        container.appendChild(wrapper);

        // ===== override SweetAlert confirm behavior =====
        Swal.getConfirmButton()?.addEventListener('click', () => {
          const groupName = input.value;

          if (!groupName.trim()) {
            Swal.showValidationMessage('請輸入群組名稱');
            return;
          }

          const formData = new FormData();
          formData.append('groupId', group.groupId);
          formData.append('groupName', groupName);

          if (selectedFile) {
            formData.append('avatar', selectedFile);
          }

          formData.append('createdBy', user_id);

          Swal.fire({
            title: '更新中...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
          });

          this.http.post(
            `${environment.apiUrl}/family_life/update_group`,
            formData
          ).subscribe({
            next: () => {
              Swal.close();
              Swal.fire('修改成功', '', 'success');
              this.getGroup();
            },
            error: () => {
              Swal.close();
              Swal.fire('修改失敗', '', 'error');
            }
          });
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

getAvatarUrl(avatar?: string | null): string {
  if (!avatar || avatar.trim() === '') {
    return 'assets/default-avatar.png';
  }

  if (avatar.startsWith('http://localhost:8081')) {
    return avatar.replace('http://localhost:8081', window.location.origin + '/api');
  }

  if (avatar.startsWith('http://localhost:8080')) {
    return avatar.replace('http://localhost:8080', window.location.origin + '/api');
  }

  if (avatar.startsWith('http')) {
    return avatar;
  }

  if (avatar.startsWith('/')) {
    return window.location.origin + '/api' + avatar;
  }

  return window.location.origin + '/api/' + avatar;
}
}
