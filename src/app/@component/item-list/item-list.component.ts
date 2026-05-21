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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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

  basicUrl!: string;

  // 存放地點清單
  location: LocationAndCategory[] = [];

  // 分類清單
  categories: LocationAndCategory[] = [];

  // 一般物品資料
  itemList: Item[] = [];

  // 訂閱資料
  subscriptionList: any[] = [];

  // checkbox 多選
  selection = new SelectionModel<any>(true, []);

  // 使用者群組，之後可以改成從後端取得
  userGroups: any[] = [
    { id: 1, name: '陳家大宅' },
    { id: 2, name: '林老師' },
  ];

  // 目前選到的群組
  currentGroupId: number = 0;

  // 目前選到的分類名稱
  selectedCategory = '全部';

  // 是否為訂閱模式
  isSubscriptionMode = false;

  // 一般物品表格欄位
  // status 是後端算好的狀態：正常、已到期、即將到期、庫存不足
  itemDisplayedColumns: string[] = [
    'select',
    'name',
    'quantity',
    'unitPrice',
    'price',
    'expireDate',
    'status',
    'notify',
  ];

  // 訂閱表格欄位
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

  // 保固資料
warrantyList: any[] = [];
isWarrantyMode = false;

warrantyDisplayedColumns: string[] = [
  'select',
  'productName',
  'brand',
  'model',
  'serialNumber',
  'purchaseDate',
  'warrantyEndDate',
  'status',
  'notify',
];

  // 目前實際顯示的表格欄位
  displayedColumns: string[] = this.itemDisplayedColumns;

  // Material Table 資料來源
  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private http: HttpClientService) {
    this.basicUrl = this.http.basicUrl;

    // 預設載入第一個群組資料
    this.getItemByGroupId(this.userGroups[0].id);
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  // 開啟新增 Dialog
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
        isWarrantyMode: this.isWarrantyMode,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // 訂閱模式新增後，重新查訂閱
        if (this.isSubscriptionMode) {
          this.getSubscriptionByGroupId(this.currentGroupId);
          // 保固模式新增後，重新查保固
        } else if (this.isWarrantyMode) {
          this.getWarrantyByGroupId(this.currentGroupId);
        } else {
          // 一般物品新增後，重新查物品
          this.getItemByGroupId(this.currentGroupId);
        }
      }
    });
  }

  // 開啟修改 Dialog
  openEditDialog(row: any) {
    const dialogRef = this.dialog.open(ItemListEditDialogComponent, {
      width: '540px',
      height: '540px',
      data: {
        item: row,
        locationMap: this.location,
        categoriesMap: this.categories,
        isSubscriptionMode: this.isSubscriptionMode,
        isWarrantyMode: this.isWarrantyMode,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (this.isSubscriptionMode) {
          this.updateSubscription(result);
        } else if (this.isWarrantyMode) {
          this.updateWarranty(result);
        } else {
          this.updateItem(result);
        }
      }
    });
  }

  // 修改訂閱
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


  //修改保固
  updateWarranty(data: any) {
  this.http.postApi(this.basicUrl + 'warranty/update', data).subscribe({
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

      this.getWarrantyByGroupId(this.currentGroupId);
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

  // 點擊分類
  filterByCategory(catId: number) {
    const category = this.categories.find((cat) => cat.id === catId);
    this.selectedCategory = category?.name || '全部';

    this.selection.clear();

     if (this.selectedCategory === '訂閱') {
    this.isSubscriptionMode = true;
    this.isWarrantyMode = false;
    this.getSubscriptionByGroupId(this.currentGroupId);
    return;
  }

  // 保固
  if (this.selectedCategory === '保固') {
    this.isSubscriptionMode = false;
    this.isWarrantyMode = true;
    this.getWarrantyByGroupId(this.currentGroupId);
    return;
    }

    // 其他分類維持一般物品表格
    this.isSubscriptionMode = false;
    this.isWarrantyMode = false;
    this.displayedColumns = this.itemDisplayedColumns;

    if (catId === 0) {
      this.dataSource.data = this.itemList;
    } else {
      this.dataSource.data = this.itemList.filter(
        (item: any) => item.categoryId === catId
      );
    }

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // 查詢訂閱資料
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

          if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
          }
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

  // 查詢保固資料
  getWarrantyByGroupId(groupId: number): void {
  if (!groupId || groupId <= 0) {
    Swal.fire({
      title: '錯誤',
      text: '群組 ID 不可為空',
      icon: 'error',
    });
    return;
  }

  this.isWarrantyMode = true;
  this.isSubscriptionMode = false;
  this.displayedColumns = this.warrantyDisplayedColumns;

  this.http
    .getApi(this.basicUrl + `warranty/getByGroup?groupId=${groupId}`)
    .subscribe({
      next: (res: any) => {
        if (res.code !== 200) {
          Swal.fire({
            title: '查詢失敗',
            text: res.message || '保固資料查詢失敗',
            icon: 'error',
          });
          return;
        }

        this.warrantyList = res.data || [];
        this.dataSource.data = this.warrantyList;
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

  // 查詢一般物品資料
  getItemByGroupId(groupId: number) {
    this.currentGroupId = groupId;

    // 切換群組時，如果目前在訂閱模式，就查訂閱
    if (this.isSubscriptionMode) {
      this.getSubscriptionByGroupId(groupId);
      return;
    }

    // 切換群組時，如果目前在保固模式，就查保固
    if (this.isWarrantyMode) {
    this.getWarrantyByGroupId(groupId);
    return;
  }

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
          this.itemList = res.items || [];
          this.dataSource.data = this.itemList;

          // 後端 locationMap 轉成陣列
          this.location = Object.entries(res.locationMap || {}).map(
            ([id, name]) => ({
              id: Number(id),
              name: name as string,
            })
          );

          // 後端 categoriesMap 轉成陣列
          this.categories = Object.entries(res.categoriesMap || {}).map(
            ([id, name]) => ({
              id: Number(id),
              name: name as string,
            })
          );

          // 最前面補「全部」
          this.categories.unshift({ id: 0, name: '全部' });

          this.displayedColumns = this.itemDisplayedColumns;
          this.selectedCategory = '全部';

          if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
          }
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

  // 搜尋功能
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // 修改一般物品
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
            text: res.message || 'server error',
            icon: 'error',
          });
          return;
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
          text: err.message || 'server error',
          icon: 'error',
        });
      },
    });
  }

  // 判斷日期是否已過期，用來把到期日標紅
  isExpired(expiredDate: string): boolean {
    if (!expiredDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(expiredDate);
    return targetDate.getTime() < today.getTime();
  }

  // 判斷 checkbox 是否全選
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  // 全選 / 取消全選
  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  // 刪除資料
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

      // 訂閱模式刪除
      if (this.isSubscriptionMode) {
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

                // 最後一筆完成後重新查詢
                if (id === selectedIds[selectedIds.length - 1]) {
                  Swal.fire({
                    title: '刪除成功',
                    icon: 'success',
                  });

                  this.selection.clear();
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

      // 保固模式刪除
      if (this.isWarrantyMode) {
        selectedIds.forEach((id) => {
          this.http
            .deleteApi(this.basicUrl + `warranty/delete?id=${id}`)
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

                if (id === selectedIds[selectedIds.length - 1]) {
                  Swal.fire({
                    title: '刪除成功',
                    icon: 'success',
                  });

                  this.selection.clear();
                  this.getWarrantyByGroupId(this.currentGroupId);
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

      // 一般物品刪除
      this.http.postApi(this.basicUrl + 'item/delete', selectedIds).subscribe({
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
  }

  // 計算一般物品距離到期剩餘幾天
getItemRemainDays(expireDate: string): number | null {
  if (!expireDate) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(expireDate);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// 狀態下方顯示文字
getItemRemainText(expireDate: string): string {
  const days = this.getItemRemainDays(expireDate);

  if (days === null) {
    return '未設定到期日';
  }

  if (days < 0) {
    return `已過期 ${Math.abs(days)} 天`;
  }

  if (days === 0) {
    return '今天到期';
  }

  return `剩餘 ${days} 天`;
}
}
