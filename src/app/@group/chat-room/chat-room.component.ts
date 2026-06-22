import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  HostListener,
  AfterViewChecked,
  Inject,
  NgZone,
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
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, MatIconModule],
  templateUrl: './chat-room.component.html',
  styleUrl: './chat-room.component.scss',
})
export class ChatRoomComponent implements OnInit, OnDestroy {
  @ViewChild('scrollBox') scrollBox!: ElementRef;

  groupId!: number;
  userId!: number;
  groupName!: string;

  message = '';
  messages: any[] = [];

  // ===== online state =====
  isActiveRoom = true;
  onlineCount = 0;
  onlineUsers: any[] = [];
  allMembers: any[] = [];
  membersWithStatus: any[] = [];

  showMemberPanel = false;

  // ===== unread =====
  firstUnreadIndex = -1;

  // ===== context menu =====
  showMenu = false;
  menuX = 0;
  menuY = 0;
  selectedMessage: any = null;

  // ===== reply =====
  replyMessage: any = null;

  hasLoaded = false;
  isLoadingMessages = true;
  // 圖片預覽狀態
  imagePreviewVisible = false;
  previewImageUrl = '';
  previewImageTitle = '';
  previewScale = 1;
  previewRotate = 0;

  isMobile = false;

  //登出關聊天室
  private logoutSub?: Subscription;

  constructor(
    private http: HttpClient,
    private ws: ChatWsService,
    private dialogRef: MatDialogRef<ChatRoomComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private authService: AuthService,
    private zone: NgZone,
  ) {}

  // =========================
  // INIT
  // =========================
  async ngOnInit() {
    this.groupName = this.data.groupName;
    this.groupId = this.data.groupId;
    this.isMobile = this.data.isMobile ?? window.innerWidth <= 600;

    this.userId = this.authService.currentUser()?.user_id ?? 0;

    this.getMember();
    this.loadMessages();

    await this.ws.connect();

    // ⭐ ONLY HERE join room
    this.ws.enterRoom(this.groupId, this.userId);

    this.ws.subscribe(this.groupId, (msg: any) => {
      this.zone.run(() => {
        switch (msg.type) {
          case 'ONLINE':
            this.onlineCount = msg.count;
            this.onlineUsers = msg.users || [];
            this.buildMemberStatus();
            break;

          case 'MESSAGE':
          case 'IMAGE':
            this.messages = [...this.messages, msg];
            this.calculateUnreadIndex();
            break;

          case 'READ':
            this.updateReadCount(msg);
            this.calculateUnreadIndex();
            break;

          case 'EDIT':
            this.applyEdit(msg);
            break;

          case 'RECALL':
            this.applyRecall(msg);
            break;
        }
      });

      setTimeout(() => this.scrollToBottom(), 50);
    });

    //登出關閉聊天室
    this.logoutSub = this.authService.logout$.subscribe(() => {
      this.forceCloseChat();
    });
  }

  ngAfterViewChecked() {
    if (this.hasLoaded) {
      this.scrollToBottom();

      this.hasLoaded = false;
    }
  }

  // =========================
  // DESTROY
  // =========================
  ngOnDestroy() {
    this.logoutSub?.unsubscribe();
    this.leaveRoom();
  }

  closeChat() {
    this.leaveRoom();
    this.dialogRef.close();
  }

  private leaveRoom() {
    this.isActiveRoom = false;
    this.ws.leaveRoom(this.groupId, this.userId);
  }

  private forceCloseChat() {
    this.isActiveRoom = false;

    // 1. 離開 WS 房間
    this.ws.leaveRoom(this.groupId, this.userId);

    // 2. 關 WS 連線（很重要）
    this.ws.disconnect?.();

    // 3. 關 dialog
    this.dialogRef.close();
  }

