import { MatSort, MatSortModule } from '@angular/material/sort';
import {
  DropDownGroupList,
  Item,
  LocationAndCategory,
} from './../../common/interfaceList';
import { MatIconModule } from '@angular/material/icon';
import {
  MatChipListbox,
  MatChipListboxChange,
  MatChipOption,
} from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { SelectionModel } from '@angular/cdk/collections';
import { Component, inject, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { HttpClientService } from '../../@services/http-client.service';
import Swal from 'sweetalert2';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ItemListAddDialogComponent } from '../item-list-add-dialog/item-list-add-dialog.component';
import { ItemListEditDialogComponent } from '../item-list-edit-dialog/item-list-edit-dialog.component';
import {
  MatSelect,
  MatOption,
  MatSelectModule,
} from '@angular/material/select';
import { TopbarComponent } from '../../shared/topbar/topbar.component';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../@services/auth.service';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export enum TableMode {
  Item = 'item',
  Subscription = 'subscription',
  Warranty = 'warranty',
  Medicine = 'medicine',
  GlobalSearch = 'global',
}
@Component({
  selector: 'app-item-list',
  imports: [
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatPaginator,
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipListbox,
    MatChipOption,
    MatSelectModule,
    MatSortModule,
    TopbarComponent,
  ],
  templateUrl: './item-list.component.html',
  styleUrl: './item-list.component.scss',
})
export class ItemListComponent {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  // ─── 模式管理 ─────────────────────────────────────────────
  currentMode: TableMode = TableMode.Item;
  readonly TableMode = TableMode; // 讓 HTML 模板可以用 enum

  // 各模式對應表格欄位（取代五個 xxxDisplayedColumns 屬性）
  readonly columnConfig: Record<TableMode, string[]> = {
    [TableMode.Item]: [
      'select',
      'name',
      'quantity',
      'unitPrice',
      'price',
      'expireDate',
      'status',
      'notify',
      'actions',
    ],
    [TableMode.Subscription]: [
      'select',
      'name',
      'price',
      'billingCycle',
      'trialEndDate',
      'nextBillingDate',
      'status',
      'notify',
      'actions',
    ],
    [TableMode.Warranty]: [
      'select',
      'productName',
      'price',
      'brand',
      'model',
      'serialNumber',
      'purchaseDate',
      'warrantyEndDate',
      'status',
      'notify',
      'actions',
    ],
    [TableMode.Medicine]: [
      'select',
      'name',
      'medicineType',
      'quantity',
      'price',
      'expireDate',
      'usageMethod',
      'status',
      'notify',
      'actions',
    ],
    [TableMode.GlobalSearch]: [
      'select',
      '_typeName',
      'name',
      'price',
      'expireOrEndDate',
      'status',
      'actions',
    ],
  };

  // ─── 頁面狀態 ──────────────────────────────────────────────
  basicUrl!: string;
  selectedCategory = '全部';
  location: LocationAndCategory[] = [];
  categories: LocationAndCategory[] = [];
  userGroups: DropDownGroupList[] = [];
  currentGroupId: any = null;
  currentUserId: any;
  lastSelectedRow: any = null;
  currentUserAvatar = 'assets/default-avatar.png'; //預設群組投向

  //上次登入時間
  lastLoginTime!: Date;

  // 統一資料快取（取代四個 xxxList 屬性）
  cachedData: {
    item: any[];
    subscription: any[];
    warranty: any[];
    medicine: any[];
  } = {
    item: [],
    subscription: [],
    warranty: [],
    medicine: [],
  };

  // ─── 表格 ─────────────────────────────────────────────────
  selection = new SelectionModel<any>(true, []);
  dataSource = new MatTableDataSource<any>([]);

