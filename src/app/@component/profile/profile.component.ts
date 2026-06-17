import { GroupList } from './../../common/interfaceList';
import { Component } from '@angular/core';
import { TopbarComponent } from '../../shared/topbar/topbar.component';
import { RouterLink } from '@angular/router';
import Swal, { SweetAlertResult } from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { NotifySettingService } from '../../@services/NotifySettingService';
import { AuthService } from '../../@services/auth.service';
import { map } from 'rxjs';

import { CanComponentDeactivate } from '../../@guard/pending-changes.guard';
import { EmailVerifyService } from './../../@services/EmailVerifyService';
import { HttpClientService } from '../../@services/http-client.service';
import { environment } from '../../@models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [TopbarComponent, RouterLink, CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements CanComponentDeactivate {
  // 使用者名稱
  userName = 'Jack';

  // Email
  email = 'jack@example.com';

  // 頭像預設文字
  avatarText = 'U';

  // 頭像圖片，空值代表用文字頭像
  avatarUrl = '';

  groups: any[] = [];

  //到期通知
  endDateNotify = false;

  //email通知
  emailNotify = false;

  //公開個人清單
  publicInventoryObj: { [groupId: number]: boolean } = {};

  //大頭貼
  file: any;

  //切到其它分頁時護衛模式
  isDirty = false;

  //email驗證
  emailVerify = false;

  isLoading = false;

  constructor(
    // private http: HttpClient,
    private authService: AuthService,
    private notifySettingService: NotifySettingService, //共享userInfo
    private readonly emailVerifyService: EmailVerifyService,
    private readonly http: HttpClientService,
  ) {}

  user_id = 0;
