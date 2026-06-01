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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import Swal from 'sweetalert2';


interface GroupOption {
  id: number | 0;
  name: string;
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

  isLoading = false;
  isCreating = false;
  isDialogOpen = false;
  isLoadingGroups = false;
  errorMessage = '';
  formError = '';
  newTitle = '';
  selectedGroupId: number | null = null;
  selectedStatsList: ShoppingList | null = null;


  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly shoppingService: ShoppingListService,
    private readonly dialog: MatDialog,
    private readonly http: HttpClientService
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.currentUser()?.user_id ?? 1;
    this.loadGroups();
    this.loadLists();
    this.loadItemMetadata();
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

  loadLists(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.shoppingService.getLists(this.userId).subscribe({
      next: (res) => {
        this.lists = res ?? [];
        this.isLoading = false;
        this.loadItemsForLists(this.lists);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = '購物清單載入失敗，請稍後再試';
        this.isLoading = false;
      }
    });
  }

  loadGroups(): void {
    this.isLoadingGroups = true;

    this.shoppingService.getUserGroups(this.userId).subscribe({
      next: (res) => {
        const groups = Object.entries(res.groupIdList ?? {}).map(([id, name]) => ({
          id: Number(id),
          name
        }));

        this.groupOptions = [{ id: 0, name: '私人' }, ...groups];
        this.syncUserGroups();
        this.isLoadingGroups = false;
      },
      error: (err) => {
        console.error(err);
        this.groupOptions = [{ id: 0, name: '私人' }];
        this.syncUserGroups();
        this.isLoadingGroups = false;
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
    const confirmed = confirm(`確定刪除「${list.title}」嗎？`);

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

  toggleCheck(list: ShoppingList, item: PurchaseItemVo, event?: Event): void {
    event?.preventDefault();

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
      if (result) {
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
    if (groupId === null) {
      return '';
    }

    return this.membersByGroupId[groupId]?.find((member) => member.user_id === userId)?.user_name ?? `UID: ${userId}`;
  }

  isLoadingMembers(groupId: number | null): boolean {
    return groupId !== null && !!this.loadingMembersByGroupId[groupId];
  }

  trackByListId(_index: number, list: ShoppingList): number {
    return list.id;
  }

  private handleUncheck(list: ShoppingList, item: PurchaseItemVo): void {
    const confirmed = confirm(`確定取消「${item.item}」的已購買狀態？`);
    if (!confirmed) {
      return;
    }

    this.deleteMatchedItemListItem(list, item, () => {
      this.updateShoppingItemCheck(list, item, false);
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
        this.loadItemsForList(list.id);
      },
      error: (err) => {
        console.error(err);
        item.check = !nextValue;
        item.checkDate = previousCheckDate;
        item.checkMan = previousCheckMan;
        this.errorMessage = err.error?.message ?? '更新購買狀態失敗';
      }
    });
  }

  private deleteMatchedItemListItem(list: ShoppingList, item: PurchaseItemVo, onDeleted: () => void): void {
    const groupId = list.group_id ?? 0; //TODO: 後端購物清單項目改為必帶groupId後，這裡就不需要再判斷一次了
    const url = `${this.http.basicUrl}item/getItems?userId=${this.userId}&groupId=${groupId}`;

    // let url = `${this.http.basicUrl}item/getItems?userId=${this.userId}`;
    // if (list.group_id !== null) {
    //   url += `&groupId=${list.group_id}`;
    // }

    this.http.getApi(url).subscribe({
      next: (res: any) => {
        const itemList = (res.items || []) as Item[];
        const matchedItem = this.findMatchedItemListItem(list, item, itemList);

        if (!matchedItem) {
          alert('找不到對應的物品清單項目，未刪除也未取消勾選。');
          return;
        }

        this.http.postApi(`${this.http.basicUrl}item/delete`, [matchedItem.id]).subscribe({
          next: (deleteRes: any) => {
            if (deleteRes.code !== 200) {
              this.errorMessage = deleteRes.message ?? '刪除物品清單項目失敗';
              return;
            }

            onDeleted();
          },
          error: (err) => {
            console.error(err);
            this.errorMessage = err.error?.message ?? '刪除物品清單項目失敗';
          }
        });
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = err.error?.message ?? '查詢物品清單項目失敗';
      }
    });
  }

  private loadItemsForLists(lists: ShoppingList[]): void {
    lists.forEach((list) => {
      this.loadItemsForList(list.id);

      if (list.group_id !== null) {
        this.loadGroupMembers(list.group_id);
      }
    });
  }

  private loadItemsForList(listId: number): void {
    this.loadingItemsByListId[listId] = true;

    this.shoppingService.getItems(listId).subscribe({
      next: (items) => {
        this.itemsByListId[listId] = items ?? [];
        this.loadingItemsByListId[listId] = false;
      },
      error: (err) => {
        console.error(err);
        this.itemsByListId[listId] = [];
        this.loadingItemsByListId[listId] = false;
      }
    });
  }

  private loadGroupMembers(groupId: number): void {
    if (this.membersByGroupId[groupId] || this.loadingMembersByGroupId[groupId]) {
      return;
    }

    this.loadingMembersByGroupId[groupId] = true;

    this.http.getApi(`${this.http.basicUrl}family_life/get_members?group_id=${groupId}`).subscribe({
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
    const url = `${this.http.basicUrl}item/getItems?userId=${this.userId}&groupId=${groupId}`;

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
      groupId: group.id ?? 0,
      groupName: group.name
    }));
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


}