  constructor(
    private http: HttpClientService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
  ) {
    this.basicUrl = this.http.basicUrl;
    this.currentUserId = this.authService.currentUser()?.user_id ?? 0;
    // 目前登入者自己的頭像，私人物品使用
    this.currentUserAvatar =
      this.authService.currentUser()?.avatar || 'assets/default-avatar.png';
  }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const groupId = Number(params['groupId']) || 0;
      this.initData(groupId);
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'expireDate':
        case 'expireOrEndDate':
        case 'warrantyEndDate':
        case 'nextBillingDate':
        case 'nextBillingDate':
        case 'trialEndDate':
        case 'purchaseDate':
          const dateStr =
            item.expireDate ||
            item.expireOrEndDate ||
            item.warrantyEndDate ||
            item.nextBillingDate ||
            item.trialEndDate ||
            item.purchaseDate;
          return dateStr ? new Date(dateStr).getTime() : 0;
        default:
          return item[property];
      }
    };
  }

  initData(groupId: number) {
    this.currentGroupId = groupId;
    if (groupId == null) groupId = 0;
    this.getLoginItemPageTime().then(() => {
      console.log('login:', this.lastLoginTime);

      this.getUserGroupData(groupId);
    });
  }
  // 自動根據當前模式回傳欄位（取代可寫的 displayedColumns 屬性）
  get displayedColumns(): string[] {
    return this.columnConfig[this.currentMode];
  }

  // 分類名稱 → 特殊模式（訂閱 / 保固 / 藥品）的對應表
  private readonly categoryModeMap: Partial<Record<string, TableMode>> = {
    訂閱: TableMode.Subscription,
    藥品: TableMode.Medicine,
    保固: TableMode.Warranty,
  };

  // 非 Item 模式的查詢端點
  private readonly fetchEndpointMap: Partial<Record<TableMode, string>> = {
    [TableMode.Subscription]: 'subscription/getByGroup',
    [TableMode.Warranty]: 'warranty/getByGroup',
    [TableMode.Medicine]: 'medicine/getByGroup',
  };

  // 非 Item 模式的逐一刪除端點（Item 用批次 POST，邏輯不同）
  private readonly deleteEndpointMap: Partial<Record<string, string>> = {
    subscription: 'subscription/delete',
    warranty: 'warranty/delete',
    medicine: 'medicine/delete',
  };

  // Edit Dialog 回傳的 _type → 更新 API 端點對應表
  // 注意：edit-dialog 回傳的是 'item'（不是 'general'），確保 key 一致
  private updateApiMap: Record<string, string> = {
    item: 'item/update',
    subscription: 'subscription/update',
    warranty: 'warranty/update',
    medicine: 'medicine/update',
    notifyOnly: 'item/updateNotify', // ✅
    subscriptionNotifyOnly: 'subscription/updateNotify', // ✅
    warrantyNotifyOnly: 'warranty/updateNotify', // ✅
    medicineNotifyOnly: 'medicine/updateNotify', // ✅
  };
  private refreshTableData(newData: any[]) {
    this.dataSource.data = newData;
    setTimeout(() => {
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
    });
  }

  // ─── 全域搜尋用：整合四種資料，並加上 _type / _typeName 標記 ───
  get allData(): any[] {
    return [
      ...this.cachedData.item.map((i) => ({
        ...i,
        _type: 'item',
        _typeName: '物品',
        expireOrEndDate: i.expireDate,
      })),
      ...this.cachedData.subscription.map((s) => ({
        ...s,
        _type: 'subscription',
        _typeName: '訂閱',
        expireOrEndDate: s.nextBillingDate,
      })),
      ...this.cachedData.warranty.map((w) => ({
        ...w,
        _type: 'warranty',
        _typeName: '保固',
        name: w.productName,
        expireOrEndDate: w.warrantyEndDate,
      })),
      ...this.cachedData.medicine.map((m) => ({
        ...m,
        _type: 'medicine',
        _typeName: '藥品',
        expireOrEndDate: m.expireDate,
      })),
    ];
  }

  // ─── Dialog：新增 ──────────────────────────────────────────
  // Add Dialog 自己處理 API 呼叫（item/add、subscription/add…），
  // 成功後 close(true)，這裡只需要重新查詢即可
  openAddDialog() {
    const dialogRef = this.dialog.open(ItemListAddDialogComponent, {
      width: '540px',
      height: '540px',
      data: {
        title: '新增物品',
        location: this.location,
        categories: this.categories,
        currentGroupId: this.currentGroupId,
        groups: this.userGroups,
        // Dialog 仍以三個 boolean 判斷預設分類，由 currentMode 計算出來
        isSubscriptionMode: this.currentMode === TableMode.Subscription,
        isWarrantyMode: this.currentMode === TableMode.Warranty,
        isMedicineMode: this.currentMode === TableMode.Medicine,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.refreshCurrentMode();
    });
  }

  // ─── Dialog：編輯 ──────────────────────────────────────────
  // Edit Dialog 回傳 payload（含 _type），這裡用 updateApiMap 決定端點
  openEditDialog(row: any) {
    const dialogRef = this.dialog.open(ItemListEditDialogComponent, {
      width: '540px',
      height: '540px',
      data: {
        item: row,
        locationMap: this.location,
        categoriesMap: this.categories,
        groups: this.userGroups,
        isSubscriptionMode: this.currentMode === TableMode.Subscription,
        isWarrantyMode: this.currentMode === TableMode.Warranty,
        isMedicineMode: this.currentMode === TableMode.Medicine,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) return;
      const formData = new FormData();

      // edit-dialog 回傳的 _type 為 'item' | 'subscription' | 'warranty' | 'medicine'
      const { _type, selectedFile, ...payload } = result;

      payload.userId = this.currentUserId;

      const url = this.basicUrl + (this.updateApiMap[_type] ?? 'item/update');
      this.showLoading('更新中...');
      const jsonBlob = new Blob([JSON.stringify(payload)], {
        type: 'application/json',
      });
      formData.append('req', jsonBlob);
      if (selectedFile) {
        formData.append('avatar', selectedFile);
      }
      this.http.postApi(url, formData).subscribe({
        next: (res: any) => {
          Swal.close();
          if (res.code !== 200) {
            Swal.fire({
              title: '更新錯誤',
              text: res.message || 'server error',
              icon: 'error',
            });
            return;
          }
          Swal.fire({ title: '更新成功', icon: 'success' });
          this.refreshCurrentMode();
        },
        error: (err: any) => {
          Swal.fire({
            title: '更新錯誤',
            text: err.message || 'server error',
            icon: 'error',
          });
        },
      });
    });
  }

  // ─── API：取得群組列表 ────────────────────────────────────
  getUserGroupData(groupId: any) {
    this.http
      .getApi(
        `${this.basicUrl}family_life/get_group_list?user_id=${this.currentUserId}`,
      )
      .subscribe({
        next: (res: any) => {
          if (!res.groupList) {
            Swal.fire({
              title: '拉取群組錯誤',
              text: res.message || 'server error',
              icon: 'error',
            });
            return;
          }

          // 使用 Profile 相同的群組資料格式
          // groupList 內應該有 groupId、groupName、avatar
          this.userGroups = res.groupList.map((group: any) => ({
            groupId: Number(group.groupId),
            groupName: group.groupName,
            avatar: group.avatar || 'assets/default-avatar.png',
          }));

          // 私人物品固定放第一個，頭像用登入者自己的頭像
          this.userGroups.unshift({
            groupId: 0,
            groupName: '私人物品',
            avatar: this.currentUserAvatar || 'assets/default-avatar.png',
          });

          this.getItemByGroupId(groupId);
        },

        error: (err) => {
          Swal.fire({
            title: '拉取群組錯誤',
            text: err.message || 'server error',
            icon: 'error',
          });
        },
      });
  }

  // 取得目前選中的群組資料
  getCurrentGroup() {
    return this.userGroups.find(
      (group) => Number(group.groupId) === Number(this.currentGroupId),
    );
  }
  // ─── API：統一查詢（訂閱 / 保固 / 藥品）────────────────────
  // 取代原本三個獨立的 getXxxByGroupId 方法
  private fetchGroupData(mode: TableMode, groupId: number | null): void {
    const endpoint = this.fetchEndpointMap[mode];
    if (!endpoint) return;

    this.currentMode = mode;

    this.http
      .getApi(
        `${this.basicUrl}${endpoint}?groupId=${groupId}&userId=${this.currentUserId}`,
      )
      .subscribe({
        next: (res: any) => {
          if (res.code !== 200) {
            Swal.fire({
              title: '查詢失敗',
              text: res.message || '查詢資料失敗',
              icon: 'error',
            });
            return;
          }
          (this.cachedData as Record<string, any[]>)[mode] = res.data || [];
          this.refreshTableData(
            (this.cachedData as Record<string, any[]>)[mode],
          );
          this.dataSource.paginator?.firstPage();
        },
        error: (err: any) => {
          Swal.fire({
            title: '錯誤',
            text: err.message || 'Server error',
            icon: 'error',
          });
        },
      });
  }

  // ─── API：查詢一般物品（邏輯特殊，單獨保留）──────────────────
  getItemByGroupId(groupId: number): void {
    this.currentGroupId = groupId;
    // 切換群組時先清空快取，避免讀到舊群組資料
    this.cachedData = {
      item: [],
      subscription: [],
      warranty: [],
      medicine: [],
    };

    // 如果目前在特殊模式（非 Item / GlobalSearch），切換群組維持相同模式
    if (
      this.currentMode !== TableMode.Item &&
      this.currentMode !== TableMode.GlobalSearch
    ) {
      this.fetchGroupData(this.currentMode, groupId);
      return;
    }

    this.http
      .getApi(
        `${this.basicUrl}item/getItems?userId=${this.currentUserId}&groupId=${groupId}`,
      )
      .subscribe({
        next: (res: any) => {
          this.cachedData.item = res.items || [];
          this.currentMode = TableMode.Item;
          this.refreshTableData(this.cachedData.item);

          console.log('item:', res.items);

          // 背景載入其他三種資料，供全域搜尋的 allData 使用
          this.loadAllListSilently(groupId);

          this.location = Object.entries(res.locationMap || {}).map(
            ([id, name]) => ({
              id: Number(id),
              name: name as string,
            }),
          );
          this.categories = [
            { id: 0, name: '全部' },
            ...Object.entries(res.categoriesMap || {}).map(([id, name]) => ({
              id: Number(id),
              name: name as string,
            })),
          ];
          this.selectedCategory = '全部';
          this.dataSource.paginator?.firstPage();
        },
        error: (err: any) => {
          Swal.fire({
            title: '錯誤',
            text: err.message || 'Server error',
            icon: 'error',
          });
        },
      });

    this.router.navigate(['/itemList', groupId]);
  }

  // 背景靜默載入訂閱 / 保固 / 藥品資料（供全域搜尋使用）
  private loadAllListSilently(groupId: number): void {
    const modes = [
      TableMode.Subscription,
      TableMode.Warranty,
      TableMode.Medicine,
    ] as const;
    modes.forEach((mode) => {
      const endpoint = this.fetchEndpointMap[mode]!;
      this.http
        .getApi(
          `${this.basicUrl}${endpoint}?groupId=${groupId}&userId=${this.currentUserId}`,
        )
        .subscribe({
          next: (res: any) => {
            (this.cachedData as Record<string, any[]>)[mode] = res.data || [];
            console.log('data', res);
          },
        });
    });
  }

  // 根據目前模式刷新（新增 / 編輯 / 刪除後呼叫）
  private refreshCurrentMode(): void {
    if (
      this.currentMode === TableMode.Item ||
      this.currentMode === TableMode.GlobalSearch
    ) {
      this.getItemByGroupId(this.currentGroupId);
    } else {
      this.fetchGroupData(this.currentMode, this.currentGroupId);
    }
  }

  // ─── 分類篩選 ─────────────────────────────────────────────
  filterByCategory(catId: number) {
    const category = this.categories.find((cat) => cat.id === catId);
    this.selectedCategory = category?.name || '全部';
    this.selection.clear();

    const specialMode = this.categoryModeMap[this.selectedCategory];
    if (specialMode) {
      this.fetchGroupData(specialMode, this.currentGroupId);
      return;
    }

    // 一般物品模式：直接從快取篩選，不重新打 API
    this.currentMode = TableMode.Item;
    const filtered =
      catId === 0
        ? this.cachedData.item
        : this.cachedData.item.filter((item: any) => item.categoryId === catId);
    this.refreshTableData(filtered);
    this.dataSource.paginator?.firstPage();
  }

  onCategoryChange(event: MatChipListboxChange) {
    if (event.value == null) {
      this.selectedCategory = '全部';
      this.filterByCategory(0);
      return;
    }
    this.filterByCategory(event.value);
  }

  // ─── 搜尋 ─────────────────────────────────────────────────
  applyFilter(event: Event) {
    const keyword = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();

    if (!keyword) {
      this.currentMode = TableMode.Item;
      this.refreshTableData(this.cachedData.item);
      this.dataSource.paginator?.firstPage();
      return;
    }

    this.currentMode = TableMode.GlobalSearch;
    this.refreshTableData(
      this.allData.filter((item) =>
        (item.name || '').toLowerCase().includes(keyword),
      ),
    );
    this.dataSource.paginator?.firstPage();
  }

  // ─── 刪除 ─────────────────────────────────────────────────
  deleteSelectedItems() {
    const selected = this.selection.selected;
    const selectedIds = selected.map((item) => item.id);

    Swal.fire({
      title: '確定要刪除嗎？',
      text: `您選中了 ${selectedIds.length} 筆資料，刪除後將無法還原！`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: '是的，刪除它們！',
      cancelButtonText: '取消',
    }).then((result) => {
      if (!result.isConfirmed) return;

      // 全域搜尋模式：資料混合多種類型，需分組處理
      if (this.currentMode === TableMode.GlobalSearch) {
        this.deleteGlobalSearchSelected(selected);
        return;
      }

      // 一般物品：批次 POST 刪除
      if (this.currentMode === TableMode.Item) {
        this.showLoading('刪除中...');
        this.http
          .postApi(
            `${this.basicUrl}item/delete?userId=${this.currentUserId}`,
            selectedIds,
          )
          .subscribe({
            next: (res: any) => {
              if (res.code !== 200) {
                Swal.fire({
                  title: '刪除錯誤',
                  text: res.message || 'Server error',
                  icon: 'error',
                });
                return;
              }
              Swal.fire({ title: '刪除成功', icon: 'success' });
              this.selection.clear();
              this.getItemByGroupId(this.currentGroupId);
            },
            error: (err: any) => {
              Swal.fire({
                title: '刪除錯誤',
                text: err.message || 'Server error',
                icon: 'error',
              });
            },
          });
        return;
      }

      // 訂閱 / 保固 / 藥品：逐一 DELETE
      const endpoint = this.deleteEndpointMap[this.currentMode];
      if (!endpoint) return;

      this.showLoading('刪除中...');
      let completedCount = 0;

      selectedIds.forEach((id) => {
        this.http
          .deleteApi(
            `${this.basicUrl}${endpoint}?id=${id}&userId=${this.currentUserId}`,
          )
          .subscribe({
            next: (res: any) => {
              if (res.code !== 200) {
                Swal.fire({
                  title: '刪除失敗',
                  text: res.message || 'Server error',
                  icon: 'error',
                });
                return;
              }
              completedCount++;
              if (completedCount === selectedIds.length) {
                Swal.fire({ title: '刪除成功', icon: 'success' });
                this.selection.clear();
                this.fetchGroupData(this.currentMode, this.currentGroupId);
              }
            },
            error: (err: any) => {
              Swal.fire({
                title: '刪除錯誤',
                text: err.message || 'Server error',
                icon: 'error',
              });
            },
          });
      });
    });
  }

  // 全域搜尋模式的刪除：依 _type 分組，分別呼叫對應 API
  private deleteGlobalSearchSelected(selected: any[]): void {
    // 依 _type 分桶
    const groups = selected.reduce(
      (acc: Record<string, number[]>, row: any) => {
        const type = row._type || 'item';
        if (!acc[type]) acc[type] = [];
        acc[type].push(row.id);
        return acc;
      },
      {},
    );

    this.showLoading('刪除中...');

    const requests: Observable<any>[] = [];

    // 一般物品：批次 POST
    if (groups['item']?.length) {
      requests.push(
        this.http
          .postApi(
            `${this.basicUrl}item/delete?userId=${this.currentUserId}`,
            groups['item'],
          )
          .pipe(catchError((err) => of({ code: 500, message: err.message }))),
      );
    }

    // 訂閱 / 保固 / 藥品：逐一 DELETE，全部打包成 Observable 陣列
    (['subscription', 'warranty', 'medicine'] as const).forEach((type) => {
      const endpoint = this.deleteEndpointMap[type];
      if (!endpoint || !groups[type]?.length) return;
      groups[type].forEach((id: number) => {
        requests.push(
          this.http
            .deleteApi(
              `${this.basicUrl}${endpoint}?id=${id}&userId=${this.currentUserId}`,
            )
            .pipe(catchError((err) => of({ code: 500, message: err.message }))),
        );
      });
    });

    if (!requests.length) return;

    forkJoin(requests).subscribe({
      next: (results: any[]) => {
        const failed = results.filter((r) => r?.code !== 200);
        Swal.close();
        if (failed.length > 0) {
          Swal.fire({
            title: `${results.length - failed.length} 筆刪除成功，${failed.length} 筆失敗`,
            text: failed[0]?.message || 'Server error',
            icon: 'warning',
          });
        } else {
          Swal.fire({ title: '刪除成功', icon: 'success' });
        }
        this.selection.clear();
        this.getItemByGroupId(this.currentGroupId);
      },
      error: (err: any) => {
        Swal.fire({
          title: '刪除錯誤',
          text: err.message || 'Server error',
          icon: 'error',
        });
      },
    });
  }

  // ─── Checkbox 相關 ────────────────────────────────────────
  isAllSelected() {
    return this.selection.selected.length === this.dataSource.data.length;
  }

  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  onRowCheckboxClick(event: MouseEvent, row: any) {
    event.stopPropagation();
    const rows = this.dataSource.filteredData;

    if (event.shiftKey && this.lastSelectedRow) {
      const startIndex = rows.findIndex(
        (r) => r.id === this.lastSelectedRow.id,
      );
      const endIndex = rows.findIndex((r) => r.id === row.id);
      const [start, end] =
        startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
      for (let i = start; i <= end; i++) {
        this.selection.select(rows[i]);
      }
    } else {
      this.selection.toggle(row);
    }

    this.lastSelectedRow = row;
  }

  // ─── 工具方法 ─────────────────────────────────────────────
  isExpired(expiredDate: string): boolean {
    if (!expiredDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(expiredDate).getTime() < today.getTime();
  }

  getItemRemainDays(expireDate: string): number | null {
    if (!expireDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(expireDate);
    target.setHours(0, 0, 0, 0);
    return Math.ceil(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  getItemRemainText(expireDate: string): string {
    const days = this.getItemRemainDays(expireDate);
    if (days === null) return '未設定到期日';
    if (days < 0) return `已過期 ${Math.abs(days)} 天`;
    if (days === 0) return '今天到期';
    return `剩餘 ${days} 天`;
  }

  //抓取上次登入該page時間
  getLoginItemPageTime(): Promise<void> {
    return new Promise((resolve) => {
      this.http
        .getApi(
          `${this.basicUrl}item/getLoginItemPageTime?userId=${this.currentUserId}`,
        )
        .subscribe({
          next: (res: any) => {
            this.lastLoginTime = new Date(res);
            resolve();
          },
          error: () => resolve(),
        });
    });
  }

  //判斷是否非私人新物品
  isNewItem(createdTime: string | Date, createdBy: number): boolean {
    if (createdBy == this.currentUserId) return false;
    if (!createdTime || !this.lastLoginTime) return false;

    const created = new Date(createdTime).getTime();
    const login = this.lastLoginTime.getTime();

    if (isNaN(created)) return false;

    return created > login;
  }

  private showLoading(message = '處理中...'): void {
    Swal.fire({
      title: message,
      text: '請稍候',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });
  }
}
