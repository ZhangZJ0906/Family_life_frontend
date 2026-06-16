import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { CreateListReq, PurchaseItemVo, ShoppingList } from '../../@models/shopping_list.model';
import { TopbarComponent } from '../../shared/topbar/topbar.component';
import { AuthService } from '../../@services/auth.service';
import { ShoppingListService } from '../../@services/shopping-list.service';
import { DropDownGroupList, Item, LocationAndCategory } from '../../common/interfaceList';
import { ItemListAddDialogComponent } from '../../@component/item-list-add-dialog/item-list-add-dialog.component';
import { HttpClientService } from '../../@services/http-client.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import Swal from 'sweetalert2';


interface GroupOption {
  id: number | 0;
  name: string;
  avatar: string;
}

interface GroupMember {
  user_id: number;
  user_name: string;
  avatar?: string;
}

type StatusFilter = 'unfinished' | 'completed';
type GroupFilter = number | 0 | 'all';


@Component({
  selector: 'app-shopping-list',
  imports: [CommonModule, FormsModule, RouterLink, TopbarComponent,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatCheckboxModule,
    MatProgressBarModule
  ],
  templateUrl: './shopping-list.component.html',
  styleUrl: './shopping-list.component.scss'
})
export class ShoppingListComponent implements OnInit {

  categories: LocationAndCategory[] = [];
  location: LocationAndCategory[] = [];
  userGroups: DropDownGroupList[] = [];


  userId = 1;
  lists: ShoppingList[] = [];
  groupOptions: GroupOption[] = [];
  loadingItemsByListId: Record<number, boolean> = {};
  statusFilter: StatusFilter = 'unfinished';
  groupFilter: GroupFilter = 'all';
  itemsByListId: Record<number, PurchaseItemVo[]> = {};
  membersByGroupId: Record<number, GroupMember[]> = {};
  loadingMembersByGroupId: Record<number, boolean> = {};
  private loadingItemListIds = new Set<number>();

  isLoading = false;
  isCreating = false;
  isDialogOpen = false;
  isLoadingGroups = false;
  errorMessage = '';
  formError = '';
  newTitle = '';
  selectedGroupId: number | null = null;
  selectedStatsList: ShoppingList | null = null;
  userAvatar = 'assets/images/default-user.png';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly shoppingService: ShoppingListService,
    private readonly dialog: MatDialog,
    private readonly http: HttpClientService
  ) {}

ngOnInit(): void {
  this.userId = this.authService.currentUser()?.user_id ?? 1;

  this.loadUserInfo();
  this.loadLists();
  this.loadItemMetadata();
}
private loadUserInfo(): void {
  this.http.getApi(
    `users/get_user_info?userId=${this.userId}`
  ).subscribe({
    next: (res: any) => {
      this.userAvatar = res.avatar || this.defaultUserAvatar;

      // 使用者頭像抓到後，再載入群組
      this.loadGroups();
    },
    error: () => {
      this.userAvatar = this.defaultUserAvatar;

      // 就算使用者頭像失敗，也要載入群組
      this.loadGroups();
    }
  });
}
  get filteredLists(): ShoppingList[] {
    return this.lists.filter((list) => {
      const matchesStatus =
        this.statusFilter === 'completed'
          ? this.isListCompleted(list.id)
          : !this.isListCompleted(list.id);

      const matchesGroup =
        this.groupFilter === 'all'
          ? true
          : list.group_id === this.groupFilter;

      return matchesStatus && matchesGroup;
    });
  }

  // 預設群組頭像
readonly defaultGroupAvatar = 'assets/default-avatar.png';

// 預設使用者頭像
readonly defaultUserAvatar = 'assets/images/default-user.png';

// 取得目前選到的群組資料
getSelectedGroupOption(value: number | 0 | 'all' | null): GroupOption | null {
  if (value === 'all') {
    return {
      id: -1,
      name: '全部群組',
      avatar: 'assets/default-avatar.png',
    };
  }

  if (value === null) {
    return {
      id: -2,
      name: '無',
      avatar: 'assets/default-avatar.png',
    };
  }

  return this.groupOptions.find((group) => group.id === value) ?? null;
}

// 取得群組頭像
getGroupAvatar(groupId: number | null): string {
  if (groupId === 0) {
    return this.userAvatar || this.defaultUserAvatar;
  }

  return (
    this.groupOptions.find((group) => group.id === groupId)?.avatar ||
    this.defaultGroupAvatar
  );
}

