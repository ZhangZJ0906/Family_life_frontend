import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Inject } from '@angular/core';

import { ChatWsService } from '../../@services/ChatWsService';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule
  ],
  templateUrl: './chat-room.component.html',
  styleUrl: './chat-room.component.scss'
})
export class ChatRoomComponent implements OnInit {

  groupId!: number;
  userId!: number;
  groupName!: string;

  message = '';
  messages: any[] = [];

  constructor(
    private http: HttpClient,
    private ws: ChatWsService,
    private dialogRef: MatDialogRef<ChatRoomComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  async ngOnInit() {

    this.groupName = this.data.groupName; // ⭐重點

    // TODO: 之後改成 AuthService
    this.userId = Number(localStorage.getItem('userId'));

    this.groupId = this.data.groupId;

    // 先載歷史訊息
    this.loadMessages();

    await this.ws.connect();

    this.ws.subscribe(
      this.groupId,
      (msg: any) => {
        this.messages.push(msg);
      }
    );
  }

  loadMessages() {
    this.http.get<any>(
      `http://localhost:8080/chat/${this.groupId}`
    ).subscribe(res => {
      this.messages = res.messages;
    });
  }

  sendMessage() {

    if (!this.message.trim()) return;

    this.ws.sendMessage({
      groupId: this.groupId,
      senderId: this.userId,
      message: this.message
    });

    this.message = '';
  }

  closeChat() {
    this.dialogRef.close();
  }
}
