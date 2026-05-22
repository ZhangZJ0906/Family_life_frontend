import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ShoppingListService } from '../../@services/shopping-list.service';
import {
  PurchaseItemVo,
  AddPurchaseItemReq
} from '../../@models/shopping_list.model';

import { AuthService } from '../../@services/auth.service';

@Component({
  selector: 'app-shopping-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './shopping-list.component.html',
  styleUrl: './shopping-list.component.scss'
})
export class ShoppingListComponent implements OnInit {

  listId = 1; // 👉 之後改成 route param 或 group id
  userId = 1; // 👉 改成 authService.currentUser().user_id

  items: PurchaseItemVo[] = [];

  newItem = {
    item: '',
    quantity: 1,
    categoryId: 1,
    userId: 1
  };

  constructor(
    private shoppingService: ShoppingListService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.currentUser()?.user_id ?? 1;
    this.loadItems();
  }

  // ======================
  // 取得項目（後端）
  // ======================
  loadItems(): void {
    this.shoppingService.getItems(this.listId).subscribe({
      next: (res) => {
        this.items = res;
      },
      error: (err) => console.error(err)
    });
  }

  // ======================
  // 新增 item
  // ======================
  addItem(): void {

    const req: AddPurchaseItemReq = {
      listId: this.listId,
      createrId: this.userId,
      purchaseItemVoList: [
        {
          item: this.newItem.item,
          quantity: this.newItem.quantity,
          categoryId: this.newItem.categoryId,
          userId: this.userId,
          listId: this.listId,
          id: 0, // 後端會自動生成 id
          check: false // 預設為未勾選
        }
      ]
    };

    this.shoppingService.addItems(req).subscribe({
      next: () => {
        this.newItem.item = '';
        this.newItem.quantity = 1;
        this.loadItems();
      },
      error: (err) => console.error(err)
    });
  }

  // ======================
  // 刪除 item
  // ======================
  deleteItem(itemId: number): void {
    this.shoppingService.deleteItem(this.listId, itemId).subscribe({
      next: () => this.loadItems(),
      error: (err) => console.error(err)
    });
  }

  // ======================
  // 勾選
  // ======================
  toggleCheck(item: PurchaseItemVo): void {
    this.shoppingService.updateCheck(
      this.listId,
      item.id,
      !item.check,
      this.userId
    ).subscribe({
      next: () => {
        item.check = !item.check;
      },
      error: (err) => console.error(err)
    });
  }
}
