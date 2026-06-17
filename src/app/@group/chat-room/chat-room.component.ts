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

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
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

    this.userId =
      this.authService.currentUser()?.user_id ?? 0;

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
            this.messages = [...this.messages, msg];
            break;

          case 'IMAGE':
            this.messages = [...this.messages, msg];
            break;

          case 'READ':
            this.updateReadCount(msg);
            break;

          case 'EDIT':

            const editTarget =
              this.messages.find(
                m => m.id === msg.messageId
              );

            if (editTarget) {

              editTarget.message = msg.message;

              editTarget.edited = true;
            }

            break;

          case 'RECALL':

            const recallTarget =
              this.messages.find(
                m => m.id === msg.messageId
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
      }
    );
  }

  ngAfterViewChecked() {
    if (this.hasLoaded) {

      this.scrollToBottom();

      this.hasLoaded = false;
    }
  }

  loadMessages() {
    this.isLoadingMessages = true;

    this.http.get<any>(`${environment.apiUrl}/chat/${this.groupId}`).subscribe({
      next: (res) => {
        this.messages = res.messages ?? [];
        console.log(this.messages)

        console.log('收到訊息筆數 =', this.messages.length);
        console.log('第一筆 id =', this.messages[0]?.id);
        console.log('最後一筆 id =', this.messages[this.messages.length - 1]?.id);
        console.log('最後一筆訊息 =', this.messages[this.messages.length - 1]);
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

      replyId:
        this.replyMessage?.id || null
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

    formData.append(
      'file',
      file
    );

    formData.append(
      'groupId',
      this.groupId.toString()
    );

    formData.append(
      'senderId',
      this.userId.toString()
    );

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

      target.readCount =
        msg.readCount;
    }
  }

  markRead() {

    this.http.post(
      `${environment.apiUrl}/chat/read/${this.groupId}?userId=${this.userId}`,
      {}
    ).subscribe();
  }

  scrollToBottom() {

    if (!this.scrollBox) {
      return;
    }

    const el =
      this.scrollBox.nativeElement;

    el.scrollTop =
      el.scrollHeight;
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
      const menu =
        document.querySelector('.context-menu') as HTMLElement;

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

    navigator.clipboard.writeText(
      this.selectedMessage.message
    );

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
      cancelButtonText: '取消'
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
        }
      });

      // =========================
      // Step 3：API
      // =========================
      this.http.post(
        `${environment.apiUrl}/chat/message/${this.selectedMessage.id}/recall`,
        {}
      ).subscribe({

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
            icon: 'error'
          });
        }
      });
    });
  }

  //超過一天不可收回
  canRecall(msg: any): boolean {

    if (msg.recalled) {
      return false;
    }

    const created =
      new Date(msg.createTime).getTime();

    const diffDays =
      (Date.now() - created) / (1000 * 60 * 60 * 24);

    return diffDays < 1; // ⭐ 2天內可收回
  }

  // =====================
  // 關閉聊天室
  // =====================

  closeChat() {

    this.dialogRef.close();
  }
  getAvatar(avatar:string){
return environment.apiUrl+avatar
  }
}
