import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-topbar',
  imports: [RouterLink, CommonModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
avatarUrl = '';
 ngOnInit(): void {
    this.loadAvatar();

    // 監聽頭像更新事件
    window.addEventListener('avatarChanged', this.loadAvatar);
  }

  ngOnDestroy(): void {
    // 離開頁面時移除監聽，避免記憶體問題
    window.removeEventListener('avatarChanged', this.loadAvatar);
  }

  // 讀取 localStorage 裡的頭像
  loadAvatar = (): void => {
    this.avatarUrl = localStorage.getItem('avatarUrl') || '';
  };
}
