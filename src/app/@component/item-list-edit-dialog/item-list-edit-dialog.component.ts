import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle'; // 必須有這個
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Item, LocationAndCategory } from '../../common/interfaceList';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
@Component({
  selector: 'app-item-list-edit-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatDatepickerModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './item-list-edit-dialog.component.html',
  styleUrl: './item-list-edit-dialog.component.scss',
})
export class ItemListEditDialogComponent implements OnInit {
  // 綁定表單的資料結構
  item: any = {};

  groups: LocationAndCategory[] = [
    { id: 1, name: 'test' },
    { id: 2, name: 'test2' },
    { id: 3, name: 'test3' },
  ];
  categories: LocationAndCategory[] = [];
  location: LocationAndCategory[] = [];

isSubscriptionMode = false;

isSubscriptionCategory(): boolean {
  return this.isSubscriptionMode;
}



  constructor(
    public dialogRef: MatDialogRef<ItemListEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit(): void {
  if (this.data && this.data.item) {
    this.isSubscriptionMode = this.data?.isSubscriptionMode || false;

    this.item = { ...this.data.item };

    this.location = this.data.locationMap || [];
    this.categories = this.data.categoriesMap || [];

    if (this.isSubscriptionMode) {
      const subscriptionCategory = this.categories.find(cat => cat.name === '訂閱');

      if (subscriptionCategory) {
        this.item.categoryId = subscriptionCategory.id;
      }
    }

    this.item.expireDate = this.formatDate(this.item.expireDate);
    this.item.purchaseDate = this.formatDate(this.item.purchaseDate);
    this.item.trialEndDate = this.formatDate(this.item.trialEndDate);
    this.item.nextBillingDate = this.formatDate(this.item.nextBillingDate);
  }
}
  // 在你的 Component 內，或是物件 model 內
  get totalPrice(): number {
    return (this.item.unitPrice || 0) * (this.item.quantity || 0);
  }

  // 日期格式化小工具：統一轉成 HTML date input 可用的 YYYY-MM-DD
private formatDate(date: any): string {
  if (!date) return '';

  // 如果後端回來是 2026-05-18，直接回傳
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  // 如果後端回來是 2026/05/18，轉成 2026-05-18
  if (typeof date === 'string' && /^\d{4}\/\d{2}\/\d{2}$/.test(date)) {
    return date.replaceAll('/', '-');
  }

  // 如果是 Date 物件或其他日期格式，轉成 YYYY-MM-DD
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
  // 訂閱修改時，不需要前端傳 nextBillingDate，後端會用 trialEndDate + billingCycle 自動算
onOkClose(): void {
  let payload: any;

  if (this.isSubscriptionCategory()) {
    payload = {
      id: this.item.id,
      groupId: this.item.groupId,
      userId: this.item.userId || this.item.createdById || 1,
      name: this.item.name,
      price: this.item.price || this.item.unitPrice,
      billingCycle: this.item.billingCycle,
      expireDate: this.formatDate(this.item.expireDate),
      purchaseDate: this.formatDate(this.item.purchaseDate),
      trialEndDate: this.formatDate(this.item.trialEndDate),
      notify: this.item.notify,
      note: this.item.note,
    };
  } else {
    payload = {
      ...this.item,
      purchaseDate: this.formatDate(this.item.purchaseDate),
      expireDate: this.formatDate(this.item.expireDate),
      price: this.totalPrice,
    };
  }

  this.dialogRef.close(payload);
}
onCancel(): void {
  this.dialogRef.close();
}
}
