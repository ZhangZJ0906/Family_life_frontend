import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import {
  ExpenseRecord,
  GroupList,
  LocationAndCategory,
} from '../../common/interfaceList';
import { HttpClientService } from '../../@services/http-client.service';
import Swal from 'sweetalert2';
import { ExpensesAddComponent } from '../expenses-add/expenses-add.component';
import { ExpensesEditComponent } from '../expenses-edit/expenses-edit.component';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxModule } from '@angular/material/checkbox';
@Component({
  selector: 'app-expense-tracker',
  standalone: true,
  imports: [
    MatCheckboxModule,
    MatDialogModule,
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
  ],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.scss',
})
export class ExpensesComponent {
  basicUrl!: string; // APIＵＲＬ
  userGroups: any[] = []; // 儲存使用者擁有的群組清單
  categoryMap: LocationAndCategory[] = []; // 分類
  dataSource = new MatTableDataSource<ExpenseRecord>([]); // table  資料
  selection = new SelectionModel<ExpenseRecord>(true, []); // 刪除  checkbox 勾選到的資料
  expense: ExpenseRecord[] = []; // 記帳資料
  itemMap: { [key: number]: any } = {}; // 群組物品東西'

  // Angular Material Table 要顯示的欄位
  displayedColumns: string[] = [
    'select',
    'expense_date',
    'category_id',
    'note',
    'price',
    'actions',
  ];

  constructor(
    private http: HttpClientService,
    private dialog: MatDialog,
  ) {
    this.basicUrl = this.http.basicUrl;

    // 自訂篩選邏輯：同時處理「分類」+「搜尋」
    this.dataSource.filterPredicate = (data: ExpenseRecord, filter: string) => {
      const f = JSON.parse(filter);

      // 條件 A：分類 (null = 全部)
      const matchCategory =
        f.category == null || data.categoryId === f.category;

      // 條件 B：關鍵字搜尋 (備註 / 分類名 / 金額 / 日期)
      const keyword = f.search;
      const matchSearch =
        !keyword ||
        (data.note ?? '').toLowerCase().includes(keyword) ||
        this.getCategoryName(data.categoryId).toLowerCase().includes(keyword) ||
        (data.price?.toString() ?? '').includes(keyword) ||
        (data.expenseDate ?? '').toLowerCase().includes(keyword);

      return matchCategory && matchSearch; // 兩個條件都要符合
    };
    this.getCatgories(); // 獲取 分類
    this.getExpense(this.currentGroupId, this.currentUserId); // 獲取記帳紀錄
    this.getUserGroupData(); // 拉取user group
  }
  // 塞選或是 文字搜尋用
  filterValues = {
    search: '',
    category: null as number | null,
  };
  // 模擬登入使用者與群組環境
  currentGroupId: number | null = null;
  currentUserId = 2;

