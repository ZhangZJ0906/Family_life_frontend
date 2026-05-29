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
import Swal from 'sweetalert2';

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
  groupId!: number;
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
        Swal.fire({
          icon: 'error',
          title: '分類載入失敗',
          text: res.message || '請稍後再試',
          confirmButtonText: '確認',
        });
        return;
      }

      this.categories = Object.entries(res.categoiesMap || {}).map(([id, name]) => ({
        id: Number(id),
        name: name as string
      }));

      if (
        this.categories.length > 0 &&
        !this.categories.some((category) => category.id === this.newItem.categoryId)
      ) {
        this.newItem.categoryId = this.categories[0].id;
      }
    },

    error: (err) => {
      console.error(err);

      this.formError = '分類載入失敗，請稍後再試';

      Swal.fire({
        icon: 'error',
        title: '分類載入失敗',
        text: err.error?.message || '請稍後再試',
        confirmButtonText: '確認',
      });
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

      Swal.fire({
        icon: 'error',
        title: '購物項目載入失敗',
        text: err.error?.message || '請稍後再試',
        confirmButtonText: '確認',
      });
    }
  });
}
  loadCurrentList(): void {
    this.shoppingService.getLists(this.userId).subscribe({
      next: (lists) => {
        const currentList = (lists ?? []).find((list: ShoppingList) => list.id === this.listId);
        this.groupId = currentList?.group_id ?? 0;

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

    Swal.fire({
      icon: 'warning',
      title: '資料未填完整',
      text: '請輸入項目名稱',
      confirmButtonText: '確認',
    });

    return;
  }

  if (!Number.isInteger(this.newItem.quantity) || this.newItem.quantity < 1) {
    this.formError = '數量至少為 1';

    Swal.fire({
      icon: 'warning',
      title: '數量錯誤',
      text: '數量至少為 1',
      confirmButtonText: '確認',
    });

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
        this.formError =
          res.message ??
          (this.isEditing ? '修改購物項目失敗' : '新增購物項目失敗');

        Swal.fire({
          icon: 'error',
          title: this.isEditing ? '修改失敗' : '新增失敗',
          text: this.formError,
          confirmButtonText: '確認',
        });

        return;
      }

      Swal.fire({
        icon: 'success',
        title: this.isEditing ? '修改成功' : '新增成功',
        text: this.isEditing ? '購物項目已更新' : '購物項目已新增',
        timer: 1200,
        showConfirmButton: false,
      });

      this.resetForm();
      this.loadItems();
    },

    error: (err) => {
      console.error(err);

      this.formError =
        err.error?.message ??
        (this.isEditing ? '修改購物項目失敗' : '新增購物項目失敗');

      this.isSaving = false;

      Swal.fire({
        icon: 'error',
        title: this.isEditing ? '修改失敗' : '新增失敗',
        text: this.formError,
        confirmButtonText: '確認',
      });
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
  Swal.fire({
    icon: 'warning',
    title: '確定刪除？',
    text: `確定刪除「${item.item}」？`,
    showCancelButton: true,
    confirmButtonText: '刪除',
    cancelButtonText: '取消',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#64748b',
  }).then((result) => {
    if (!result.isConfirmed) {
      return;
    }

    this.shoppingService.deleteItem(this.listId, item.id, this.userId, this.groupId).subscribe({
      next: (res) => {
        if (res.code !== 200) {
          this.errorMessage = res.message ?? '刪除購物項目失敗';

          Swal.fire({
            icon: 'error',
            title: '刪除失敗',
            text: this.errorMessage,
            confirmButtonText: '確認',
          });

          return;
        }

        this.items = this.items.filter((current) => current.id !== item.id);

        Swal.fire({
          icon: 'success',
          title: '刪除成功',
          text: `「${item.item}」已刪除`,
          timer: 1200,
          showConfirmButton: false,
        });
      },

      error: (err) => {
        console.error(err);

        this.errorMessage = err.error?.message ?? '刪除購物項目失敗';

        Swal.fire({
          icon: 'error',
          title: '刪除失敗',
          text: this.errorMessage,
          confirmButtonText: '確認',
        });
      }
    });
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
  const previousUserId =
    this.previousAssignedUserByItemId[item.id] ?? item.userId;

  this.shoppingService
    .updateAssignedUser(this.listId, item.id, item.userId)
    .subscribe({
      next: (res) => {
        if (res.code !== 200) {
          // 更新失敗，還原原本指派成員
          item.userId = previousUserId;

          this.errorMessage = res.message ?? '更新指派成員失敗';

          Swal.fire({
            icon: 'error',
            title: '更新失敗',
            text: this.errorMessage,
            confirmButtonText: '確認',
          });

          return;
        }

        // 更新成功，記錄新的指派成員
        this.previousAssignedUserByItemId[item.id] = item.userId;

        Swal.fire({
          icon: 'success',
          title: '更新成功',
          text: '指派成員已更新',
          timer: 1000,
          showConfirmButton: false,
        });
      },

      error: (err) => {
        console.error(err);

        // API 錯誤，還原原本指派成員
        item.userId = previousUserId;

        this.errorMessage =
          err.error?.message ?? '更新指派成員失敗';

        Swal.fire({
          icon: 'error',
          title: '更新失敗',
          text: this.errorMessage,
          confirmButtonText: '確認',
        });
      },
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
      if (res.code !== 200) {
        this.members = [];
        this.isLoadingMembers = false;

        Swal.fire({
          icon: 'error',
          title: '群組成員載入失敗',
          text: res.message || '請稍後再試',
          confirmButtonText: '確認',
        });

        return;
      }

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

      Swal.fire({
        icon: 'error',
        title: '群組成員載入失敗',
        text: err.error?.message || '請稍後再試',
        confirmButtonText: '確認',
      });
    }

  });
}





}
