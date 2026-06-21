import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  HostListener,
  AfterViewChecked,
  Inject,
  NgZone
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ChatWsService } from '../../@services/ChatWsService';
import { AuthService } from '../../@services/auth.service';
import { environment } from '../../@models/user.model';
import Swal from 'sweetalert2';
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, MatIconModule],
  templateUrl: './chat-room.component.html',
  styleUrl: './chat-room.component.scss',
})
export class ChatRoomComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollBox') scrollBox!: ElementRef;
  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth <= 600;
  }

  groupId!: number;
  userId!: number;
  groupName!: string;

  message = '';

  messages: any[] = [];

  onlineCount!: number;

  hasLoaded = false;
  isLoadingMessages = true;
  // 圖片預覽狀態
  imagePreviewVisible = false;
  previewImageUrl = '';
  previewImageTitle = '';
  previewScale = 1;
  previewRotate = 0;

  //未讀
  firstUnreadIndex = -1;

  // =====================
  // 右鍵選單
  // =====================

  showMenu = false;

  menuX = 0;
  menuY = 0;

  selectedMessage: any = null;

  // =====================
  // 回覆訊息
  // =====================

  editingId?: number;

  replyMessage: any = null;

  constructor(
    private http: HttpClient,
    private ws: ChatWsService,
    private dialogRef: MatDialogRef<ChatRoomComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private authService: AuthService,
    private zone: NgZone,
  ) {}

  isMobile = false;

  async ngOnInit() {
    this.groupName = this.data.groupName;

    this.isMobile = this.data.isMobile ?? window.innerWidth <= 600;

    this.userId = this.authService.currentUser()?.user_id ?? 0;

    this.groupId = this.data.groupId;

    console.log('目前聊天室 groupId =', this.groupId);
    console.log('目前 userId =', this.userId);

    this.loadMessages();

    // WebSocket
    await this.ws.connect();

    this.ws.subscribe(this.groupId, (msg: any) => {
      this.zone.run(() => {
        switch (msg.type) {
          case 'ONLINE':
            this.onlineCount = msg.count;
            break;

          case 'MESSAGE':
          case 'IMAGE':

            this.messages = [...this.messages, msg];

            this.calculateUnreadIndex(); // ⭐補這個

            break;

          case 'READ':
            this.updateReadCount(msg);
            this.calculateUnreadIndex();
            break;

          case 'EDIT':
            const editTarget = this.messages.find(
              (m) => m.id === msg.messageId,
            );

            if (editTarget) {
              editTarget.message = msg.message;

              editTarget.edited = true;
            }

            break;

          case 'RECALL':
            const recallTarget = this.messages.find(
              (m) => m.id === msg.messageId,
            );

            if (recallTarget) {
              recallTarget.recalled = true;
            }

            break;
        }
      });

      setTimeout(() => {
        this.scrollToBottom();
      }, 50);
    });
  }

  ngAfterViewChecked() {
    if (this.hasLoaded) {
      this.scrollToBottom();

      this.hasLoaded = false;
    }
  }

  loadMessages() {
    this.isLoadingMessages = true;

    this.http
      .get<any>(
        `${environment.apiUrl}/chat/${this.groupId}?userId=${this.userId}`,
      )
      .subscribe({
        next: (res) => {
          this.messages = res.messages ?? [];
          console.log(this.messages);

          // console.log('收到訊息筆數 =', this.messages.length);
          // console.log('第一筆 id =', this.messages[0]?.id);
          // console.log('最後一筆 id =', this.messages[this.messages.length - 1]?.id);
          // console.log('最後一筆訊息 =', this.messages[this.messages.length - 1]);

          this.firstUnreadIndex = this.messages.findIndex((m) => !m.readByMe);

          console.log('firstUnreadIndex=', this.firstUnreadIndex);

          this.markRead();

          this.hasLoaded = true;

          this.isLoadingMessages = false;
        },

        error: () => {
          this.isLoadingMessages = false;
        },
      });
  }

  sendMessage() {
    if (!this.message.trim()) {
      return;
    }

    this.ws.sendMessage({
      groupId: this.groupId,
      senderId: this.userId,
      message: this.message,

      replyId: this.replyMessage?.id || null,
    });

    this.message = '';

    setTimeout(() => {
      this.scrollToBottom();
    }, 200);
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    const formData = new FormData();

    formData.append('file', file);

    formData.append('groupId', this.groupId.toString());

    formData.append('senderId', this.userId.toString());

    this.http.post(`${environment.apiUrl}/chat/upload`, formData).subscribe({
      next(res) {},
      error: (err) => {
        Swal.fire({
          title: '圖片上傳失敗',
          text: err.message,
          icon: 'error',
        });
      },
    });
  }

  updateReadCount(msg: any) {
    const target = this.messages.find((m) => m.id === msg.messageId);

    if (target) {
      target.readCount = msg.readCount;
    }
  }

  markRead() {

    this.http.post(
      `${environment.apiUrl}/chat/read/${this.groupId}?userId=${this.userId}`,
      {}
    ).subscribe(() => {

      // ⭐ 很重要：重新計算未讀
      this.messages.forEach(m => {
        m.readByMe = true;
      });

      this.calculateUnreadIndex();
    });
  }

  scrollToBottom() {
    if (!this.scrollBox) {
      return;
    }

    const el = this.scrollBox.nativeElement;

    el.scrollTop = el.scrollHeight;
  }

  // =====================
  // 右鍵選單
  // =====================

  openContextMenu(event: MouseEvent, msg: any) {
    event.preventDefault();
    event.stopPropagation();

    this.selectedMessage = msg;

    const menuWidth = 160;
    const menuHeight = 140;

    let x = event.clientX;
    let y = event.clientY;

    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }

    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }

    this.menuX = x;
    this.menuY = y;

    this.showMenu = true;

    // ⭐關鍵：強制移到 body
    setTimeout(() => {
      const menu = document.querySelector('.context-menu') as HTMLElement;

      if (menu) {
        document.body.appendChild(menu);
      }
    });
  }

  @HostListener('document:click')
  closeMenu() {
    this.showMenu = false;
  }

  // =====================
  // 複製
  // =====================

  copyMessage() {
    if (!this.selectedMessage) {
      return;
    }

    navigator.clipboard.writeText(this.selectedMessage.message);

    this.showMenu = false;
  }

  // =====================
  // 回復
  // =====================

  replyFromMenu() {
    if (!this.selectedMessage) {
      return;
    }

    this.replyMessage = this.selectedMessage;

    this.showMenu = false;
  }

  // =====================
  // 收回
  // =====================

  recallMessageFromMenu() {
    if (!this.selectedMessage) {
      return;
    }

    this.showMenu = false;

    // =========================
    // Step 1：確認
    // =========================
    Swal.fire({
      title: '確定收回此訊息？',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '收回',
      cancelButtonText: '取消',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      // =========================
      // Step 2：loading
      // =========================
      Swal.fire({
        title: '收回中...',
        text: '請稍候',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // =========================
      // Step 3：API
      // =========================
      this.http
        .post(
          `${environment.apiUrl}/chat/message/${this.selectedMessage.id}/recall`,
          {},
        )
        .subscribe({
          next: () => {
            // 關掉 loading
            Swal.close();

            // UI 更新
            this.selectedMessage.recalled = true;

            // Swal.fire({
            //   title: '已收回',
            //   icon: 'success',
            //   timer: 1200,
            //   showConfirmButton: false
            // });
          },

          error: (err) => {
            Swal.close();

            Swal.fire({
              title: '收回失敗',
              text: err.message || '請稍後再試',
              icon: 'error',
            });
          },
        });
    });
  }

  //超過一天不可收回
  canRecall(msg: any): boolean {
    if (msg.recalled) {
      return false;
    }

    const created = new Date(msg.createTime).getTime();

    const diffDays = (Date.now() - created) / (1000 * 60 * 60 * 24);

    return diffDays < 1; // ⭐ 2天內可收回
  }

  // =====================
  // 關閉聊天室
  // =====================

  closeChat() {
    this.dialogRef.close();
  }

  getAvatar(avatar?: string | null): string {
    // console.log('getAvatar', avatar);
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

  //未讀+日期顯示
  isNewDate(current: any, previous?: any): boolean {
    if (!previous) {
      return true;
    }

    const d1 = new Date(current.createTime);
    const d2 = new Date(previous.createTime);

    return (
      d1.getFullYear() !== d2.getFullYear() ||
      d1.getMonth() !== d2.getMonth() ||
      d1.getDate() !== d2.getDate()
    );
  }

  calculateUnreadIndex() {
    this.firstUnreadIndex =
      this.messages.findIndex(m => !m.readByMe);
  }

  formatDate(date: string): string {
    const d = new Date(date);

    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(
      2,
      '0',
    )}/${String(d.getDate()).padStart(2, '0')}`;
  }
  // 開啟圖片預覽
  openImagePreview(imageUrl: string, title: string = '圖片'): void {
    if (!imageUrl) return;
    this.previewImageUrl = imageUrl;
    this.previewImageTitle = title;
    this.previewScale = 1;
    this.previewRotate = 0;
    this.imagePreviewVisible = true;
      // ⭐關鍵：強制移到 body（避免被 cdkDrag 的 transform 影響 fixed 定位）
  setTimeout(() => {
    const preview =
      document.querySelector('.image-preview-overlay') as HTMLElement;

    if (preview) {
      document.body.appendChild(preview);
    }
  });
  }

  // 關閉圖片預覽
  closeImagePreview(): void {
    this.imagePreviewVisible = false;
    this.previewImageUrl = '';
    this.previewImageTitle = '';
    this.previewScale = 1;
    this.previewRotate = 0;
  }

  zoomIn(): void {
    if (this.previewScale >= 3) return;
    this.previewScale = Number((this.previewScale + 0.2).toFixed(1));
  }

  zoomOut(): void {
    if (this.previewScale <= 0.4) return;
    this.previewScale = Number((this.previewScale - 0.2).toFixed(1));
  }

  rotateLeft(): void {
    this.previewRotate -= 90;
  }

  rotateRight(): void {
    this.previewRotate += 90;
  }

  resetPreview(): void {
    this.previewScale = 1;
    this.previewRotate = 0;
  }

  onPreviewWheel(event: WheelEvent): void {
    event.preventDefault();
    event.deltaY < 0 ? this.zoomIn() : this.zoomOut();
  }
}
