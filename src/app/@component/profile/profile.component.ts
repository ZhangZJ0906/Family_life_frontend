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

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [TopbarComponent, RouterLink, CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
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
  endDateNotify = true;

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
    private http: HttpClient,
    private authService: AuthService,
    private notifySettingService: NotifySettingService //共享userInfo
  ) {}

  user_id = 0;

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.user_id = this.authService.currentUser()?.user_id ?? 0;
    this.getGroup();
    this.getSelfInfo();
    // console.log(this.authService);
  }

  getSelfInfo(){
    this.http.get<any>(
      `http://localhost:8080/users/get_user_info?userId=${this.user_id}`
    ).subscribe({

      next: (res) => {

        this.userName = res.name;
        this.email = res.email;
        this.endDateNotify = res.notifyByEndDate;
        this.emailNotify = res.notifyByEmail;
        this.avatarUrl = res.avatar;
        this.emailVerify = res.emailVerify;
        console.log(res.notifyByEmail)

        //共享userInfo
        this.notifySettingService.setName(res.name);
        this.notifySettingService.setNotifyByEndDate(res.notifyByEndDate);
        this.notifySettingService.setNotifyByEmail(res.notifyByEmail);
      },

      error: (err) => {
        console.log(err);
      }

    });

  }

  getGroup() {

    this.isLoading = true;

    this.user_id = this.authService.currentUser()?.user_id ?? 0;

    console.log("userId: " + this.user_id);

    this.http.get<any>(
      `http://localhost:8080/family_life/get_group_list?user_id=${this.user_id}`
    ).subscribe({

      next: (res) => {

        this.groups = res.groupList;

        res.groupList.forEach((group: any, index: number) => {
          this.publicInventoryObj[group.groupId] = !!res.publicInventory[index];
        });

        this.isLoading = false;

        console.log("list001:", this.publicInventoryObj[22]);
      },

      error: (err) => {
        this.isLoading = false;
        console.log(err);
      }

    });

  }

  truncateName(name: string): string {
    if (!name) return '';

    return name.length > 8
      ? name.substring(0, 8) + '....'
      : name;
  }

  copyInviteCode(n :any) {

    navigator.clipboard.writeText(
      n.inviteCode
    );

    Swal.fire({
      icon: 'success',
      title: '邀請碼已複製',
      timer: 1200,
      showConfirmButton: false
    });

  }

  // 開啟修改資料彈窗
  openEditDialog(): void {

    // 測試按鈕是否有觸發
    console.log('修改按鈕被點擊');

    Swal.fire({
      title: '修改基本資料',

      html: `
        <div class="swal-form">

          <div class="swal-row">
            <label>使用者名稱</label>
            <input id="editUserName" class="swal2-input" value="${this.userName}">
          </div>

          <div class="swal-row">
            <label>Email</label>
            <input id="editEmail" class="swal2-input" value="${this.email}">
          </div>

        </div>
      `,

      showCancelButton: true,
      confirmButtonText: '修改',
      cancelButtonText: '取消',

      preConfirm: () => {
        const userName = (document.getElementById('editUserName') as HTMLInputElement).value.trim();
        const email = (document.getElementById('editEmail') as HTMLInputElement).value.trim();

        if (!userName) {
          Swal.showValidationMessage('使用者名稱不可為空');
          return false;
        }

        if (!email) {
          Swal.showValidationMessage('Email 不可為空');
          return false;
        }

        return {
          userName,
          email
        };
      }
    }).then((result: SweetAlertResult<{ userName: string; email: string }>) => {

      if (!result.isConfirmed || !result.value) {
        return;
      }

      // 更新畫面上的資料
      this.userName = result.value.userName;
      this.email = result.value.email;

      //共享
      this.notifySettingService.setName(this.userName);

      //暫存
      this.isDirty = true;

      Swal.fire({
        icon: 'success',
        title: '修改成功',
        confirmButtonText: '確認',
        showConfirmButton: true
      });
    });
  }

