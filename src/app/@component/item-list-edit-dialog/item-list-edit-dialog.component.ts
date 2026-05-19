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
  ],
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

  constructor(
    public dialogRef: MatDialogRef<ItemListEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit(): void {
    if (this.data && this.data.item && this.data.locationMap) {
      console.log(this.data.item);
      this.item = { ...this.data.item };
      console.log(this.item);
      // this.groups =this.item.groupId;
      this.location = this.data.locationMap;
      this.categories = this.data.categoriesMap;
      if (this.item.expireDate && this.item.expireDate.includes('T')) {
        this.item.expireDate = this.item.expireDate.split('T')[0];
      }
    }
  }
  // 在你的 Component 內，或是物件 model 內
  get totalPrice(): number {
    return (this.item.unitPrice || 0) * (this.item.quantity || 0);
  }

  // 日期格式化小工具
  private formatDate(date: any): string {
    if (!date) return '';
    // ✅ 補上時區防呆：如果本來就是 YYYY-MM-DD 的 10 碼字串，直接返回
    if (typeof date === 'string' && date.length === 10 && date.includes('-')) {
      return date;
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  onOkClose(): void {
    // 在傳回外部前，建議先處理日期格式 (確保是 YYYY-MM-DD)
    const payload = {
      ...this.item,
      // 如果你有使用 MatDatepicker，它傳回的是 Date 物件，需轉為字串
      purchaseDate: this.formatDate(this.item.purchaseDate),
      expireDate: this.formatDate(this.item.expireDate),

      price: this.totalPrice,
    };
    this.dialogRef.close(payload);
  }
  onCancel(): void {
    this.dialogRef.close();
  }
}
