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
import { TopbarComponent } from '../../shared/topbar/topbar.component';
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
  today = new Date();

  subscriptionCategoryId = 4; // 依照你的資料庫分類 id 調整，訂閱如果不是 4 就改成正確 id

isSubscriptionCategory(): boolean {
  const selectedCategory = this.categories.find(
    cat => Number(cat.id) === Number(this.item.categoryId)
  );

  return selectedCategory?.name === '訂閱';
}

isWarrantyCategory(): boolean {
  const selectedCategory = this.categories.find(
    cat => Number(cat.id) === Number(this.item.categoryId)
  );

  return selectedCategory?.name === '保固';
}
  item = {
  created_by_id: 1,
  groupId: 1,
  locationId: 1,
  categoryId: 1,

  name: '',
  quantity: 1,
  unit: '',
  unitPrice: 0,
  price: 0,
  purchaseDate: '',
  expireDate: '',
  notify: true,
  safeQuantity: 0,
  note: '',

  // 訂閱用欄位
  billingCycle: '每月',
  trialEndDate: '',
  nextBillingDate: '',

  // 保固用欄位
  brand: '',
  model: '',
  serialNumber: '',
  warrantyEndDate: '',
  storeName: '',
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

  if (this.data?.currentGroupId) {
    this.item.groupId = this.data.currentGroupId;
  }

  if (this.data?.isSubscriptionMode) {
    const subscriptionCategory = this.categories.find(cat => cat.name === '訂閱');
    if (subscriptionCategory) {
      this.item.categoryId = subscriptionCategory.id;
    }
  }

  if (this.data?.isWarrantyMode) {
  const warrantyCategory = this.categories.find(cat => cat.name === '保固');
  if (warrantyCategory) {
    this.item.categoryId = warrantyCategory.id;
  }
}
  }
  get totalPrice(): number {
    return (this.item.unitPrice || 0) * (this.item.quantity || 0);
  }
  addItemInfo() {
    // 如果是訂閱類別，走訂閱的新增流程
    if (this.isSubscriptionCategory()) {
    this.addSubscriptionInfo();
    return;
  }

    // 如果是保固類別，走保固的新增流程
    if (this.isWarrantyCategory()) {
    this.addWarrantyInfo();
    return;
  }

  // 一般物品的新增流程
  const payload = {
    ...this.item,
    price: this.totalPrice,
    userId: this.item.created_by_id,
    groupId: this.item.groupId || 0,
    purchaseDate: this.formatDate(this.item.purchaseDate),
    expireDate: this.formatDate(this.item.expireDate),
  };

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

  this.http.postApi(this.basicUrl + 'item/add', payload).subscribe({
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

      this.dialogRef.close(true);
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

  // 訂閱的新增流程
  addSubscriptionInfo(): void {
  const payload = {
    groupId: this.item.groupId,
    userId: this.item.created_by_id,
    name: this.item.name,
    price: this.item.unitPrice,
    billingCycle: this.item.billingCycle,
    purchaseDate: this.formatDate(this.item.purchaseDate),
    trialEndDate: this.formatDate(this.item.trialEndDate),
    notify: this.item.notify,
    note: this.item.note,
  };

  if (!payload.name?.trim()) {
    this.showError('請輸入訂閱名稱');
    return;
  }

  if (!payload.groupId) {
    this.showError('請選擇所屬群組');
    return;
  }

  if (payload.price < 0) {
    this.showError('訂閱金額不可小於 0');
    return;
  }

  if (!payload.billingCycle) {
    this.showError('請選擇扣款週期');
    return;
  }

  this.http.postApi(this.basicUrl + 'subscription/add', payload).subscribe({
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

      this.dialogRef.close(true);
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

addWarrantyInfo(): void {
  const payload = {
    groupId: this.item.groupId,
    userId: this.item.created_by_id,
    productName: this.item.name,
    brand: this.item.brand,
    model: this.item.model,
    serialNumber: this.item.serialNumber,
    purchaseDate: this.formatDate(this.item.purchaseDate),
    warrantyEndDate: this.formatDate(this.item.warrantyEndDate),
    storeName: this.item.storeName,
    price: this.item.unitPrice,
    notify: this.item.notify,
    note: this.item.note,
  };

  if (!payload.productName?.trim()) {
    this.showError('請輸入產品名稱');
    return;
  }

  if (!payload.groupId) {
    this.showError('請選擇所屬群組');
    return;
  }

  if (!payload.purchaseDate) {
    this.showError('請選擇購買日期');
    return;
  }

  if (!payload.warrantyEndDate) {
    this.showError('請選擇保固到期日');
    return;
  }

  this.http.postApi(this.basicUrl + 'warranty/add', payload).subscribe({
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

      this.dialogRef.close(true);
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

  isSubmitDisabled(): boolean {
  if (!this.item.name?.trim()) {
    return true;
  }

  if (this.isSubscriptionCategory()) {
    return !this.item.billingCycle || !this.item.trialEndDate;
  }

  return !this.item.expireDate;
}
}