// 開啟更換頭像視窗
openAvatarDialog(): void {
 Swal.fire({
    title: '更換頭像',

    html: `
      <div class="avatar-dialog">
        <input id="avatarInput" type="file" accept="image/*" class="swal2-file">
      </div>
    `,

    showCancelButton: true,
    confirmButtonText: '修改',
    cancelButtonText: '取消',

    preConfirm: () => {
      const input = document.getElementById('avatarInput') as HTMLInputElement;
      const selectedFile = input.files?.[0];

      if (!selectedFile) {
        Swal.showValidationMessage('請選擇一張圖片');
        return false;
      }

      return selectedFile;
    }
  }).then((result) => {
    if (!result.isConfirmed || !result.value) {
      return;
    }

    // 1. 暫存使用者選到的檔案
    this.file = result.value as File;

    // 2. 先在畫面上預覽新頭像
    this.avatarUrl = URL.createObjectURL(this.file);

    //暫存
    this.isDirty = true;
  });

  }

  saveAll(){
    const payload = this.groups.map(g => ({
      groupId: g.groupId,
      publicInventory: this.publicInventoryObj[g.groupId] ?? false
    }));

    const formData = new FormData();

    formData.append(
      'userInfo',
      new Blob(
        [JSON.stringify({
          userId: this.user_id,
          userName: this.userName,
          email: this.email,
          notifyByEndDate: this.endDateNotify,
          notifyByEmail: this.emailNotify
        })],
        { type: 'application/json' }
      )
    );

    formData.append(
      'publicInventoryList',
      new Blob(
        [JSON.stringify(payload)],
        { type: 'application/json' }
      )
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
      }
    });

    this.http.post(
      'http://localhost:8080/users/update_info',
      formData
    ).subscribe({
      next: (res: any) => {
        if (res.code !== 200) {
          Swal.close()
          Swal.fire({
            icon: 'error',
            title: '儲存失敗',
            text: res.message || '資料更新失敗'
          });
          return;
        }

        Swal.fire({
          icon: 'success',
          title: '已儲存',
          text: '資料已更新',
          confirmButtonText: '確認'
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
        Swal.close()
        Swal.fire({
          icon: 'error',
          title: '失敗',
          text: err.error?.message || '伺服器發生錯誤'
        });

        console.log(err);
      }
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
      cancelButtonText: '留在此頁'
    }).then(result => {
      return result.isConfirmed;
    });
  }

  verifyEmailExist(emailVerify: boolean) {
    if(emailVerify){
      this.emailNotify = true;
    }
    else{
      Swal.fire({
        title: '正在送驗證碼到你的gmail...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      this.http.post('http://localhost:8080/users/send',
        {
          email: this.email
        }
      ).subscribe({

        next: (res: any) => {
          Swal.close()
          Swal.fire('驗證碼已送出', '', 'success');

        },
        error: () => {
          Swal.close()
          Swal.fire('送出失敗', '', 'error');
        }
      });
      Swal.fire({
        title: '輸入驗證碼',
        input: 'text',
        inputPlaceholder: '請輸入驗證碼',
        showCancelButton: true,
        confirmButtonText: '驗證',
        cancelButtonText: '取消',

        preConfirm: async (verifyCode) => {

          if (!verifyCode) {
            Swal.showValidationMessage('請輸入驗證碼');
            return;
          }

          return verifyCode;
        }

      }).then((result) => {

        if (result.isConfirmed) {
          Swal.fire({
            title: '驗證中...',
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });

          this.http.post(
            'http://localhost:8080/users/verify',
            {
              email: this.email,
              code: result.value
            }
          ).subscribe({

            next: (res: any) => {
              Swal.close()
              if(res == "驗證成功"){
                Swal.fire('驗證成功', '', 'success');
                this.emailNotify = true;
              }
            },

            error: () => {
              Swal.close()
              Swal.fire('驗證失敗', '', 'error');
            }

          });

        }

      });
    }
  }
}
