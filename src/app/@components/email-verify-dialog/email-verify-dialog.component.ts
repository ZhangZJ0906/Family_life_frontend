import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CountdownComponent, CountdownConfig, CountdownEvent } from 'ngx-countdown';

export interface EmailVerifyDialogData {
  email: string;
  verifyExpire: number;
  resendCooldown: number;
}

export type EmailVerifyDialogResult =
  | { action: 'verify'; code: string }
  | { action: 'resend' };

@Component({
  selector: 'app-email-verify-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    CountdownComponent
  ],
  templateUrl: './email-verify-dialog.component.html',
  styleUrl: './email-verify-dialog.component.scss'
})
export class EmailVerifyDialogComponent {
  code = '';
  errorMessage = '';
  verifyExpired = false;
  resendLocked = true;

  verifyConfig: CountdownConfig = {
    leftTime: this.data.verifyExpire,
    format: 'mm:ss'
  };

  resendConfig: CountdownConfig = {
    leftTime: this.data.resendCooldown,
    format: 's'
  };

  constructor(
    private readonly dialogRef: MatDialogRef<EmailVerifyDialogComponent, EmailVerifyDialogResult>,
    @Inject(MAT_DIALOG_DATA) public readonly data: EmailVerifyDialogData
  ) {}

  handleVerifyCountdown(event: CountdownEvent): void {
    if (event.action === 'done') {
      this.verifyExpired = true;
      this.errorMessage = '驗證碼已過期，請重新發送';
    }
  }

  handleResendCountdown(event: CountdownEvent): void {
    if (event.action === 'done') {
      this.resendLocked = false;
    }
  }

  submit(): void {
    const trimmedCode = this.code.trim();

    if (!trimmedCode) {
      this.errorMessage = '請輸入驗證碼';
      return;
    }

    if (this.verifyExpired) {
      this.errorMessage = '驗證碼已過期，請重新發送';
      return;
    }

    this.dialogRef.close({ action: 'verify', code: trimmedCode });
  }

  resend(): void {
    if (this.resendLocked) {
      return;
    }

    this.dialogRef.close({ action: 'resend' });
  }
}
