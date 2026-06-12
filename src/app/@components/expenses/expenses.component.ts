import { Component, computed, signal, ViewChild } from '@angular/core';
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
import { ActivatedRoute } from '@angular/router';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';

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
    MatSort,
    MatSortHeader,
    MatPaginatorModule,
  ],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.scss',
})
export class ExpensesComponent {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  user: any;
  basicUrl!: string;
  groupUserInfo: { [key: number]: GroupUser } = {};
  userGroups: (DropDownGroupList & { avatar?: string })[] = [];
  currentUserAvatar = 'assets/default-avatar.png';
  categoryMap: LocationAndCategory[] = [];
  dataSource = new MatTableDataSource<ExpenseRecord>([]);
  // 手機版分頁
mobilePageIndex = 0;
mobilePageSize = 3;

get mobileExpenses(): ExpenseRecord[] {
  const data = this.dataSource.filteredData || [];
  const start = this.mobilePageIndex * this.mobilePageSize;
  return data.slice(start, start + this.mobilePageSize);
}

get mobileTotalPages(): number {
  const total = this.dataSource.filteredData?.length || 0;
  return Math.ceil(total / this.mobilePageSize);
}

get mobileCurrentPage(): number {
  return this.mobileTotalPages === 0 ? 0 : this.mobilePageIndex + 1;
}

nextMobilePage(): void {
  if (this.mobilePageIndex < this.mobileTotalPages - 1) {
    this.mobilePageIndex++;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

prevMobilePage(): void {
  if (this.mobilePageIndex > 0) {
    this.mobilePageIndex--;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

resetMobilePage(): void {
  this.mobilePageIndex = 0;
}
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

  //上次登入時間
  lastLoginTime!: Date;

  displayedColumns: string[] = [
    'select',
    'expense_date',
    'related_item_name',
    'category_id',
    'note',
    'price',
    'user',
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
    private route: ActivatedRoute,
  ) {
    this.basicUrl = this.http.basicUrl;

    // 取得目前登入者資料
    const raw = sessionStorage.getItem('family-life-current-user');



    if (raw) {
      this.user = JSON.parse(raw);
      this.currentUserId = this.user.user_id;

      // 私人記帳使用登入者自己的頭像
      this.currentUserAvatar = this.user.avatar || 'assets/default-avatar.png';

      this.getLoginExpensePageTime()
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
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.sortingDataAccessor = (item: any, property: string) => {
      switch (property) {
        case 'price':
          return item.price != null ? Number(item.price) : 0;
        default:
          // 其他欄位維持預設處理方式
          return item[property];
      }
    };
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
      width: '600px',
      maxWidth: '92vw',
      maxHeight: '86vh',
      panelClass: 'expense-create-dialog-panel',
      autoFocus: false,
      data: {
        categoryMap: this.categoryMap,
        groupList: this.userGroups,
        currentGroupId: this.currentGroupId,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true)
        this.getExpense(this.currentGroupId, this.currentUserId, true);
    });
  }

  openEditDialog(record: any) {
    const relatedItem =
      record.relatedItemId != null ? this.itemMap[record.relatedItemId] : null;
    const dialogGroupId =
      this.currentGroupId !== null && this.currentGroupId !== undefined
        ? Number(this.currentGroupId)
        : Number(record.groupId ?? 0);
    /*
    取得群組名稱：
    - groupId = 0：私人記帳
    - groupId != 0：從 userGroups 找 groupName
  */
    const currentGroup = this.userGroups.find(
      (g: any) => Number(g.groupId) === dialogGroupId,
    );

    const currentGroupName =
      dialogGroupId === 0
        ? '私人記帳'
        : currentGroup?.groupName || '未選擇群組';
    const dialogRef = this.dialog.open(ExpensesEditComponent, {
      width: '600px',
      maxWidth: '92vw',
      maxHeight: '86vh',
      panelClass: 'expense-edit-dialog-panel',
      autoFocus: false,
      data: {
        record: JSON.parse(JSON.stringify(record)),
        categoryMap: this.categoryMap,
        relatedItem,
        currentUserId: this.currentUserId,
        currentGroupId: dialogGroupId,
        currentGroupName: currentGroupName,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      this.getExpense(this.currentGroupId, this.currentUserId, true);
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
      this.showLoading('刪除中...');

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
            this.getExpense(this.currentGroupId, this.currentUserId, true);
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

  // 取得目前選到的群組，用在 mat-select-trigger 顯示頭像與名稱
getCurrentGroup() {
  return this.userGroups.find(
    (group) => Number(group.groupId) === Number(this.currentGroupId),
  );
}

  getUserGroupData() {
    this.showLoading('載入資料中...');
    this.http
    .getApi(
      this.basicUrl +
        `family_life/get_group_list?user_id=${this.currentUserId}`,
    )
    .subscribe({
      next: (res: any) => {
        if (!res.groupList) {
          Swal.fire({
            title: '錯誤',
            text: res.message || '無法取得群組資料',
            icon: 'error',
          });
          return;
        }

        // 群組資料，包含 groupId、groupName、avatar
        const groups = res.groupList.map((group: any) => ({
          groupId: Number(group.groupId),
          groupName: group.groupName,
          avatar: group.avatar || 'assets/default-avatar.png',
        }));

        // 私人記帳固定放第一個
        // 私人頭像使用登入者自己的頭像
        this.userGroups = [
          {
            groupId: 0,
            groupName: '私人記帳',
            avatar: this.currentUserAvatar || 'assets/default-avatar.png',
          },
          ...groups,
        ];

        const fromNotify = this.route.snapshot.queryParamMap.get('groupId');
        this.currentGroupId = fromNotify ? Number(fromNotify) : 0;

        // 查詢記帳資料
        this.getExpense(this.currentGroupId, this.currentUserId, false);
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
    this.getExpense(this.currentGroupId, this.currentUserId, true);
  }

  getExpense(groupId: number, userId: number, showLoader: boolean = true) {
    if (showLoader) {
      this.showLoading('載入記帳資料...');
    }
    const finalGroupId =
      groupId === undefined || groupId === null ? 0 : Number(groupId);

    const url = `${this.basicUrl}expense/getInfo?userId=${userId}&groupId=${finalGroupId}`;
    this.http.getApi(url).subscribe({
      next: (res: any) => {
        Swal.close();
        if (res.code !== 200) {
          Swal.fire({
            title: '錯誤',
            text: res.message,
            icon: 'error',
          });
          return;
        }
        const list = res.list || [];
        this.expense = [...list];
        this.itemMap = res.itemMap || {};
        this.groupUserInfo = res.userMap || {};
        this.dataSource.data = this.expense;
        this.dataSource.filter = JSON.stringify(this.filterValues);
        this.filteredExpense.set(this.dataSource.filteredData);
        this.resetMobilePage();
      },

      error: (err) => {
        Swal.close();
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
    this.resetMobilePage();
  }

  applyFilter(event: Event) {
    this.filterValues.search = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    this.dataSource.filter = JSON.stringify(this.filterValues);
    this.filteredExpense.set(this.dataSource.filteredData);
    this.resetMobilePage();
  }

  //抓取上次登入該page時間
  getLoginExpensePageTime(): Promise<void> {
    return new Promise((resolve) => {
      this.http
        .getApi(
          `${this.basicUrl}expense/getLoginExpensePageTime?userId=${this.currentUserId}`,
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

  private showLoading(message = '載入中...'): void {
    Swal.fire({
      title: message,
      text: '請稍候',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });
  }
}
