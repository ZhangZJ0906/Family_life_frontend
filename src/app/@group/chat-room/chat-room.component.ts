import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Inject } from '@angular/core';

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
    private route: ActivatedRoute,
    private dialogRef: MatDialogRef<ChatRoomComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {

    this.groupId = this.data.groupId;
    this.groupName = this.data.groupName; // ⭐重點

    // TODO: 之後改成 AuthService
    this.userId = Number(localStorage.getItem('userId'));

    this.loadMessages();
  }

  loadMessages() {
    this.http.get<any>(
      `http://localhost:8080/family_life/chat/${this.groupId}`
    ).subscribe(res => {
      this.messages = res.messages;
    });
  }

  sendMessage() {

    if (!this.message.trim()) return;

    this.http.post(
      `http://localhost:8080/family_life/chat/send`,
      {
        groupId: this.groupId,
        senderId: this.userId,
        message: this.message
      }
    ).subscribe(() => {

      this.message = '';
      this.loadMessages();

    });
  }

  closeChat() {
    this.dialogRef.close();
  }
}
