import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { TextFieldModule } from '@angular/cdk/text-field'; // ✨ 匯入這個
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { LocationAndCategory } from '../../common/interfaceList';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { HttpClientService } from '../../@services/http-client.service';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-item-list-add-dialog',
  imports: [
    CommonModule,
    TextFieldModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatDatepickerModule,
    MatSlideToggleModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './item-list-add-dialog.component.html',
  styleUrl: './item-list-add-dialog.component.scss',
})
export class ItemListAddDialogComponent implements OnInit {
  // 初始化對應資料庫欄位的物件
  groupId: number[] = [1, 2, 3, 4, 5, 6];
  location: LocationAndCategory[] = [];
  categories: LocationAndCategory[] = [];
  minDate: string = ''; // 日期限制
  today=new Date();
  item = {
    created_by_id: 1, //創造這筆的人
    groupId: this.groupId, // 放在哪個群組
    locationId: 1, // 放在哪裡
    categoryId: 1, // 哪一個分類
    name: '',
    quantity: 1,
    unit: '',
    price: 0,
    purchaseDate: '', // 購買日
    expireDate: '', // 有效日期
    notify: true,
    saveQuantity: 0,
    note: '', // 備註
  };
  basicUrl!: string;
  constructor(
    public dialogRef: MatDialogRef<ItemListAddDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClientService,
  ) {
    this.basicUrl = this.http.basicUrl;
  }
  ngOnInit(): void {

    this.minDate = this.today.toISOString().split('T')[0];
    if (this.data && this.data.location) {
      this.location = [...this.data.location];

    }
    if (this.data && this.data.categories) {
      this.categories = [...this.data.categories];
      this.categories.shift();
    }
  }
  addItemInfo() {
    const payload = {
      ...this.item,
      userId: this.item.created_by_id, // 轉成後端要的 userId
      groupId: this.item.groupId || 0, // 如果是個人則給 0
      purchaseDate: this.formatDate(this.item.purchaseDate),
    expireDate: this.formatDate(this.item.expireDate)
    };

    // 2. 必填欄位檢查 (前端第一道防線)
    if (!payload.name?.trim()) {
      this.showError('請輸入物品名稱');
      return;
    }
    if (!payload.categoryId) {
      this.showError('請選擇分類');
      return;
    }
    if (!payload.locationId) {
      this.showError('請選擇存放位置');
      return;
    }
    if (!payload.purchaseDate) {
      this.showError('請選擇購買日期');
      return;
    }
    if (payload.quantity < 0) {
      this.showError('數量不能小於 0');
      return;
    }

    this.http.postApi(this.basicUrl + 'item/add', this.item).subscribe({
      next: (res: any) => {
        if (res.code != 200) {
          Swal.fire({
            title: '錯誤',
            text: res.message || 'Server error',
            icon: 'error',
          });
          return;
        }
        Swal.fire({
          title: '成功',
          text: res.message,
          icon: 'success',
        });
        this.onNoClick();
      },
      error: (err: any) => {
        Swal.fire({
          title: '錯誤',
          text: err.message || 'Server error',
          icon: 'error',
        });
      },
    });
  }
  private formatDate(date: any): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}
  private showError(msg: string) {
    Swal.fire({
      title: '資訊不完整',
      text: msg,
      icon: 'warning',
      confirmButtonColor: '#28a745',
    });
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
}
