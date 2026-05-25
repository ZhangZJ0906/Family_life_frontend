import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AddPurchaseItemReq, PurchaseItemVo } from '../../@models/shopping_list.model';
import { AuthService } from '../../@services/auth.service';
import { ShoppingListService } from '../../@services/shopping-list.service';

interface CategoryOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-purchase-item',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './purchase-item.component.html',
  styleUrl: './purchase-item.component.scss'
})
export class PurchaseItemComponent implements OnInit {
  readonly categories: CategoryOption[] = [
    { id: 1, name: '食品' },
    { id: 2, name: '日用品' },
    { id: 3, name: '清潔' },
    { id: 4, name: '其他' }
  ];

  listId = 0;
  userId = 1;
  items: PurchaseItemVo[] = [];

  isLoading = false;
  isSaving = false;
  errorMessage = '';
  formError = '';

  newItem = {
    item: '',
    quantity: 1,
    categoryId: 1
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService,
    private readonly shoppingService: ShoppingListService
  ) {}

  ngOnInit(): void {
    this.listId = Number(this.route.snapshot.paramMap.get('listId'));
    this.userId = this.authService.currentUser()?.user_id ?? 1;
    this.loadItems();
  }

  get totalCount(): number {
    return this.items.length;
  }

  get boughtCount(): number {
    return this.items.filter((item) => item.check).length;
  }

  get remainingCount(): number {
    return this.totalCount - this.boughtCount;
  }

  get progressPercent(): number {
    return this.totalCount === 0 ? 0 : Math.round((this.boughtCount / this.totalCount) * 100);
  }

  loadItems(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.shoppingService.getItems(this.listId).subscribe({
      next: (res) => {
        this.items = res ?? [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = '購物項目載入失敗，請稍後再試';
        this.isLoading = false;
      }
    });
  }

  addItem(): void {
    const itemName = this.newItem.item.trim();
    this.formError = '';

    if (!itemName) {
      this.formError = '請輸入項目名稱';
      return;
    }

    if (!Number.isInteger(this.newItem.quantity) || this.newItem.quantity < 1) {
      this.formError = '數量至少為 1';
      return;
    }

    const req: AddPurchaseItemReq = {
      listId: this.listId,
      createrId: this.userId,
      purchaseItemVoList: [
        {
          id: 0,
          listId: this.listId,
          userId: this.userId,
          categoryId: this.newItem.categoryId,
          item: itemName,
          quantity: this.newItem.quantity,
          check: false
        }
      ]
    };

    this.isSaving = true;
    this.shoppingService.addItems(req).subscribe({
      next: (res) => {
        this.isSaving = false;

        if (res.code !== 200) {
          this.formError = res.message ?? '新增項目失敗';
          return;
        }

        this.newItem = {
          item: '',
          quantity: 1,
          categoryId: this.newItem.categoryId
        };
        this.loadItems();
      },
      error: (err) => {
        console.error(err);
        this.formError = err.error?.message ?? '新增項目失敗';
        this.isSaving = false;
      }
    });
  }

  deleteItem(item: PurchaseItemVo): void {
    const confirmed = confirm(`確定刪除「${item.item}」？`);

    if (!confirmed) {
      return;
    }

    this.shoppingService.deleteItem(this.listId, item.id).subscribe({
      next: (res) => {
        if (res.code !== 200) {
          this.errorMessage = res.message ?? '刪除項目失敗';
          return;
        }

        this.items = this.items.filter((current) => current.id !== item.id);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = err.error?.message ?? '刪除項目失敗';
      }
    });
  }

  toggleCheck(item: PurchaseItemVo): void {
    const nextValue = !item.check;
    item.check = nextValue;

    this.shoppingService.updateCheck(this.listId, item.id, nextValue, this.userId).subscribe({
      error: (err) => {
        console.error(err);
        item.check = !nextValue;
        this.errorMessage = err.error?.message ?? '更新勾選狀態失敗';
      }
    });
  }

  getCategoryName(categoryId: number): string {
    return this.categories.find((category) => category.id === categoryId)?.name ?? '其他';
  }

  trackByItemId(_index: number, item: PurchaseItemVo): number {
    return item.id;
  }
}