  // 計算總支出
  totalExpense = computed(() =>
    this.dataSource.data.reduce((sum, r) => sum + (r.price || 0), 0),
  );
  openCreateDialog() {
    const dialogRef = this.dialog.open(ExpensesAddComponent, {
      width: '540px',
      height: '540px',
      data: {
        categoryMap: this.categoryMap,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      // 如果 result 是 true，代表彈窗內更新成功了，主頁面只需要重新載入列表
      if (result === true) {
        this.getExpense(null, this.currentUserId);
      }
    });
  }

  openEditDialog(record: any) {
    let relatedItem = null;
    if (record.relatedItemId != null) {
      relatedItem = this.itemMap[record.relatedItemId];
    }
    const dialogRef = this.dialog.open(ExpensesEditComponent, {
      width: '540px',
      height: '540px',
      data: {
        record: JSON.parse(JSON.stringify(record)),
        categoryMap: this.categoryMap,
        relatedItem: relatedItem,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      // 如果 result 是 true，代表彈窗內更新成功了，主頁面只需要重新載入列表
      if (result === true) {
        this.getExpense(null, this.currentUserId);
      }
    });
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
  deleteById() {
    const selectedIds = this.selection.selected.map((item) => item.id);

    Swal.fire({
      title: '確定要刪除嗎？',
      text: `您選中了 ${selectedIds.length} 筆物品，刪除後將無法還原！`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: '是的，刪除它們！',
      cancelButtonText: '取消',
    }).then((result) => {
      if (result.isConfirmed) {
        this.http
          .postApi(this.basicUrl + 'expense/deleteInfo', selectedIds)
          .subscribe({
            next: (res: any) => {
              if (res.code != 200) {
                Swal.fire({
                  title: '刪除錯誤',
                  text: res.message || 'server error ',
                  icon: 'error',
                });
              }
              Swal.fire({
                title: '刪除成功',
                icon: 'success',
              });
              window.location.reload();
            },
            error: (err: any) => {
              Swal.fire({
                title: '刪除錯誤',
                text: err.message || 'server error ',
                icon: 'error',
              });
            },
          });
      }
    });
  }
  //拉取 分類
  getCatgories() {
    this.http.getApi(this.basicUrl + 'categories/get').subscribe({
      next: (res: any) => {
        if (res.code != 200) {
          Swal.fire({
            title: '拉取分類錯誤',
            text: res.message || 'server error ',
            icon: 'error',
          });
        }

        this.categoryMap = Object.keys(res.categoiesMap).map((key) => ({
          id: Number(key),
          name: res.categoiesMap[key],
        }));
      },
      error: (err) => {
        Swal.fire({
          title: '拉取分類錯誤',
          text: err.message || 'server error ',
          icon: 'error',
        });
      },
    });
  }

  //拉取群組
  getUserGroupData() {
    this.http
      .getApi(
        this.basicUrl +
          `family_life/get_group_list?user_id=${this.currentUserId}`,
      )
      .subscribe({
        next: (res: any) => {
          if (res.code != 200) {
            Swal.fire({
              title: '拉取群組錯誤',
              text: res.message || 'server error ',
              icon: 'error',
            });
          }
          this.userGroups = res.groupList.map(
            ({ groupId, groupName }: any) => ({
              groupId,
              groupName,
            }),
          );
        },
        error: (err) => {
          Swal.fire({
            title: '拉取群組錯誤',
            text: err.message || 'server error ',
            icon: 'error',
          });
        },
      });
  }

  onGroupChange(groupId: number | null) {
    this.currentGroupId = groupId;
    this.selection.clear(); // 清掉勾選
    this.getExpense(groupId, this.currentUserId);
  }
  //拉取記帳紀錄
  getExpense(groupId: number | null, userId: number) {
    if (!userId || userId <= 0) {
      Swal.fire({
        title: '錯誤',
        text: '不合法的使用者 ID',
        icon: 'error',
      });
      return;
    }

    // 動態組合 URL 參數，避免寫兩段一模一樣的 subscribe 邏輯
    let url = `${this.basicUrl}expense/getInfo?userId=${userId}`;
    if (groupId != null) {
      url += `&groupId=${groupId}`;
    }

    this.http.getApi(url).subscribe({
      next: (res: any) => {
        if (res.code !== 200) {
          Swal.fire({
            title: '拉取資料錯誤',
            text: res.message || 'Server error',
            icon: 'error',
          });
          return;
        }

        // 2. 完美接收後端一次打包回傳的資料
        this.expense = res.list ? [...res.list] : [];
        this.itemMap = res.itemMap || {}; // 後端回傳的物品對照表 Map<Long, Items>

        // 更新表格或畫面資料來源
        this.dataSource.data = this.expense;
      },
      error: (err) => {
        Swal.fire({
          title: '錯誤',
          text: err.message || 'Server error',
          icon: 'error',
        });
      },
    });
  }

  getCategoryName(categoryId: number): string {
    return this.categoryMap.find((c) => c.id === categoryId)?.name || '未分類';
  }

  filterByCategory(categoryId: number | null) {
    this.filterValues.category = categoryId;
    this.dataSource.filter = JSON.stringify(this.filterValues);
  }
  //文字搜尋
  applyFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.filterValues.search = value.trim().toLowerCase();
    this.dataSource.filter = JSON.stringify(this.filterValues);
  }
}
