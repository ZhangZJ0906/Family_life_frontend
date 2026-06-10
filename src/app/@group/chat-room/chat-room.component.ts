import {
  Component,
  OnInit,
  ViewChild,
  ElementRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';

import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';

import { Inject } from '@angular/core';

import { ChatWsService } from '../../@services/ChatWsService';
import { AuthService } from '../../@services/auth.service';

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

  @ViewChild('chatBody')
  chatBody!: ElementRef<HTMLDivElement>;

  groupId!: number;
  userId!: number;
  groupName!: string;

  message = '';
  messages: any[] = [];

  constructor(
    private http: HttpClient,
    private ws: ChatWsService,
    private dialogRef: MatDialogRef<ChatRoomComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private authService: AuthService
  ) {}

  async ngOnInit() {

    this.groupName = this.data.groupName;

    this.userId =
      this.authService.currentUser()?.user_id ?? 0;

    this.groupId = this.data.groupId;

    // 歷史訊息
    this.loadMessages();

    // WebSocket
    await this.ws.connect();

    this.ws.subscribe(
      this.groupId,
      (msg: any) => {

        this.messages.push(msg);

        setTimeout(() => {
          this.scrollToBottom();
        });
      }
    );
  }

  loadMessages() {

    this.http.get<any>(
      `http://localhost:8080/chat/${this.groupId}`
    ).subscribe(res => {

      this.messages = res.messages ?? [];

      setTimeout(() => {
        this.scrollToBottom();
      });
    });
  }

  sendMessage() {

    if (!this.message.trim()) {
      return;
    }

    this.ws.sendMessage({
      groupId: this.groupId,
      senderId: this.userId,
      message: this.message
    });

    this.message = '';

    setTimeout(() => {
      this.scrollToBottom();
    }, 200);
  }

  private scrollToBottom(): void {

    if (!this.chatBody) {
      return;
    }

    const element = this.chatBody.nativeElement;

    element.scrollTop = element.scrollHeight;
  }

  closeChat() {
    this.dialogRef.close();
  }
}
