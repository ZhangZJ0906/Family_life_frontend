import { Item, LocationAndCategory } from './../../common/interfaceList';
import { MatIconModule } from '@angular/material/icon';
import { MatChipListbox, MatChipOption } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { SelectionModel } from '@angular/cdk/collections';
import { Component, inject, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { HttpClientService } from '../../@services/http-client.service';
import Swal from 'sweetalert2';
import { MatFormFieldModule } from '@angular/material/form-field'; // 必須匯入
import { MatInputModule } from '@angular/material/input'; // 必須匯入
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ItemListAddDialogComponent } from '../item-list-add-dialog/item-list-add-dialog.component';
import { ItemListEditDialogComponent } from '../item-list-edit-dialog/item-list-edit-dialog.component';
import { MatSelect, MatOption } from '@angular/material/select';
import { TopbarComponent } from '../../shared/topbar/topbar.component';
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
    MatSelect,
    MatOption,
    TopbarComponent,
  ],
  templateUrl: './item-list.component.html',
  styleUrl: './item-list.component.scss',
})
export class ItemListComponent {
  readonly dialog = inject(MatDialog);
  location: LocationAndCategory[] = [];
  selection = new SelectionModel<any>(true, []);
  /*群組陣列 */
  userGroups: any[] = [
    {
      id: 1,
      name: '陳家大宅',
    },
    {
      id: 2,
      name: '林老師',
    },
  ];
  // 現在的群組
  currentGroupId: number = 0;
  itemDisplayedColumns: string[] = [
    'select',
    'name',
    'quantity',
    'unitPrice',
    'price', // 單價
    'expireDate',
    'notify',
  ];
  selectedCategory = '全部';
  categories: LocationAndCategory[] = [];
  itemList: Item[] = [];
  // 初始化 dataSource
  dataSource = new MatTableDataSource<Item>([]);

  // 訂閱表格欄位：只列重要欄位
subscriptionDisplayedColumns: string[] = [
  'select',
  'name',
  'price',
  'billingCycle',
  'trialEndDate',
  'nextBillingDate',
  'status',
  'notify',
];

// 目前實際顯示的欄位
displayedColumns: string[] = this.itemDisplayedColumns;

// 判斷目前是不是訂閱模式
isSubscriptionMode = false;

// 訂閱資料
subscriptionList: any[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }
  basicUrl!: string;
  constructor(private http: HttpClientService) {
    this.basicUrl = this.http.basicUrl;

    this.getItemByGroupId(this.userGroups[0].id);
  }
  /*TODO 缺少 拿user 資料跟拿user 群組資料 分類資料 通知功能 */
  /*新增物品 */
  openAddDialog() {
     const dialogRef = this.dialog.open(ItemListAddDialogComponent, {
    width: '540px',
    height: '540px',
    data: {
      title: '新增物品',
      location: this.location,
      categories: this.categories,
      currentGroupId: this.currentGroupId,
      isSubscriptionMode: this.isSubscriptionMode,
    },
  });

  dialogRef.afterClosed().subscribe((result) => {
    if (result) {
      if (this.isSubscriptionMode) {
        this.getSubscriptionByGroupId(this.currentGroupId);
      } else {
        this.getItemByGroupId(this.currentGroupId);
      }
    }
  });
  }
  /*修改物品 dialog */
  openEditDialog(row: Item) {
    // console.log(row)
    const dialogRef = this.dialog.open(
  ItemListEditDialogComponent,
  {
    width: '540px',
    height: '540px',
    data: {
      item: row,
      locationMap: this.location,
      categoriesMap: this.categories,
      isSubscriptionMode: this.isSubscriptionMode,
    },
  }
);

  dialogRef.afterClosed().subscribe((result) => {
    if (result) {
      if (this.isSubscriptionMode) {
        this.updateSubscription(result);
      } else {
        this.updateItem(result);
      }
    }
  });
  }

updateSubscription(data: any) {
  this.http.postApi(this.basicUrl + 'subscription/update', data).subscribe({
    next: (res: any) => {
      if (res.code != 200) {
        Swal.fire({
          title: '更新錯誤',
          text: res.message || 'server error',
          icon: 'error',
        });
        return;
      }

      Swal.fire({
        title: '更新成功',
        icon: 'success',
      });

      this.getSubscriptionByGroupId(this.currentGroupId);
    },
    error: (err: any) => {
      Swal.fire({
        title: '更新錯誤',
        text: err.message || 'server error',
        icon: 'error',
      });
    },
  });
}


