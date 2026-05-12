import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
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

@Component({
  selector: 'app-item-list-add-dialog',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
  ],
  templateUrl: './item-list-add-dialog.component.html',
  styleUrl: './item-list-add-dialog.component.scss',
})
export class ItemListAddDialogComponent {
  // 初始化對應資料庫欄位的物件
  groupId: number[] = [1,2,3,4,5,6];
  item = {
    name: '',
    quantity: 1,
    unit: '',
    categoryId: 1,
    price: 0,
    expireDate: '',
    groupId: this.groupId, // 這裡記得根據你的需求改
    createdById: 1, // 這裡記得根據你的需求改
    notify: true,
    note: '',
  };

  constructor(
    public dialogRef: MatDialogRef<ItemListAddDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    // 如果有傳入初始資料（例如編輯模式），就覆蓋進去
    if (data.item) {
      this.item = { ...data.item };
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
