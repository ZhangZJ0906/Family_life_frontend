import { Component, computed, signal } from '@angular/core';
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
import { SelectionModel } from '@angular/cdk/collections';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  DropDownGroupList,
  ExpenseRecord,
  GroupUser,
  LocationAndCategory,
} from '../../common/interfaceList';
import { HttpClientService } from '../../@services/http-client.service';
import { ExpensesAddComponent } from '../expenses-add/expenses-add.component';
import { ExpensesEditComponent } from '../expenses-edit/expenses-edit.component';
import Swal from 'sweetalert2';
import { TopbarComponent } from '../../shared/topbar/topbar.component';

@Component({
  selector: 'app-expense-tracker',
  standalone: true,
  imports: [
    OverlayModule,
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
    TopbarComponent,
  ],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.scss',
})
export class ExpensesComponent {
  user: any;
  basicUrl!: string;
  groupUserInfo: { [key: number]: GroupUser } = {};
  userGroups: DropDownGroupList[] = [];
  categoryMap: LocationAndCategory[] = [];
  dataSource = new MatTableDataSource<ExpenseRecord>([]);
  selection = new SelectionModel<ExpenseRecord>(true, []);
  expense: ExpenseRecord[] = [];
  itemMap: { [key: number]: any } = {};
  currentGroupId!: number;
  currentUserId!: number;
  // 資訊小卡
  activeExpenseId: number | null = null;

  // 月份切換
  selectedYear = signal(new Date().getFullYear());
  selectedMonth = signal(new Date().getMonth() + 1);

displayedColumns: string[] = [
  'select',
  'expense_date',
  'related_item_name',
  'category_id',
  'note',
  'price',
  'actions',
];
  filteredExpense = signal<ExpenseRecord[]>([]);
  filterValues = {
    search: '',
    category: null as number | null,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  };

  // 本月支出（直接計算過濾後的資料，保證看得到什麼就加總什麼）
  totalExpense = computed(() => {
    const data = this.filteredExpense();
    const total = data.reduce((sum, r) => {
      return sum + (r.price || 0);
    }, 0);
    return total;
  });

  constructor(
  private http: HttpClientService,
  private dialog: MatDialog,
) {
  this.basicUrl = this.http.basicUrl;

  // 取得目前登入者資料
  const raw = sessionStorage.getItem('family-life-current-user');

  if (raw) {
    this.user = JSON.parse(raw);
    this.currentUserId = this.user.user_id;
  }

  // 設定表格篩選邏輯
  this.dataSource.filterPredicate = (data: ExpenseRecord, filter: string) => {
    const f = JSON.parse(filter);

    // 分類篩選
    const matchCategory =
      f.category == null || data.categoryId === f.category;

    // 關鍵字搜尋
    const keyword = f.search;
    const matchSearch =
      !keyword ||
      (data.note ?? '').toLowerCase().includes(keyword) ||
      (data.relatedItemName ?? '').toLowerCase().includes(keyword) ||
      this.getCategoryName(data.categoryId).toLowerCase().includes(keyword) ||
      (data.price?.toString() ?? '').includes(keyword) ||
      (data.expenseDate ?? '').toLowerCase().includes(keyword);

    // 月份篩選
    const matchMonth = (() => {
      if (!data.expenseDate) {
        return false;
      }

      const [y, m] = data.expenseDate.split('-').map(Number);

      return y === f.year && m === f.month;
    })();

    return matchCategory && matchSearch && matchMonth;
  };

  // 先載入分類
  this.getCatgories();

  // 再載入群組，載入完成後會自動查私人記帳資料
  this.getUserGroupData();
}
  overlayPositions: ConnectedPosition[] = [
    {
      originX: 'center',
      originY: 'top',
      overlayX: 'center',
      overlayY: 'bottom',
      offsetY: -8,
    },
  ];
  // ─── 月份切換 ───────────────────────────────────────
  prevMonth() {
    let y = this.selectedYear();
    let m = this.selectedMonth();
    m === 1 ? (y--, (m = 12)) : m--;
    this.selectedYear.set(y);
    this.selectedMonth.set(m);
    this.applyMonthFilter(y, m);
  }

