<<<<<<< HEAD
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
=======
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
>>>>>>> origin/ZJ

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
<<<<<<< HEAD
export class ChatRoomComponent
  implements OnInit, AfterViewChecked {

  @ViewChild('scrollBox')
  scrollBox!: ElementRef;
=======
export class ChatRoomComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollBox') scrollBox!: ElementRef;
>>>>>>> origin/ZJ

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
  // 編輯訊息
  // =====================

  editingId?: number;

  editingMessage = '';

  constructor(
    private http: HttpClient,
    private ws: ChatWsService,
    private dialogRef: MatDialogRef<ChatRoomComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private authService: AuthService,
    private zone: NgZone,
  ) {}

  async ngOnInit() {
    this.groupName = this.data.groupName;

    this.userId =
      this.authService.currentUser()?.user_id ?? 0;

    this.groupId = this.data.groupId;

    this.loadMessages();

<<<<<<< HEAD
=======
    // WebSocket
>>>>>>> origin/ZJ
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

<<<<<<< HEAD
            case 'ONLINE':
              this.onlineCount = msg.count;
              break;

            case 'MESSAGE':
              this.messages = [
                ...this.messages,
                msg
              ];
              break;

            case 'IMAGE':
              this.messages = [
                ...this.messages,
                msg
              ];
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

                editTarget.message =
                  msg.message;

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
=======
          case 'READ':
            this.updateReadCount(msg);
            break;
        }
      });
      setTimeout(() => {
        this.scrollToBottom();
      }, 50);
    });
>>>>>>> origin/ZJ
  }

  ngAfterViewChecked() {
    if (this.hasLoaded) {

      this.scrollToBottom();

      this.hasLoaded = false;
    }
  }

  loadMessages() {
    this.isLoadingMessages = true;

<<<<<<< HEAD
    this.http.get<any>(
      `${environment.apiUrl}/chat/${this.groupId}`
    ).subscribe({

=======
    this.http.get<any>(`${environment.apiUrl}/chat/${this.groupId}`).subscribe({
>>>>>>> origin/ZJ
      next: (res) => {

        this.messages =
          res.messages ?? [];

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

<<<<<<< HEAD
    this.http.post(
      `${environment.apiUrl}/chat/upload`,
      formData
    ).subscribe();
  }

  updateReadCount(msg: any) {

    const target =
      this.messages.find(
        m => m.id === msg.messageId
      );
=======
    this.http.post(`${environment.apiUrl}/chat/upload`, formData).subscribe({
      next(res) {},
      error: (err) => {
        Swal.fire({
          title: '圖片上船失敗',
          text: err.message,
          icon: 'error',
        });
      },
    });
  }

  updateReadCount(msg: any) {
    const target = this.messages.find((m) => m.id === msg.messageId);
>>>>>>> origin/ZJ

    if (target) {

      target.readCount =
        msg.readCount;
    }
  }

  markRead() {
<<<<<<< HEAD

    this.http.post(
      `${environment.apiUrl}/chat/read/${this.groupId}?userId=${this.userId}`,
      {}
    ).subscribe();
=======
    this.http
      .post(
        `${environment.apiUrl}/chat/read/${this.groupId}?userId=${this.userId}`,
        {},
      )
      .subscribe();
>>>>>>> origin/ZJ
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
  // 編輯
  // =====================

  startEditFromMenu() {

    if (!this.selectedMessage) {
      return;
    }

    this.showMenu = false;

    this.editingId =
      this.selectedMessage.id;

    this.editingMessage =
      this.selectedMessage.message;
  }

  cancelEdit() {

    this.editingId = undefined;

    this.editingMessage = '';
  }

  saveEdit(msg: any) {

    const text =
      this.editingMessage.trim();

    if (!text) {
      return;
    }

    this.http.put(
      `${environment.apiUrl}/chat/message/${msg.id}`,
      {
        message: text
      }
    ).subscribe(() => {

      msg.message = text;

      msg.edited = true;

      this.cancelEdit();
    });
  }

  // =====================
  // 收回
  // =====================

  recallMessageFromMenu() {

    if (!this.selectedMessage) {
      return;
    }

    this.showMenu = false;

    if (
      !confirm(
        '確定收回此訊息？'
      )
    ) {
      return;
    }

    this.http.put(
      `${environment.apiUrl}/chat/message/${this.selectedMessage.id}/recall`,
      {}
    ).subscribe(() => {

      this.selectedMessage.recalled = true;
    });
  }

  // =====================
  // 關閉聊天室
  // =====================

  closeChat() {

    this.dialogRef.close();
  }
}
