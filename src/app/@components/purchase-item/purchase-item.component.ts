import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AddPurchaseItemReq, PurchaseItemVo, ShoppingList } from '../../@models/shopping_list.model';
import { AuthService } from '../../@services/auth.service';
import { ShoppingListService } from '../../@services/shopping-list.service';
import { TopbarComponent } from "../../shared/topbar/topbar.component";
import { LocationAndCategory } from '../../common/interfaceList';
import { HttpClientService } from '../../@services/http-client.service';
import { HttpClient } from '@angular/common/http';

interface GroupMember {
  user_id: number;
  user_name: string;
  avatar?: string;
}

@Component({
  selector: 'app-purchase-item',
  imports: [CommonModule, FormsModule, RouterLink, TopbarComponent],
  templateUrl: './purchase-item.component.html',
  styleUrl: './purchase-item.component.scss'
})
export class PurchaseItemComponent implements OnInit {

  listId = 0;
  userId = 1;
  groupId: number | null = null;
  items: PurchaseItemVo[] = [];
  categories: LocationAndCategory[] = [];
  members: GroupMember[] = [];
  previousAssignedUserByItemId: Record<number, number> = {};

  isLoading = false;
  isSaving = false;
  isLoadingMembers = false;
  editingItemId: number | null = null;
  errorMessage = '';
  formError = '';

  newItem = {
    item: '',
    quantity: 1,
    categoryId: 1,
    assignedUserId: 1
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly shoppingService: ShoppingListService,
    private readonly http: HttpClientService,
    private readonly httpclient: HttpClient
  ) {}

  ngOnInit(): void {
    this.listId = Number(this.route.snapshot.paramMap.get('listId'));
    this.userId = this.authService.currentUser()?.user_id ?? 1;
    this.newItem.assignedUserId = this.userId;
    this.loadCategories();
    this.loadCurrentList();
    this.loadItems();
  }

  get hasGroup(): boolean {
    return this.groupId !== null && this.groupId > 0;
  }

  get isEditing(): boolean {
    return this.editingItemId !== null;
  }

  loadCategories(): void {
    this.http.getApi(`${this.http.basicUrl}categories/get`).subscribe({
      next: (res: any) => {
        if (res.code !== 200) {
          return;
        }

        this.categories = Object.entries(res.categoiesMap || {}).map(([id, name]) => ({
          id: Number(id),
          name: name as string
        }));

        if (this.categories.length > 0 && !this.categories.some((category) => category.id === this.newItem.categoryId)) {
          this.newItem.categoryId = this.categories[0].id;
        }
      },
      error: (err) => {
        console.error(err);
        this.formError = '分類載入失敗，請稍後再試';
      }
    });
  }

  loadItems(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.shoppingService.getItems(this.listId).subscribe({
      next: (res) => {
        this.items = res ?? [];
        this.previousAssignedUserByItemId = this.items.reduce<Record<number, number>>((acc, item) => {
          acc[item.id] = item.userId;
          return acc;
        }, {});
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = '購物項目載入失敗，請稍後再試';
        this.isLoading = false;
      }
    });
  }

  loadCurrentList(): void {
    this.shoppingService.getLists(this.userId).subscribe({
      next: (lists) => {
        const currentList = (lists ?? []).find((list: ShoppingList) => list.id === this.listId);
        this.groupId = currentList?.group_id ?? null;

        if (this.hasGroup) {
          this.getGroupMember();
        }
      },
      error: (err) => {
        console.error(err);
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
          id: this.editingItemId ?? 0,
          listId: this.listId,
          userId: this.hasGroup ? this.newItem.assignedUserId : this.userId,
          categoryId: this.newItem.categoryId,
          item: itemName,
          quantity: this.newItem.quantity,
          check: false
        }
      ]
    };

    const request$ = this.isEditing
      ? this.shoppingService.updateItem(req)
      : this.shoppingService.addItems(req);

    this.isSaving = true;
    request$.subscribe({
      next: (res) => {
        this.isSaving = false;

        if (res.code !== 200) {
          this.formError = res.message ?? (this.isEditing ? '修改購物項目失敗' : '新增購物項目失敗');
          return;
        }

        this.resetForm();
        this.loadItems();
      },
      error: (err) => {
        console.error(err);
        this.formError = err.error?.message ?? (this.isEditing ? '修改購物項目失敗' : '新增購物項目失敗');
        this.isSaving = false;
      }
    });
  }

  editItem(item: PurchaseItemVo): void {
    this.formError = '';
    this.errorMessage = '';
    this.editingItemId = item.id;
    this.newItem = {
      item: item.item,
      quantity: item.quantity,
      categoryId: item.categoryId,
      assignedUserId: this.hasGroup ? item.userId : this.userId
    };
  }

  cancelEdit(): void {
    this.resetForm();
  }

  confirmItems(): void {
    this.router.navigate(['/shopping-list']);
  }

  private resetForm(): void {
    this.editingItemId = null;
    this.newItem = {
      item: '',
      quantity: 1,
      categoryId: this.newItem.categoryId,
      assignedUserId: this.hasGroup ? this.newItem.assignedUserId : this.userId
    };
  }

  deleteItem(item: PurchaseItemVo): void {
    const confirmed = confirm(`確定刪除「${item.item}」？`);

    if (!confirmed) {
      return;
    }

    this.shoppingService.deleteItem(this.listId, item.id).subscribe({
      next: (res) => {
        if (res.code !== 200) {
          this.errorMessage = res.message ?? '刪除購物項目失敗';
          return;
        }

        this.items = this.items.filter((current) => current.id !== item.id);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = err.error?.message ?? '刪除購物項目失敗';
      }
    });
  }

  getCategoryName(categoryId: number): string {
    return this.categories.find((category) => category.id === categoryId)?.name ?? '其他';
  }

  getMemberName(userId: number): string {
    if (!this.hasGroup) {
      return '';
    }

    return this.members.find((member) => member.user_id === userId)?.user_name ?? `UID: ${userId}`;
  }

  updateAssignedUser(item: PurchaseItemVo): void {
    const previousUserId = this.previousAssignedUserByItemId[item.id] ?? item.userId;

    this.shoppingService.updateAssignedUser(this.listId, item.id, item.userId).subscribe({
      next: (res) => {
        if (res.code !== 200) {
          item.userId = previousUserId;
          this.errorMessage = res.message ?? '更新指派成員失敗';
          return;
        }

        this.previousAssignedUserByItemId[item.id] = item.userId;
      },
      error: (err) => {
        console.error(err);
        item.userId = previousUserId;
        this.errorMessage = err.error?.message ?? '更新指派成員失敗';
      }
    });
  }

  trackByItemId(_index: number, item: PurchaseItemVo): number {
    return item.id;
  }

  trackByMemberId(_index: number, member: GroupMember): number {
    return member.user_id;
  }

  getGroupMember() {
    if (!this.hasGroup) {
      this.members = [];
      return;
    }

    this.isLoadingMembers = true;
    this.httpclient.get<any>(
      `http://localhost:8080/family_life/get_members?group_id=${this.groupId}`
    ).subscribe({

      next: (res) => {
        this.members = res.groupMembersList ?? [];

        if (!this.members.some((member) => member.user_id === this.newItem.assignedUserId)) {
          this.newItem.assignedUserId = this.members[0]?.user_id ?? this.userId;
        }

        this.isLoadingMembers = false;
      },

      error: (err) => {
        console.log(err);
        this.members = [];
        this.isLoadingMembers = false;
      }

    });

  }






}
