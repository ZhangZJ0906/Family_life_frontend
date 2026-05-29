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

  form = {
    title: '',
    description: '',
    eventDate: null as Date | null,
    eventTime: null as Date | null,
    endDate: null as Date | null,
    endTime: null as Date | null,
    notifyBefore: 0,

    // 新增：指派成員
    assignedUserId: null as number | null,
  };

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
      this.form.notifyBefore = e.extendedProps?.notifyBefore || 0;

      // 修改時帶入原本指派成員
      this.form.assignedUserId =
        e.extendedProps?.assignedUserId ??
        data.currentUserId ??
        null;
    }

    if (data.mode === 'create' && data.dateStr) {
      this.form.eventDate = new Date(data.dateStr);
      this.form.endDate = new Date(data.dateStr);
    }

    // 私人活動不用選成員，直接指派給自己
    if (this.isPrivateGroup) {
      this.form.assignedUserId = data.currentUserId ?? null;
    }

    // 群組活動預設選第一個成員
    if (!this.isPrivateGroup && !this.form.assignedUserId) {
      this.form.assignedUserId = this.members[0]?.user_id ?? this.members[0]?.userId ?? null;
    }
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

    if (!this.isPrivateGroup && !this.form.assignedUserId) {
      Swal.fire({
        icon: 'warning',
        title: '請選擇指派成員',
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
      assignedUserId: this.form.assignedUserId,
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
