import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-calendar-event-dialog',
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatTimepickerModule,
    MatNativeDateModule,
    MatSelectModule,
  ],
  templateUrl: './calendar-event-dialog.component.html',
  styleUrl: './calendar-event-dialog.component.scss',
  providers: [provideNativeDateAdapter()],
})
export class CalendarEventDialogComponent {

  today = new Date();
  // 記錄 Dialog 剛開啟時的原始資料
  // 用來判斷使用者有沒有真的修改內容
  originalFormJson = '';

  form = {
    title: '',
    description: '',
    eventDate: null as Date | null,
    eventTime: null as Date | null,
    endDate: null as Date | null,
    endTime: null as Date | null,
    notifyBefore: 60,

    // 指派成員清單
  // 群組活動可以一次選多個成員
  // 私人活動不用顯示成員欄位，會自動放目前登入者
  assignedUserIds: [] as number[],
  };

  // 把 Date 轉成可比較的字串
  // 不直接 JSON.stringify Date，避免格式不穩定
  private normalizeFormForCompare() {
    return {
      title: this.form.title ?? '',
      description: this.form.description ?? '',
      eventDate: this.toDateOnlyString(this.form.eventDate),
      eventTime: this.toTimeOnlyString(this.form.eventTime),
      endDate: this.toDateOnlyString(this.form.endDate),
      endTime: this.toTimeOnlyString(this.form.endTime),
      notifyBefore: Number(this.form.notifyBefore ?? 0),

      // 排序後比較，避免 [1,2] 和 [2,1] 被當成不同
      assignedUserIds: [...this.form.assignedUserIds]
        .map((id) => Number(id))
        .sort((a, b) => a - b),
    };
  }

  // 建立原始表單快照
  private setOriginalFormSnapshot(): void {
    this.originalFormJson = JSON.stringify(this.normalizeFormForCompare());
  }

  // 判斷目前表單是否有修改
  isFormChanged(): boolean {
    return (
      JSON.stringify(this.normalizeFormForCompare()) !== this.originalFormJson
    );
  }

  // 日期只取 yyyy-MM-dd
  private toDateOnlyString(dateInput: Date | null): string {
    if (!dateInput) {
      return '';
    }

    const date = new Date(dateInput);

    if (isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // 時間只取 HH:mm
  private toTimeOnlyString(dateInput: Date | null): string {
    if (!dateInput) {
      return '';
    }

    const date = new Date(dateInput);

    if (isNaN(date.getTime())) {
      return '';
    }

    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    return `${hour}:${minute}`;
  }

  @ViewChild('dialogForm') dialogForm!: NgForm;

  constructor(
    public dialogRef: MatDialogRef<CalendarEventDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      mode: 'create' | 'update';
      dateStr?: string;
      event?: any;
      groupId?: number | null;
      groupName?: string;

      // 新增：群組成員與目前登入者
      members?: any[];
      currentUserId?: number;
      // 修改時由父層傳入同批活動的所有指派成員
  assignedUserIds?: number[];
    },
  ) {
    this.today.setHours(0, 0, 0, 0);

    if (data.mode === 'update' && data.event) {
      const e = data.event;

      this.form.title = e.title;
      this.form.description = e.extendedProps?.description || '';
      this.form.eventDate = new Date(e.startStr);
      this.form.eventTime = new Date(e.startStr);
      this.form.endDate = e.endStr ? new Date(e.endStr) : null;
      this.form.endTime = e.endStr ? new Date(e.endStr) : null;
      this.form.notifyBefore = e.extendedProps?.notifyBefore || 60;

     // 修改時帶入原本指派成員
      // 因為 mat-select multiple 綁定的是陣列，所以就算只有一個人也要包成陣列
      // 修改模式：優先使用父層查到的同批指派成員
if (data.assignedUserIds && data.assignedUserIds.length > 0) {
  this.form.assignedUserIds = data.assignedUserIds.map((id) => Number(id));
} else {
  // 如果沒有同批資料，才退回單一 assignedUserId
  const oldAssignedUserId =
    e.extendedProps?.assignedUserId ??
    data.currentUserId ??
    null;

  this.form.assignedUserIds = oldAssignedUserId ? [Number(oldAssignedUserId)] : [];
}}

    if (data.mode === 'create' && data.dateStr) {
      this.form.eventDate = new Date(data.dateStr);
      this.form.endDate = new Date(data.dateStr);
    }

   // 私人活動不用選成員，直接指派給自己
    if (this.isPrivateGroup) {
      this.form.assignedUserIds = data.currentUserId ? [Number(data.currentUserId)] : [];
    }

    // 重點：最後才建立初始快照
  this.setOriginalFormSnapshot();

    // 群組活動預設不強制選第一個，讓使用者自己勾選
    // 如果你想預設勾第一個成員，可以打開下面這段
    /*
    if (!this.isPrivateGroup && this.form.assignedUserIds.length === 0) {
      const firstMemberId = this.getMemberId(this.members[0]);

      if (firstMemberId) {
        this.form.assignedUserIds = [firstMemberId];
      }
    }
    */
  }

  get displayGroupName(): string {
    return this.data.groupName || '未選擇群組';
  }

  get isPrivateGroup(): boolean {
    return !this.data.groupId || Number(this.data.groupId) === 0;
  }

  get members(): any[] {
    return this.data.members || [];
  }

  getMemberName(member: any): string {
  return (
    member.userName ||
    member.user_name ||
    member.name ||
    member.email ||
    `成員 ${member.user_id || member.userId}`
  );
}
  getMemberId(member: any): number {
    return Number(member.user_id ?? member.userId);
  }

  confirm() {
    this.dialogForm.form.markAllAsTouched();

    if (this.dialogForm.invalid) return;

   // 群組活動一定要至少勾選一位成員
    if (!this.isPrivateGroup && this.form.assignedUserIds.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: '請選擇指派成員',
        text: '群組活動至少要指派給一位成員',
        confirmButtonText: '確認',
      });
      return;
    }

    const startDateTime = this.combineDateAndTime(
      this.form.eventDate!,
      this.form.eventTime!,
    );

    const endDateTime =
      this.form.endDate && this.form.endTime
        ? this.combineDateAndTime(this.form.endDate, this.form.endTime)
        : null;

    if (endDateTime && startDateTime > endDateTime) {
      Swal.fire({
        icon: 'warning',
        title: '開始時間不可大於結束時間',
        confirmButtonText: '確認',
      });
      return;
    }

    const startDate = new Date(startDateTime);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkStartDate = new Date(startDate);
    checkStartDate.setHours(0, 0, 0, 0);

    if (checkStartDate < today) {
      Swal.fire({
        icon: 'warning',
        title: '日期不可早於今天',
        text: '開始日期只能選擇今天或今天之後',
        confirmButtonText: '確認',
      });
      return;
    }

    this.dialogRef.close({
      title: this.form.title,
      description: this.form.description,
      eventTime: startDateTime,
      endTime: endDateTime,
      notifyBefore: this.form.notifyBefore,
      // 回傳多位指派成員給父層
    assignedUserIds: this.form.assignedUserIds,
        });
  }

  combineDateAndTime(date: Date, time: Date): string {
    const d = new Date(date);
    d.setHours(time.getHours(), time.getMinutes(), 0, 0);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:00`;
  }

  cancel() {
    this.dialogRef.close();
  }
}
