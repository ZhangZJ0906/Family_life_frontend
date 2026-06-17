import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { Inject } from '@angular/core';

import { ChatWsService } from '../../@services/ChatWsService';
import { AuthService } from '../../@services/auth.service';
import { AfterViewChecked } from '@angular/core';

import { NgZone } from '@angular/core';
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

  groupId!: number;
  userId!: number;
  groupName!: string;

  message = '';
  messages: any[] = [];

  onlineCount!: number;

  //msg未全載完
  hasLoaded = false;
  isLoadingMessages = true;

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

    this.userId = this.authService.currentUser()?.user_id ?? 0;

    this.groupId = this.data.groupId;

    // 歷史訊息
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
      this.hasLoaded = false; // ⭐ 只做一次
    }
  }

  loadMessages() {
    this.isLoadingMessages = true;

    this.http.get<any>(`${environment.apiUrl}/chat/${this.groupId}`).subscribe({
      next: (res) => {
        this.messages = res.messages ?? [];
console.log(this.messages)
        this.markRead();

        this.hasLoaded = true; // ⭐ 關鍵
        // setTimeout(() => this.scrollToBottom());

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

    if (!file) return;

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
    this.http
      .post(
        `${environment.apiUrl}/chat/read/${this.groupId}?userId=${this.userId}`,
        {},
      )
      .subscribe();
  }

  scrollToBottom() {
    if (!this.scrollBox) {
      return;
    }
    const el = this.scrollBox.nativeElement;

    el.scrollTop = el.scrollHeight;
  }

  closeChat() {
    this.dialogRef.close();
  }
  getAvatar(avatar:string){
return environment.apiUrl+avatar
  }
}
