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
  items: Item[] = [];
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
  ) {
    // console.log(this.items);
  }

  ngOnInit(): void {
    if (this.data && this.data.item && this.data.locationMap) {
      console.log(this.data.item);
      this.item = { ...this.data.item };
      // this.groups =this.item.groupId;
      this.location = this.data.locationMap;
      this.categories = this.data.categoriesMap;
      

      if (this.item.expireDate && this.item.expireDate.includes('T')) {
        this.item.expireDate = this.item.expireDate.split('T')[0];
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