  /*分類 */
  filterByCategory(catId: number) {
    // 找到目前點擊的分類
  const category = this.categories.find(cat => cat.id === catId);
  this.selectedCategory = category?.name || '全部';

  // 如果點擊「訂閱」，改查訂閱後端
  if (this.selectedCategory === '訂閱') {
    this.getSubscriptionByGroupId(this.currentGroupId);
    return;
  }

  // 其他分類維持原本物品清單
  this.isSubscriptionMode = false;
  this.displayedColumns = this.itemDisplayedColumns;

  if (catId === 0) {
    this.dataSource.data = this.itemList;
  } else {
    this.dataSource.data = this.itemList.filter(
      item => item.categoryId === catId
    );
  }
  }

  // 查詢某群組的訂閱資料
getSubscriptionByGroupId(groupId: number): void {
  if (!groupId || groupId <= 0) {
    Swal.fire({
      title: '錯誤',
      text: '群組 ID 不可為空',
      icon: 'error',
    });
    return;
  }

  this.isSubscriptionMode = true;
  this.displayedColumns = this.subscriptionDisplayedColumns;

  this.http
    .getApi(this.basicUrl + `subscription/getByGroup?groupId=${groupId}`)
    .subscribe({
      next: (res: any) => {
        if (res.code !== 200) {
          Swal.fire({
            title: '查詢失敗',
            text: res.message || '訂閱資料查詢失敗',
            icon: 'error',
          });
          return;
        }

        this.subscriptionList = res.data || [];
        this.dataSource.data = this.subscriptionList;
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
  /*取得DB 物品清單資料 */
  getItemByGroupId(groupId: number) {
    this.currentGroupId = groupId;
    if (this.currentGroupId <= 0) {
      Swal.fire({
        title: 'fail',
        text: '群組ID參數錯誤',
        icon: 'error',
      });
      return;
    }
    this.http
      .getApi(this.basicUrl + `item/getItems?groupId=${this.currentGroupId}`)
      .subscribe({
        next: (res: any) => {
          this.itemList = res.items;
          this.dataSource.data = res.items;

          this.location = Object.entries(res.locationMap).map(([id, name]) => ({
            id: Number(id),
            name: name as string,
          }));
          this.categories = Object.entries(res.categoriesMap).map(
            ([id, name]) => ({
              id: Number(id),
              name: name as string,
            }),
          );

          this.categories.unshift({ id: 0, name: '全部' });
          // console.log(this.dataSource.data);
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

  // 實作搜尋功能
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  /*更新 */
  updateItem(data: any) {
    if (!data) {
      Swal.fire({
        title: '沒有更新資料',
        text: '資料沒傳進來',
        icon: 'error',
      });
      return;
    }
    this.http.postApi(this.basicUrl + 'item/update', data).subscribe({
      next: (res: any) => {
        if (res.code != 200) {
          Swal.fire({
            title: '更新錯誤',
            text: res.message || 'server error ',
            icon: 'error',
          });
        }
        Swal.fire({
          title: '更新成功',
          icon: 'success',
        });
        this.getItemByGroupId(this.currentGroupId);
      },
      error: (err: any) => {
        Swal.fire({
          title: '更新錯誤',
          text: err.message || 'server error ',
          icon: 'error',
        });
      },
    });
  }
  //判斷有效日期是否小於今天
  isExpired(expiredDate: string): boolean {
    if (!expiredDate) return false;

    // 將「今天」設定為今天凌晨 00:00:00，避免因為小時/分鐘導致當天算過期
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 將傳入的日期字串轉為 Date 物件
    const targetDate = new Date(expiredDate);
    // 如果目標日期小於今天，就是過期了
    return targetDate.getTime() < today.getTime();
  }
  // 刪除資料
  // 檢查是否全選
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  // 全選或取消全選
  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  // 刪除按鈕邏輯
  deleteSelectedItems() {
  const selectedIds = this.selection.selected.map((item) => item.id);

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

    if (!result.isConfirmed) {
      return;
    }

    // =========================
    // 訂閱模式刪除
    // =========================
    if (this.isSubscriptionMode) {

      // 多筆刪除
      selectedIds.forEach((id) => {

        this.http
          .deleteApi(this.basicUrl + `subscription/delete?id=${id}`)
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

              // 最後一筆刪除成功後刷新
              if (id === selectedIds[selectedIds.length - 1]) {

                Swal.fire({
                  title: '刪除成功',
                  icon: 'success',
                });

                this.selection.clear();

                // 重新查詢訂閱列表
                this.getSubscriptionByGroupId(this.currentGroupId);
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

      return;
    }

    // =========================
    // 一般物品刪除
    // =========================
    this.http
      .postApi(this.basicUrl + 'item/delete', selectedIds)
      .subscribe({

        next: (res: any) => {

          if (res.code != 200) {
            Swal.fire({
              title: '刪除錯誤',
              text: res.message || 'Server error',
              icon: 'error',
            });
            return;
          }

          Swal.fire({
            title: '刪除成功',
            icon: 'success',
          });

          this.selection.clear();

          // 重新查詢物品列表
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

  });
}}
