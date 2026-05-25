import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { CreateListReq, ShoppingList } from '../../@models/shopping_list.model';
import { TopbarComponent } from '../../shared/topbar/topbar.component';
import { AuthService } from '../../@services/auth.service';
import { ShoppingListService } from '../../@services/shopping-list.service';

interface GroupOption {
  id: number | null;
  name: string;
}

@Component({
  selector: 'app-shopping-list',
  imports: [CommonModule, FormsModule, RouterLink, TopbarComponent],
  templateUrl: './shopping-list.component.html',
  styleUrl: './shopping-list.component.scss'
})
export class ShoppingListComponent implements OnInit {
  userId = 1;
  lists: ShoppingList[] = [];

  // GROUP_FEATURE: 目前後端還沒有 groups API，所以先只提供「無」。
  // 之後新增群組功能時，在這裡改成從後端載入使用者可選的 groups。
  groupOptions: GroupOption[] = [{ id: null, name: '無' }];

  isLoading = false;
  isCreating = false;
  isDialogOpen = false;
  errorMessage = '';
  formError = '';
  newTitle = '';
  selectedGroupId: number | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly shoppingService: ShoppingListService
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.currentUser()?.user_id ?? 1;
    this.loadLists();
  }

  openCreateDialog(): void {
    this.newTitle = '';
    this.selectedGroupId = null;
    this.formError = '';
    this.isDialogOpen = true;
  }

  closeCreateDialog(): void {
    if (this.isCreating) {
      return;
    }

    this.isDialogOpen = false;
  }

  loadLists(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.shoppingService.getLists(this.userId).subscribe({
      next: (res) => {
        this.lists = res ?? [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = '購物清單載入失敗，請稍後再試';
        this.isLoading = false;
      }
    });
  }

  createList(): void {
    const title = this.newTitle.trim();
    this.formError = '';

    if (!title) {
      this.formError = '請輸入清單名稱';
      return;
    }

    const req: CreateListReq = {
      shoppingList: {
        id: 0,
        // GROUP_FEATURE: 「無」會送 null；選到群組時才送真實 group_id。
        group_id: this.selectedGroupId,
        title,
        createrId: this.userId
      },
      purchaseItemVoList: []
    };

    this.isCreating = true;
    this.shoppingService.create(req).subscribe({
      next: (res) => {
        if (res.code !== 200) {
          this.formError = res.message ?? '建立清單失敗';
          this.isCreating = false;
          return;
        }

        this.navigateToNewestList();
      },
      error: (err) => {
        console.error(err);
        this.formError = err.error?.message ?? '建立清單失敗';
        this.isCreating = false;
      }
    });
  }

  deleteList(list: ShoppingList): void {
    const confirmed = confirm(`確定刪除「${list.title}」？`);

    if (!confirmed) {
      return;
    }

    this.shoppingService.deleteList(list.id).subscribe({
      next: (res) => {
        if (res.code !== 200) {
          this.errorMessage = res.message ?? '刪除清單失敗';
          return;
        }

        this.loadLists();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = err.error?.message ?? '刪除清單失敗';
      }
    });
  }

  getGroupName(groupId: number | null): string {
    return this.groupOptions.find((group) => group.id === groupId)?.name ?? '無';
  }

  private navigateToNewestList(): void {
    this.shoppingService.getLists(this.userId).subscribe({
      next: (lists) => {
        const newestList = [...(lists ?? [])].sort((a, b) => b.id - a.id)[0];
        this.isCreating = false;
        this.isDialogOpen = false;

        if (!newestList) {
          this.loadLists();
          return;
        }

        this.router.navigate(['/purchase-item', newestList.id]);
      },
      error: (err) => {
        console.error(err);
        this.isCreating = false;
        this.isDialogOpen = false;
        this.loadLists();
      }
    });
  }

  trackByListId(_index: number, list: ShoppingList): number {
    return list.id;
  }
}