  nextMonth() {
    if (this.isCurrentMonth()) return;
    let y = this.selectedYear();
    let m = this.selectedMonth();
    m === 12 ? (y++, (m = 1)) : m++;
    this.selectedYear.set(y);
    this.selectedMonth.set(m);
    this.applyMonthFilter(y, m);
  }

  isCurrentMonth(): boolean {
    const now = new Date();
    return (
      this.selectedYear() === now.getFullYear() &&
      this.selectedMonth() === now.getMonth() + 1
    );
  }

  private applyMonthFilter(year: number, month: number) {
    this.filterValues.year = year;
    this.filterValues.month = month;
    this.dataSource.filter = JSON.stringify(this.filterValues);
    this.filteredExpense.set(this.dataSource.filteredData);
  }

  // ─── Dialog ─────────────────────────────────────────
  openCreateDialog() {
    const dialogRef = this.dialog.open(ExpensesAddComponent, {
      width: '540px',
      height: '540px',
      data: {
        categoryMap: this.categoryMap,
        groupList: this.userGroups,
        currentGroupId: this.currentGroupId,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log(result)
      if (result === true)
        this.getExpense(this.currentGroupId, this.currentUserId);
    });
  }

  openEditDialog(record: any) {
    const relatedItem =
      record.relatedItemId != null ? this.itemMap[record.relatedItemId] : null;
    const dialogRef = this.dialog.open(ExpensesEditComponent, {
      width: '540px',
      height: '540px',
      data: {
        record: JSON.parse(JSON.stringify(record)),
        categoryMap: this.categoryMap,
        relatedItem,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true)
        this.getExpense(this.currentGroupId, this.currentUserId);
    });
  }

  // ─── 刪除 ────────────────────────────────────────────
  isAllSelected() {
    return this.selection.selected.length === this.dataSource.data.length;
  }

  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  deleteById() {
    const selectedIds = this.selection.selected.map((item) => item.id);
    const payLoad = {
      id: selectedIds,
      groupId: this.currentGroupId,
      userId: this.currentUserId,
    };
    Swal.fire({
      title: '確定要刪除嗎？',
      text: `您選中了 ${selectedIds.length} 筆，刪除後將無法還原！`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: '是的，刪除！',
      cancelButtonText: '取消',
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.http
        .postApi(this.basicUrl + 'expense/deleteInfo', payLoad)
        .subscribe({
          next: (res: any) => {
            if (res.code != 200) {
              Swal.fire({
                title: '刪除錯誤',
                text: res.message || 'server error',
                icon: 'error',
              });
              return;
            }
            Swal.fire({
              title: '刪除成功',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false,
            });
            this.selection.clear();
            this.getExpense(this.currentGroupId, this.currentUserId);
          },
          error: (err) =>
            Swal.fire({ title: '刪除錯誤', text: err.message, icon: 'error' }),
        });
    });
  }

  // ─── API ─────────────────────────────────────────────
  getCatgories() {
    this.http.getApi(this.basicUrl + 'categories/get').subscribe({
      next: (res: any) => {
        if (res.code != 200) {
          Swal.fire({
            title: '錯誤',
            text: res.message,
            icon: 'error',
          });
          return;
        }
        this.categoryMap = Object.keys(res.categoiesMap).map((key) => ({
          id: Number(key),
          name: res.categoiesMap[key],
        }));
      },
      error(err) {
        Swal.fire({
          title: '錯誤',
          text: err.message,
          icon: 'error',
        });
      },
    });
  }

  getUserGroupData() {
  this.http
    .getApi(
      this.basicUrl +
        `family_life/getGroupList?user_Id=${this.currentUserId}`,
    )
    .subscribe({
      next: (res: any) => {
        if (res.code != 200) {
          Swal.fire({
            title: '錯誤',
            text: res.message,
            icon: 'error',
          });
<<<<<<< HEAD
        },
      });
  }

  onGroupChange(groupId: number) {
    this.currentGroupId = groupId;
    this.selection.clear();
    this.getExpense(groupId, this.currentUserId);
  }
  //根據有沒有group ID 變換顯示 user  資訊
  private getDisplayedColumns(groupId: number): string[] {
    const isGroup = groupId !== 0;
    return [
      'select',
      'expense_date',
      'related_item_name',
      'category_id',
      'note',
      'price',
      ...(isGroup ? ['user'] : []),
      'actions',
    ];
  }
  getExpense(groupId: number, userId: number) {
    let url = `${this.basicUrl}expense/getInfo?userId=${userId}`;
    if (groupId != null) url += `&groupId=${groupId}`;

    this.http.getApi(url).subscribe({
      next: (res: any) => {


        if (res.code !== 200) {
          Swal.fire({ title: '錯誤', text: res.message, icon: 'error' });
          return;
        }
        this.expense = res.list ? [...res.list] : [];
        this.itemMap = res.itemMap || {};
        this.groupUserInfo = res.userMap; // 私人肯定沒有

        this.displayedColumns = this.getDisplayedColumns(groupId);
        this.dataSource.data = this.expense;
        // 資料進來後觸發月份 filter
        this.dataSource.filter = JSON.stringify(this.filterValues);
        this.filteredExpense.set(this.dataSource.filteredData);
      },
      error: (err) =>
        Swal.fire({ title: '錯誤', text: err.message, icon: 'error' }),
    });
  }
=======
          return;
        }
>>>>>>> origin/ZJ

        // 後端回傳 groupIdList，例如：{ 1: '我的家庭' }
        this.userGroups = Object.entries(res.groupIdList).map(
          ([id, name]) => ({
            groupId: Number(id),
            groupName: name as string,
          }),
        );

        // 私人記帳固定放第一個
        this.userGroups.unshift({
          groupId: 0,
          groupName: '私人記帳',
        });

        // 預設查私人記帳
        this.currentGroupId = 0;

        // 查詢記帳資料
        this.getExpense(this.currentGroupId, this.currentUserId);
      },

