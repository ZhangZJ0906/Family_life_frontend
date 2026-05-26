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
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  DropDownGroupList,
  ExpenseRecord,
  LocationAndCategory,
} from '../../common/interfaceList';
import { HttpClientService } from '../../@services/http-client.service';
import { ExpensesAddComponent } from '../expenses-add/expenses-add.component';
import { ExpensesEditComponent } from '../expenses-edit/expenses-edit.component';
import Swal from 'sweetalert2';
import { AuthService } from '../../@services/auth.service';
import { TopbarComponent } from '../../shared/topbar/topbar.component';

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
    TopbarComponent,
  ],
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.scss',
})
export class ExpensesComponent {
  user: any;
  basicUrl!: string;
  userGroups: DropDownGroupList[] = [];
  categoryMap: LocationAndCategory[] = [];
  dataSource = new MatTableDataSource<ExpenseRecord>([]);
  selection = new SelectionModel<ExpenseRecord>(true, []);
  expense: ExpenseRecord[] = [];
  itemMap: { [key: number]: any } = {};
  currentGroupId!: number ;
  currentUserId !:number;
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
    private auth: AuthService,
  ) {
    this.basicUrl = this.http.basicUrl;
    const raw = sessionStorage.getItem('family-life-current-user'); // ← localStorage 改 sessionStorage
    this.user = JSON.parse(raw!);
    this.currentUserId = this.user.user_id;
    this.dataSource.filterPredicate = (data: ExpenseRecord, filter: string) => {
      const f = JSON.parse(filter);

      const matchCategory =
        f.category == null || data.categoryId === f.category;

      const keyword = f.search;
      const matchSearch =
        !keyword ||
        (data.note ?? '').toLowerCase().includes(keyword) ||
        (data.relatedItemName ?? '').toLowerCase().includes(keyword) ||
        this.getCategoryName(data.categoryId).toLowerCase().includes(keyword) ||
        (data.price?.toString() ?? '').includes(keyword) ||
        (data.expenseDate ?? '').toLowerCase().includes(keyword);

      const matchMonth = (() => {
        if (!data.expenseDate) return false;
        const [y, m] = data.expenseDate.split('-').map(Number);
        return y === f.year && m === f.month;
      })();

      return matchCategory && matchSearch && matchMonth;
    };

    this.getCatgories();
    this.getUserGroupData();
  }

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
        .postApi(this.basicUrl + 'expense/deleteInfo', selectedIds)
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
        if (res.code != 200) return;
        this.categoryMap = Object.keys(res.categoiesMap).map((key) => ({
          id: Number(key),
          name: res.categoiesMap[key],
        }));
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
          if (res.code != 200) return;
          this.userGroups = Object.entries(res.groupIdList).map(
            ([id, name]) => ({
              groupId: Number(id),
              groupName: name as string,
            }),
          );
          this.userGroups.unshift({ groupId: 0, groupName: '私人記帳' });
          this.currentGroupId = 0;
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

  onGroupChange(groupId: number ) {
    this.currentGroupId = groupId;
    this.selection.clear();
    this.getExpense(groupId, this.currentUserId);
  }

  getExpense(groupId: number , userId: number) {
    let url = `${this.basicUrl}expense/getInfo?userId=${userId}`;
    if (groupId != null) url += `&groupId=${groupId}`;

    this.http.getApi(url).subscribe({
      next: (res: any) => {
        if (res.code !== 200) return;
        this.expense = res.list ? [...res.list] : [];
        this.itemMap = res.itemMap || {};
        this.dataSource.data = this.expense;
        // 資料進來後觸發月份 filter
        this.dataSource.filter = JSON.stringify(this.filterValues);
        this.filteredExpense.set(this.dataSource.filteredData);
      },
      error: (err) =>
        Swal.fire({ title: '錯誤', text: err.message, icon: 'error' }),
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
