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
import { MatNativeDateModule } from '@angular/material/core';
import { provideNativeDateAdapter } from '@angular/material/core';
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
  ],
  templateUrl: './calendar-event-dialog.component.html',
  styleUrl: './calendar-event-dialog.component.scss',
  providers: [provideNativeDateAdapter()],
})
export class CalendarEventDialogComponent {
  form = {
    title: '',
    description: '',
    eventDate: null as Date | null,
    eventTime: null as Date | null,
    endDate: null as Date | null,
    endTime: null as Date | null,
    notifyBefore: 0,
  };

  constructor(
    public dialogRef: MatDialogRef<CalendarEventDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { mode: 'create' | 'update'; dateStr?: string; event?: any },
  ) {
    // 如果是修改模式，把舊資料帶進來
    if (data.mode === 'update' && data.event) {
      const e = data.event;
      this.form.title = e.title;
      this.form.description = e.extendedProps.description || '';
      this.form.eventDate = new Date(e.startStr);
      this.form.eventTime = new Date(e.startStr);
      this.form.endDate = e.endStr ? new Date(e.endStr) : null;
      this.form.endTime = e.endStr ? new Date(e.endStr) : null;
      this.form.notifyBefore = e.extendedProps.notifyBefore || 0;
    }

    if (data.mode === 'create' && data.dateStr) {
      this.form.eventDate = new Date(data.dateStr);
      this.form.endDate = new Date(data.dateStr);
    }
  }

confirm() {
  if (!this.form.title || !this.form.eventDate || !this.form.eventTime) return;

  const startDateTime = this.combineDateAndTime(this.form.eventDate, this.form.eventTime);
  const endDateTime = this.form.endDate && this.form.endTime
    ? this.combineDateAndTime(this.form.endDate, this.form.endTime)
    : null;

  if (endDateTime && startDateTime > endDateTime) return;

  this.dialogRef.close({
    title: this.form.title,
    description: this.form.description,
    eventTime: startDateTime,
    endTime: endDateTime,
    notifyBefore: this.form.notifyBefore,
  });
}

// 日期 + 時間合併成 ISO 字串
combineDateAndTime(date: Date, time: Date): string {
  const d = new Date(date);
  d.setHours(time.getHours(), time.getMinutes(), 0);
  return d.toISOString().substring(0, 19);
}

  cancel() {
    this.dialogRef.close();
  }
}