  // =========================
  // WINDOW RESIZE ONLY
  // =========================
  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth <= 600;
  }

  // =========================
  // MEMBER
  // =========================
  openMemberPanel() {
    this.showMemberPanel = true;
    this.buildMemberStatus();
  }

  getAvatar(avatar?: string | null): string {
    if (!avatar || avatar.trim() === '') {
      return 'assets/default-avatar.png';
    }

    if (avatar.startsWith('http://localhost:8081')) {
      return avatar.replace(
        'http://localhost:8081',
        window.location.origin + '/api',
      );
    }

    if (avatar.startsWith('http://localhost:8080')) {
      return avatar.replace(
        'http://localhost:8080',
        window.location.origin + '/api',
      );
    }

    if (avatar.startsWith('http')) {
      return avatar;
    }

    if (avatar.startsWith('/')) {
      return window.location.origin + '/api' + avatar;
    }

    return window.location.origin + '/api/' + avatar;
  }

  getMember() {
    this.http
      .get<any>(
        `${environment.apiUrl}/family_life/get_members?group_id=${this.groupId}`,
      )
      .subscribe((res) => {
        this.allMembers = res.groupMembersList ?? [];
        this.buildMemberStatus();
      });
  }

  buildMemberStatus() {
    if (!Array.isArray(this.allMembers)) return;

    const onlineIds = new Set(this.onlineUsers.map((u) => this.getUserId(u)));

    this.membersWithStatus = this.allMembers.map((m) => ({
      ...m,
      isOnline: onlineIds.has(this.getUserId(m)),
    }));
  }

  getUserId(obj: any): number {
    return obj.userId ?? obj.user_id ?? obj.id;
  }

  get onlineMembers() {
    return this.membersWithStatus.filter((m) => m.isOnline);
  }

  get offlineMembers() {
    return this.membersWithStatus.filter((m) => !m.isOnline);
  }

  // =========================
  // MESSAGES
  // =========================
  loadMessages() {
    this.isLoadingMessages = true;

    this.http
      .get<any>(
        `${environment.apiUrl}/chat/${this.groupId}?userId=${this.userId}`,
      )
      .subscribe({
        next: (res) => {
          this.messages = res.messages ?? [];

          this.firstUnreadIndex = this.messages.findIndex(
            (m) => m.senderId !== this.userId && !m.readByMe,
          );

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
    if (!this.message.trim()) return;

    this.ws.sendMessage({
      groupId: this.groupId,
      senderId: this.userId,
      message: this.message,
      replyId: this.replyMessage?.id || null,
    });

    this.message = '';

    setTimeout(() => this.scrollToBottom(), 200);
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

  // =========================
  // READ
  // =========================
  markRead() {
    this.http
      .post(
        `${environment.apiUrl}/chat/read/${this.groupId}?userId=${this.userId}`,
        {},
      )
      .subscribe(() => {
        this.messages.forEach((m) => {
          if (m.senderId !== this.userId) {
            m.readByMe = true;
          }
        });

        this.calculateUnreadIndex();
      });
  }

  updateReadCount(msg: any) {
    const target = this.messages.find((m) => m.id === msg.messageId);
    if (target) target.readCount = msg.readCount;
  }

  calculateUnreadIndex() {
    const idx = this.messages.findIndex(
      (m) => m.senderId !== this.userId && !m.readByMe,
    );

    this.firstUnreadIndex = idx >= 0 ? idx : -1;
  }

  // =========================
  // RECALL
  // =========================
  private applyEdit(msg: any) {
    const target = this.messages.find((m) => m.id === msg.messageId);
    if (target) {
      target.message = msg.message;
      target.edited = true;
    }
  }

  private applyRecall(msg: any) {
    const target = this.messages.find((m) => m.id === msg.messageId);
    if (target) target.recalled = true;
  }

  // =========================
  // UI
  // =========================
  scrollToBottom() {
    if (!this.scrollBox) return;
    const el = this.scrollBox.nativeElement;
    el.scrollTop = el.scrollHeight;
  }

  isNewDate(current: any, previous?: any): boolean {
    if (!previous) return true;

    const d1 = new Date(current.createTime);
    const d2 = new Date(previous.createTime);

    return (
      d1.getFullYear() !== d2.getFullYear() ||
      d1.getMonth() !== d2.getMonth() ||
      d1.getDate() !== d2.getDate()
    );
  }

  formatDate(date: string): string {
    const d = new Date(date);

    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(
      2,
      '0',
    )}/${String(d.getDate()).padStart(2, '0')}`;
  }

  //右鍵選單
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

  copyMessage() {
    if (!this.selectedMessage) return;

    navigator.clipboard.writeText(this.selectedMessage.message);

    this.showMenu = false;
  }

  replyFromMenu() {
    if (!this.selectedMessage) return;

    this.replyMessage = this.selectedMessage;

    this.showMenu = false;
  }

  canRecall(msg: any): boolean {
    if (!msg || msg.recalled) return false;

    const created = new Date(msg.createTime).getTime();
    const diffHours = (Date.now() - created) / (1000 * 60 * 60);

    return diffHours < 24; // 24 小時內可收回
  }

  recallMessageFromMenu() {
    if (!this.selectedMessage) return;

    this.showMenu = false;

    Swal.fire({
      title: '確定收回此訊息？',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '收回',
      cancelButtonText: '取消',
    }).then((result) => {
      if (!result.isConfirmed) return;

      Swal.fire({
        title: '收回中...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      this.http
        .post(
          `${environment.apiUrl}/chat/message/${this.selectedMessage.id}/recall`,
          {},
        )
        .subscribe({
          next: () => {
            Swal.close();

            const target = this.messages.find(
              (m) => m.id === this.selectedMessage.id,
            );

            if (target) {
              target.recalled = true;
            }

            this.selectedMessage.recalled = true;
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

  //圖片預覽
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
      const preview = document.querySelector(
        '.image-preview-overlay',
      ) as HTMLElement;

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
