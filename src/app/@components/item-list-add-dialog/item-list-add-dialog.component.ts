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
  item = {
    created_by_id: 1, //創造這筆的人
    groupId: this.groupId, // 放在哪個群組
    locationId: 1, // 放在哪裡
    categoryId: 1, // 哪一個分類
    name: '',
    quantity: 1,
    unit: '',
    price: 0,
    purchaseDate:'',// 購買日
    expireDate: '', // 有效日期
    notify: true,
    saveQuantity:0,
    note: '', // 備註
  };

  constructor(
    public dialogRef: MatDialogRef<ItemListAddDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}
  ngOnInit(): void {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
    if (this.data && this.data.location) {
      this.location =  [...this.data.location ];
      console.log(this.location)
    }
    if (this.data && this.data.categories) {
      this.categories = [ ...this.data.categories ];
      this.categories.shift();
      
    }
  }
  addItemInfo() {
    //這邊會比編輯多一個created_by_id
    console.log(this.item);

  }
  onNoClick(): void {
    this.dialogRef.close();
  }
}