      error: (err) => {
        Swal.fire({
          title: '錯誤',
          text: err.message,
          icon: 'error',
        });
      },
    });
}

  onGroupChange(groupId: number) {
  // 切換目前群組
  this.currentGroupId = Number(groupId);

  // 清除勾選狀態
  this.selection.clear();

  // 重新查詢資料
  this.getExpense(this.currentGroupId, this.currentUserId);
}

// 根據群組判斷要不要顯示「使用者」欄位
// 私人記帳 groupId = 0，不顯示 user 欄
// 群組記帳 groupId != 0，顯示 user 欄
private getDisplayedColumns(groupId: number): string[] {
  const isGroup = groupId !== 0;

  return [
    'select',
    'expense_date',
    'related_item_name',
    'category_id',
    'note',
    'price',
    ...(isGroup ? ['user'] : []),
    'actions',
  ];
}

getExpense(groupId: number, userId: number) {
  const finalGroupId =
    groupId === undefined || groupId === null
      ? 0
      : Number(groupId);

  const url =
    `${this.basicUrl}expense/getInfo?userId=${userId}&groupId=${finalGroupId}`;

  console.log('查詢記帳 URL:', url);

  this.http.getApi(url).subscribe({
    next: (res: any) => {
      console.log('記帳查詢回傳:', res);

      if (res.code !== 200) {
        Swal.fire({
          title: '錯誤',
          text: res.message,
          icon: 'error',
        });
        return;
      }

      const list =
        res.list ||
        res.expenseList ||
        res.resultList ||
        res.data ||
        [];

      this.expense = [...list];

      this.itemMap = res.itemMap || {};
      this.groupUserInfo = res.userMap || {};

      this.displayedColumns = this.getDisplayedColumns(finalGroupId);

      this.dataSource.data = this.expense;
      this.dataSource.filter = JSON.stringify(this.filterValues);
      this.filteredExpense.set(this.dataSource.filteredData);
    },

    error: (err) => {
      console.log('記帳查詢錯誤:', err);

      Swal.fire({
        title: '錯誤',
        text: err.error?.message || err.message,
        icon: 'error',
      });
    },
  });
}
  // ─── 篩選 ─────────────────────────────────────────────
  getCategoryName(categoryId: number): string {
    return this.categoryMap.find((c) => c.id === categoryId)?.name || '未分類';
  }

  filterByCategory(categoryId: number | null) {
    this.filterValues.category = categoryId;
    this.dataSource.filter = JSON.stringify(this.filterValues);
    this.filteredExpense.set(this.dataSource.filteredData);
  }

  applyFilter(event: Event) {
    this.filterValues.search = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    this.dataSource.filter = JSON.stringify(this.filterValues);
    this.filteredExpense.set(this.dataSource.filteredData);
  }
}