// 取得群組名稱
getGroupLabel(groupId: number | null): string {
  if (groupId === 0) {
    return '私人';
  }

  if (groupId === null) {
    return '無';
  }

  return this.groupOptions.find((group) => group.id === groupId)?.name ?? '未知群組';
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

  openStatsDialog(list: ShoppingList): void {
    this.selectedStatsList = list;

    if (!this.itemsByListId[list.id]) {
      this.loadItemsForList(list.id);
    }

    if (list.group_id !== null) {
      this.loadGroupMembers(list.group_id);
    }
  }

  closeStatsDialog(): void {
    this.selectedStatsList = null;
  }

  loadLists(refreshItems = false): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.shoppingService.getLists(this.userId).subscribe({
      next: (res) => {
        this.lists = res ?? [];
        this.removeStaleItemCache(this.lists);
        this.isLoading = false;
        this.loadItemsForLists(this.lists, refreshItems);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = '購物清單載入失敗，請稍後再試';
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: '購物清單載入失敗',
          text: err.error?.message ?? '請稍後再試',
          confirmButtonText: '確認',
        });
      }
    });
  }

 loadGroups(): void {
  this.isLoadingGroups = true;

  // 使用跟物品清單相同的群組 API
  this.http
    .getApi(`family_life/get_group_list?user_id=${this.userId}`)
    .subscribe({
      next: (res: any) => {
        if (!res.groupList) {
          Swal.fire({
            icon: 'error',
            title: '拉取群組錯誤',
            text: res.message || 'server error',
            confirmButtonText: '確認',
          });

          this.groupOptions = [
            {
              id: 0,
              name: '私人',
              avatar: this.userAvatar || this.defaultUserAvatar,
            },
          ];

          this.syncUserGroups();
          this.isLoadingGroups = false;
          return;
        }

        // 後端 groupList 內要有 groupId、groupName、avatar
        const groups: GroupOption[] = res.groupList.map((group: any) => ({
          id: Number(group.groupId),
          name: group.groupName,
          avatar: group.avatar || this.defaultGroupAvatar,
        }));

        // 私人固定放第一個，頭像用登入者自己的頭像
        this.groupOptions = [
          {
            id: 0,
            name: '私人',
            avatar: this.userAvatar || this.defaultUserAvatar,
          },
          ...groups,
        ];

        this.syncUserGroups();
        this.isLoadingGroups = false;
      },

      error: (err) => {
        console.error(err);

        this.groupOptions = [
          {
            id: 0,
            name: '私人',
            avatar: this.userAvatar || this.defaultUserAvatar,
          },
        ];

        this.syncUserGroups();
        this.isLoadingGroups = false;

        Swal.fire({
          icon: 'error',
          title: '拉取群組錯誤',
          text: err.message || 'server error',
          confirmButtonText: '確認',
        });
      },
    });
}
  createList(): void {
    const title = this.newTitle.trim();
    this.formError = '';

    if (!title) {
      this.formError = '請輸入清單名稱';
      Swal.fire({
        icon: 'warning',
        title: '資料未填完整',
        text: '請輸入清單名稱',
        confirmButtonText: '確認',
      });
      return;
    }

    const req: CreateListReq = {
      shoppingList: {
        id: 0,
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
          Swal.fire({
            icon: 'error',
            title: '建立失敗',
            text: this.formError,
            confirmButtonText: '確認',
          });
          return;
        }

        Swal.fire({
          icon: 'success',
          title: '建立成功',
          text: '接著新增購物項目',
          timer: 1000,
          showConfirmButton: false,
        });
        this.navigateToNewestList();
      },
      error: (err) => {
        console.error(err);
        this.formError = err.error?.message ?? '建立清單失敗';
        this.isCreating = false;
        Swal.fire({
          icon: 'error',
          title: '建立失敗',
          text: this.formError,
          confirmButtonText: '確認',
        });
      }
    });
  }

  deleteList(list: ShoppingList): void {
    Swal.fire({
      icon: 'warning',
      title: '確定刪除？',
      text: `確定刪除「${list.title}」嗎？`,
      showCancelButton: true,
      confirmButtonText: '刪除',
      cancelButtonText: '取消',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#64748b',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.shoppingService.deleteList(list.id).subscribe({
        next: (res) => {
          if (res.code !== 200) {
            this.errorMessage = res.message ?? '刪除清單失敗';
            Swal.fire({
              icon: 'error',
              title: '刪除失敗',
              text: this.errorMessage,
              confirmButtonText: '確認',
            });
            return;
          }

          Swal.fire({
            icon: 'success',
            title: '刪除成功',
            text: `「${list.title}」已刪除`,
            timer: 1000,
            showConfirmButton: false,
          });
          this.loadLists();
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = err.error?.message ?? '刪除清單失敗';
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

  getGroupName(groupId: number | null): string {
    return this.groupOptions.find((group) => group.id === groupId)?.name ?? '未知群組';
  }

  getItems(listId: number): PurchaseItemVo[] {
    return this.itemsByListId[listId] ?? [];
  }

  getTotalCount(listId: number): number {
    return this.getItems(listId).length;
  }

  getBoughtCount(listId: number): number {
    return this.getItems(listId).filter((item) => item.check).length;
  }

  getRemainingCount(listId: number): number {
    return this.getTotalCount(listId) - this.getBoughtCount(listId);
  }

  getPurchaseProgressText(listId: number): string {
    return `${this.getBoughtCount(listId)}/${this.getTotalCount(listId)}`;
  }

  getProgressPercent(listId: number): number {
    const totalCount = this.getTotalCount(listId);
    return totalCount === 0 ? 0 : Math.round((this.getBoughtCount(listId) / totalCount) * 100);
  }

  isListCompleted(listId: number): boolean {
    return this.getTotalCount(listId) > 0 && this.getRemainingCount(listId) === 0;
  }

  toggleCheck(list: ShoppingList, item: PurchaseItemVo, event?: MatCheckboxChange): void {
    // Checkbox reflects the saved state only. The dialog must complete successfully first.
    if (event) {
      event.source.checked = item.check;
    }

    if (item.check) {
      this.handleUncheck(list, item);
      return;
    }

    const dialogRef = this.dialog.open(ItemListAddDialogComponent, {
      width: '540px',
      height: '540px',
      data: {
        title: '新增物品',
        location: this.location,
        categories: this.categories,
        currentGroupId: list.group_id ?? 0,
        groups: this.getDialogGroups(list.group_id),
        prefillItem: {
          name: item.item,
          categoryId: item.categoryId,
          quantity: item.quantity,
          unit: '個',
          purchaseDate: this.getTodayDate(),
          groupId: list.group_id ?? 0
        }
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.updateShoppingItemCheck(list, item, true);
      }
    });
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

  getCategoryName(categoryId: number): string {
    return this.categories.find((category) => category.id === categoryId)?.name ?? '其他';
  }

  getMemberName(groupId: number | null, userId: number): string {
    if (!groupId) {
      return '';
    }

    return this.membersByGroupId[groupId]?.find((
      member) => member.user_id === userId)?.user_name ?? '';
  }

  isLoadingMembers(groupId: number | null): boolean {
    return groupId !== null && !!this.loadingMembersByGroupId[groupId];
  }

  trackByListId(_index: number, list: ShoppingList): number {
    return list.id;
  }

  private handleUncheck(list: ShoppingList, item: PurchaseItemVo): void {
    Swal.fire({
      icon: 'warning',
      title: '取消已購買？',
      text: `確定取消「${item.item}」的已購買狀態？`,
      showCancelButton: true,
      confirmButtonText: '確認取消',
      cancelButtonText: '保留',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#64748b',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.deleteMatchedItemListItem(list, item, () => {
        this.updateShoppingItemCheck(list, item, false);
      });
    });
  }


  private updateShoppingItemCheck(list: ShoppingList, item: PurchaseItemVo, nextValue: boolean): void {
    const previousCheckDate = item.checkDate;
    const previousCheckMan = item.checkMan;
    const checkDate = nextValue ? this.getTodayDate() : undefined;
    const checkMan = nextValue ? this.userId : 0;

    item.check = nextValue;
    item.checkDate = checkDate;
    item.checkMan = checkMan;

    this.shoppingService.updateCheck(list.id, item.id, nextValue, this.userId).subscribe({
      next: () => {
        Swal.fire({
          icon: nextValue ? 'success' : 'info',
          title: nextValue ? '已標記為購買' : '已取消購買狀態',
          timer: 900,
          showConfirmButton: false,
        });
        this.loadItemsForList(list.id, true);
      },
      error: (err) => {
        console.error(err);
        item.check = !nextValue;
        item.checkDate = previousCheckDate;
        item.checkMan = previousCheckMan;
        this.errorMessage = err.error?.message ?? '更新購買狀態失敗';
        Swal.fire({
          icon: 'error',
          title: '更新失敗',
          text: this.errorMessage,
          confirmButtonText: '確認',
        });
      }
    });
  }

  private deleteMatchedItemListItem(list: ShoppingList, item: PurchaseItemVo, onDeleted: () => void): void {
    const groupId = list.group_id ?? 0; //TODO: 後端購物清單項目改為必帶groupId後，這裡就不需要再判斷一次了
    const url = `item/getItems?userId=${this.userId}&groupId=${groupId}`;

    // let url = `item/getItems?userId=${this.userId}`;
    // if (list.group_id !== null) {
    //   url += `&groupId=${list.group_id}`;
    // }

    this.http.getApi(url).subscribe({
      next: (res: any) => {
        const itemList = (res.items || []) as Item[];
        const matchedItem = this.findMatchedItemListItem(list, item, itemList);

        if (!matchedItem) {
          Swal.fire({
            icon: 'warning',
            title: '找不到對應物品',
            text: '找不到對應的物品清單項目，未刪除也未取消勾選。',
            confirmButtonText: '確認',
          });
          return;
        }

        this.http.postApi(`item/delete`, [matchedItem.id]).subscribe({
          next: (deleteRes: any) => {
            if (deleteRes.code !== 200) {
              this.errorMessage = deleteRes.message ?? '刪除物品清單項目失敗';
              Swal.fire({
                icon: 'error',
                title: '刪除失敗',
                text: this.errorMessage,
                confirmButtonText: '確認',
              });
              return;
            }

            onDeleted();
          },
          error: (err) => {
            console.error(err);
            this.errorMessage = err.error?.message ?? '刪除物品清單項目失敗';
            Swal.fire({
              icon: 'error',
              title: '刪除失敗',
              text: this.errorMessage,
              confirmButtonText: '確認',
            });
          }
        });
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = err.error?.message ?? '查詢物品清單項目失敗';
        Swal.fire({
          icon: 'error',
          title: '查詢失敗',
          text: this.errorMessage,
          confirmButtonText: '確認',
        });
      }
    });
  }

  // private loadItemsForLists(lists: ShoppingList[], force = false): void {
  //   lists.forEach((list) => {
  //     this.loadItemsForList(list.id, force);

  //     if (list.group_id !== null) {
  //       this.loadGroupMembers(list.group_id);
  //     }
  //   });
  // }

  private loadItemsForLists(lists: ShoppingList[], force = false): void {
    const listIds = lists
      .map((list) => list.id)
      .filter((listId) => force || !this.itemsByListId[listId]);

    if (listIds.length === 0) {
      return;
    }

    listIds.forEach((listId) => {
      this.loadingItemsByListId[listId] = true;
    });

    this.shoppingService.getItemsBatch(listIds).subscribe({
      next: (itemsMap) => {
        listIds.forEach((listId) => {
          this.itemsByListId[listId] = itemsMap[listId] ?? [];
          this.loadingItemsByListId[listId] = false;
        });
      },
      error: (err) => {
        console.error(err);
        listIds.forEach((listId) => {
          this.itemsByListId[listId] = [];
          this.loadingItemsByListId[listId] = false;
        });
      }
    });
  }


  private loadItemsForList(listId: number, force = false): void {
    if (!force && this.itemsByListId[listId]) {
      return;
    }

    if (this.loadingItemListIds.has(listId)) {
      return;
    }

    this.loadingItemListIds.add(listId);
    this.loadingItemsByListId[listId] = true;

    this.shoppingService.getItems(listId).subscribe({
      next: (items) => {
        this.itemsByListId[listId] = items ?? [];
        this.loadingItemsByListId[listId] = false;
        this.loadingItemListIds.delete(listId);
      },
      error: (err) => {
        console.error(err);
        this.itemsByListId[listId] = [];
        this.loadingItemsByListId[listId] = false;
        this.loadingItemListIds.delete(listId);
      }
    });
  }

  private removeStaleItemCache(lists: ShoppingList[]): void {
    const visibleListIds = new Set(lists.map((list) => String(list.id)));

    Object.keys(this.itemsByListId).forEach((listId) => {
      if (!visibleListIds.has(listId)) {
        delete this.itemsByListId[Number(listId)];
        delete this.loadingItemsByListId[Number(listId)];
      }
    });
  }

  private loadGroupMembers(groupId: number): void {
    if (this.membersByGroupId[groupId] || this.loadingMembersByGroupId[groupId]) {
      return;
    }

    this.loadingMembersByGroupId[groupId] = true;

    this.http.getApi(`family_life/get_members?group_id=${groupId}`).subscribe({
      next: (res: any) => {
        this.membersByGroupId[groupId] = res.groupMembersList ?? [];
        this.loadingMembersByGroupId[groupId] = false;
      },
      error: (err) => {
        console.error(err);
        this.membersByGroupId[groupId] = [];
        this.loadingMembersByGroupId[groupId] = false;
      }
    });
  }

  private getTodayDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }


  private findMatchedItemListItem(list: ShoppingList, shoppingItem: PurchaseItemVo, itemList: Item[]): Item | undefined {
    const expectedGroupId = list.group_id ?? 0;
    const expectedDate = shoppingItem.checkDate ?? this.getTodayDate();

    return itemList.find((item) => {
      const itemGroupId = item.groupId ?? 0;
      return itemGroupId === expectedGroupId &&
        item.name === shoppingItem.item &&
        Number(item.categoryId) === Number(shoppingItem.categoryId) &&
        Number(item.quantity) === Number(shoppingItem.quantity) &&
        this.normalizeDate(item.purchaseDate) === expectedDate;
    }) ?? itemList.find((item) => {
      const itemGroupId = item.groupId ?? 0;
      return itemGroupId === expectedGroupId &&
        item.name === shoppingItem.item &&
        Number(item.categoryId) === Number(shoppingItem.categoryId);
    });
  }

  private normalizeDate(value: string | undefined): string {
    if (!value) {
      return '';
    }

    return value.includes('T') ? value.split('T')[0] : value;
  }

  /* 載入item list*/
  private loadItemMetadata(groupId = 0): void {
    const url = `item/getItems?userId=${this.userId}&groupId=${groupId}`;

    this.http.getApi(url).subscribe({
      next: (res: any) => {
        this.location = Object.entries(res.locationMap || {}).map(([id, name]) => ({
          id: Number(id),
          name: name as string
        }));

        this.categories = Object.entries(res.categoriesMap || {}).map(([id, name]) => ({
          id: Number(id),
          name: name as string
        }));

        this.categories.unshift({ id: 0, name: '全部' });

        this.syncUserGroups();
      },
      error: (err) => console.error(err)
    });
  }

 private syncUserGroups(): void {
  this.userGroups = this.groupOptions.map((group) => ({
    groupId: group.id,
    groupName: group.name,
    avatar: group.avatar,
  } as any));
}

  private getDialogGroups(groupId: number | null): DropDownGroupList[] {
    const dialogGroups = this.userGroups.length > 0
      ? this.userGroups
      : [{ groupId: 0, groupName: '私人' }];

    if (groupId === null || dialogGroups.some((group) => group.groupId === groupId)) {
      return dialogGroups;
    }

    return [
      ...dialogGroups,
      {
        groupId,
        groupName: this.getGroupName(groupId)
      }
    ];
  }

  //下載清單
  downloadStats(list: ShoppingList): void {
    const totalCount = this.getTotalCount(list.id);

    if (totalCount === 0) {
      Swal.fire({
        icon: 'warning',
        title: '請先新增物品',
        text: '此購物清單目前沒有任何項目可下載',
        confirmButtonText: '確認'
      });

      return;
    }
    const items = this.getItems(list.id);

    const csvRows: string[] = [];

    csvRows.push(`清單名稱,${list.title}`);
    csvRows.push(`群組,${this.getGroupLabel(list.group_id)}`);
    csvRows.push(`完成率,${this.getProgressPercent(list.id)}%`);
    csvRows.push('');

    csvRows.push(
      '品項,分類,數量,指派人,狀態,購買日期'
    );

    items.forEach(item => {
      csvRows.push([
        item.item,
        this.getCategoryName(item.categoryId),
        item.quantity,
        this.getMemberName(list.group_id, item.userId),
        item.check ? '已完成' : '未完成',
        item.checkDate ?? ''
      ].join(','));
    });

    const blob = new Blob(
      ['\ufeff' + csvRows.join('\n')],
      { type: 'text/csv;charset=utf-8;' }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${list.title}_購物統計_${this.getTodayDate()}.csv`;

    link.click();

    URL.revokeObjectURL(url);
  }
}
