import { Component } from '@angular/core';
import { TopbarComponent } from '../../shared/topbar/topbar.component';
import { RouterLink } from '@angular/router';
import Swal, { SweetAlertResult } from 'sweetalert2';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [TopbarComponent, RouterLink, CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {

  // 使用者名稱
  userName = 'Jack';

  // Email
  email = 'jack@example.com';

  // 頭像預設文字
  avatarText = 'J';

  // 頭像圖片，空值代表用文字頭像
  avatarUrl = '';

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
      confirmButtonText: '儲存修改',
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
    confirmButtonText: '儲存',
    cancelButtonText: '取消',

    preConfirm: () => {
      const input = document.getElementById('avatarInput') as HTMLInputElement;
      const file = input.files?.[0];

      if (!file) {
        Swal.showValidationMessage('請選擇一張圖片');
        return false;
      }

      return file;
    }
  }).then((result) => {
    if (!result.isConfirmed || !result.value) {
      return;
    }

 const file = result.value as File;
  const reader = new FileReader();

 reader.onload = () => {
  this.avatarUrl = reader.result as string;

  // 存到 localStorage
  localStorage.setItem('avatarUrl', this.avatarUrl);

  // 通知 topbar 重新讀取頭像
  window.dispatchEvent(new Event('avatarChanged'));
}
  reader.readAsDataURL(file);
  });


}}
