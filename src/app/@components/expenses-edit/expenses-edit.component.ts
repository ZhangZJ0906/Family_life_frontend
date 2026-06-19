import { Component, Inject } from '@angular/core';
import { HttpClientService } from '../../@services/http-client.service';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import {
  ExpenseRecord,
  Item,
  LocationAndCategory,
} from '../../common/interfaceList';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
@Component({
  selector: 'app-expenses-edit',
  imports: [
    MatDialogModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    FormsModule,
    MatInputModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './expenses-edit.component.html',
  styleUrl: './expenses-edit.component.scss',
})
export class ExpensesEditComponent {
  item: Item | null = null;
  record: ExpenseRecord | null = null;
  categories: LocationAndCategory[] = [];
  today = new Date();
  basicUrl!: string;
  originalRecord: any;
  currentGroupId = 0;
  currentGroupName = '私人記帳';
  currentUserId!: number;


  constructor(
    private http: HttpClientService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<ExpensesEditComponent>,
  ) {
    this.categories = this.data.categoryMap;
    this.item = this.data.relatedItem;
    this.record = this.data.record;
    this.basicUrl = this.http.basicUrl;
    this.currentUserId = this.data.currentUserId;
    this.currentGroupId = data.currentGroupId ?? 0;
    this.currentGroupName = data.currentGroupName || '私人記帳';

    this.originalRecord = JSON.parse(JSON.stringify(this.record));
  }


  private formatToBackendDate(dateInput: any): string {
    if (!dateInput) return '';

    const date = new Date(dateInput);

    // 檢查是否為無效的日期
    if (isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    // 月份從 0 開始算，所以要 +1，並確保是兩位數 (例如: 05)
    const month = String(date.getMonth() + 1).padStart(2, '0');
    // 確保日是兩位數 (例如: 09)
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  onCancel() {
    this.dialogRef.close();
  }

  get isNotModified(): boolean {
    // 1. 如果根本沒有原始資料，表示還在載入中
    if (!this.originalRecord || !this.record) return false;

    // 2. 正確的比對：當兩者字串完全一樣，代表「沒有修改」，回傳 true 讓按鈕 disabled
    return JSON.stringify(this.record) === JSON.stringify(this.originalRecord);
  }

  onSave() {
    if (!this.record) return;
    // 1. 先解構複製一份，避免直接污染畫面綁定的 this.record
    const payload = {
      ...this.record,
      operationUser: this.currentUserId,

    };

    // 2. 核心修正：相容兩種欄位命名，確保一定能抓到日期資料
    const rawDate = payload.expenseDate;
    payload.expenseDate = this.formatToBackendDate(rawDate);

    this.http.postApi('expense/updateInfo', payload).subscribe({
      next: (res: any) => {
        if (res.code != 200) {
          Swal.fire({
            title: '更新錯誤',
            text: res.message || 'server error ',
            icon: 'error',
          });
          return;
        }

        Swal.fire({
          title: '更新成功',
          icon: 'success',
        });
        this.dialogRef.close(true);
      },
      error: (err) => {
        Swal.fire({
          title: '更新錯誤',
          text: err.message || 'server error ',
          icon: 'error',
        });
      },
    });
  }
}