<<<<<<< HEAD
  getAvatar(avatar: string): string {
    if (!avatar) return 'default.png';
    if (avatar.startsWith('http')) return avatar; // 舊資料相容
    console.log("avatar:", window.location.origin + avatar)
    return window.location.origin + avatar; // 自動補上當前 host
=======
  getAvatar(avatar?: string | null): string {
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
>>>>>>> origin/feature-calendar
  }

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.user_id = this.authService.currentUser()?.user_id ?? 0;
    this.getGroup();
    this.getSelfInfo();
    // console.log(this.authService);
  }

  getSelfInfo() {
    this.http.getApi(`users/get_user_info?userId=${this.user_id}`).subscribe({
      next: (res: any) => {
        this.userName = res.name;
        this.email = res.email;
        this.endDateNotify = res.notifyByEndDate;
        this.emailNotify = res.notifyByEmail;
        this.avatarUrl = res.avatar;
        this.emailVerify = res.emailVerify;
        console.log(res.avatar);

        //共享userInfo
        this.notifySettingService.setName(res.name);
        this.notifySettingService.setNotifyByEndDate(res.notifyByEndDate);
        this.notifySettingService.setNotifyByEmail(res.notifyByEmail);
      },

      error: (err) => {
        console.log(err);
      },
    });
  }

  getGroup() {
    this.isLoading = true;

    this.user_id = this.authService.currentUser()?.user_id ?? 0;

    console.log('userId: ' + this.user_id);

    // this.http.get<any>(
    //   `http://localhost:8080/family_life/get_group_list?user_id=${this.user_id}`
    // )
    this.http
      .getApi(`family_life/get_group_list?user_id=${this.user_id}`)
      .subscribe({
        next: (res: any) => {
          this.groups = res.groupList;

          res.groupList.forEach((group: any, index: number) => {
            this.publicInventoryObj[group.groupId] =
              !!res.publicInventory[index];
          });

          this.isLoading = false;

          console.log('list001:', this.publicInventoryObj[22]);
        },

        error: (err) => {
          this.isLoading = false;
          console.log(err);
        },
      });
  }

  truncateName(name: string): string {
    if (!name) return '';

    return name.length > 8 ? name.substring(0, 8) + '....' : name;
  }

  copyInviteCode(n: any) {
    navigator.clipboard.writeText(n.inviteCode);

    Swal.fire({
      icon: 'success',
      title: '邀請碼已複製',
      timer: 1200,
      showConfirmButton: false,
    });
  }

  // 開啟修改資料彈窗
  openEditDialog(): void {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    Swal.fire({
      title: '修改基本資料',

      html: `
        <div class="swal-form">

          <!-- 頭像預覽 + 上傳 -->
          <div style="text-align:center; margin-bottom:16px;">
            <img id="avatarPreview"
                src="${this.avatarUrl || ''}"
                style="width:90px;height:90px;border-radius:50%;object-fit:cover;border:2px solid #eee;" />

            <div style="margin-top:12px;">
              <label
                for="avatarInput"
                style="
                  display:inline-block;
                  padding:8px 16px;
                  background:#2f80ed;
                  color:white;
                  border-radius:10px;
                  cursor:pointer;
                  font-weight:600;
                ">
                選擇圖片
              </label>

              <input
                id="avatarInput"
                type="file"
                accept="image/*"
                style="display:none;"
              />

              <div
                id="fileName"
                style="
                  margin-top:8px;
                  font-size:13px;
                  color:#666;
                ">
                尚未選擇圖片
              </div>
            </div>
          </div>


          <div class="swal-row">
            <label>使用者名稱</label>
            <input id="editUserName"
                  class="swal2-input"
                  value="${this.userName}">
          </div>

        </div>
      `,

      showCancelButton: true,
      confirmButtonText: '修改',
      cancelButtonText: '取消',

      didOpen: () => {
        // ⭐ 即時預覽頭像
        const input = document.getElementById(
          'avatarInput',
        ) as HTMLInputElement;
        const preview = document.getElementById(
          'avatarPreview',
        ) as HTMLImageElement;
        const fileName = document.getElementById('fileName');

        input?.addEventListener('change', () => {
          const file = input.files?.[0];
          if (file) {
            preview.src = URL.createObjectURL(file);

            if (fileName) {
              fileName.textContent = file.name;
            }
          }
        });
      },

      preConfirm: () => {
        const userName = (
          document.getElementById('editUserName') as HTMLInputElement
        ).value.trim();
        // const email = (document.getElementById('editEmail') as HTMLInputElement).value.trim();
        const file = (
          document.getElementById('avatarInput') as HTMLInputElement
        ).files?.[0];

        if (!userName) {
          Swal.showValidationMessage('使用者名稱不可為空');
          return false;
        }

        // if (!email) {
        //   Swal.showValidationMessage('Email 不可為空');
        //   return false;
        // }

        // if (!emailPattern.test(email)) {
        //   Swal.showValidationMessage('Email 格式錯誤');
        //   return false;
        // }

        // if (email === "familyLifeTest123456@gmail.com") {
        //   Swal.showValidationMessage('這是官方 email!!');
        //   return false;
        // }

        return {
          userName,
          // email,
          file,
        };
      },
    }).then((result) => {
      if (!result.isConfirmed || !result.value) return;

      // 更新資料
      this.userName = result.value.userName;
      // this.email = result.value.email;

      // ⭐ 如果有新頭像
      if (result.value.file) {
        this.file = result.value.file;
        this.avatarUrl = URL.createObjectURL(this.file);
      }

      this.notifySettingService.setName(this.userName);
      this.isDirty = true;

      Swal.fire({
        icon: 'success',
        title: '修改成功',
        timer: 1200,
        showConfirmButton: false,
      });
    });
  }

  saveAll() {
    const payload = this.groups.map((g) => ({
      groupId: g.groupId,
      publicInventory: this.publicInventoryObj[g.groupId] ?? false,
    }));

    const formData = new FormData();

    formData.append(
      'userInfo',
      new Blob(
        [
          JSON.stringify({
            userId: this.user_id,
            userName: this.userName,
            email: this.email,
            notifyByEndDate: this.endDateNotify,
            notifyByEmail: this.emailNotify,
          }),
        ],
        { type: 'application/json' },
      ),
    );

    formData.append(
      'publicInventoryList',
      new Blob([JSON.stringify(payload)], { type: 'application/json' }),
    );

    // 有選新頭像時才送 avatar
    if (this.file) {
      formData.append('avatar', this.file);
    }

    Swal.fire({
      title: '儲存中...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // this.http.post(
    //   'http://localhost:8080/users/update_info',
    //   formData
    // )
    this.http.postApi('users/update_info', formData).subscribe({
      next: (res: any) => {
        if (res.code !== 200) {
          Swal.close();
          Swal.fire({
            icon: 'error',
            title: '儲存失敗',
            text: res.message || '資料更新失敗',
          });
          return;
        }

        Swal.fire({
          icon: 'success',
          title: '已儲存',
          text: '資料已更新',
          timer: 1000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end',
        });

        //共享info
        this.notifySettingService.setName(this.userName);
        this.notifySettingService.setNotifyByEndDate(this.endDateNotify);
        this.notifySettingService.setNotifyByEmail(this.emailNotify);

        //存進db
        this.isDirty = false;

        // 清掉暫存檔案，避免下次儲存又重複上傳同一張
        this.file = null;

        // 重新抓資料庫最新資料
        this.getSelfInfo();

        // 通知 topbar 重新讀取資料庫頭像
        window.dispatchEvent(new Event('avatarChanged'));
      },

      error: (err) => {
        Swal.close();
        Swal.fire({
          icon: 'error',
          title: '失敗',
          text: err.error?.message || '伺服器發生錯誤',
        });

        console.log(err);
      },
    });
  }

  canDeactivate(): Promise<boolean> | boolean {
    if (!this.isDirty) {
      return true;
    }

    return Swal.fire({
      title: '尚未儲存',
      text: '是否離開此頁面？未儲存的資料將會遺失',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '離開',
      cancelButtonText: '留在此頁',
    }).then((result) => {
      return result.isConfirmed;
    });
  }
}
