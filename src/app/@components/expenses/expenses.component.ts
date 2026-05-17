import { Component, signal, computed } from '@angular/core';
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
import { ExpenseRecord, LocationAndCategory } from '../../common/interfaceList';
import { HttpClientService } from '../../@services/http-client.service';
import Swal from 'sweetalert2';
import { ExpensesAddComponent } from '../expenses-add/expenses-add.component';
import { ExpensesEditComponent } from '../expenses-edit/expenses-edit.component';

@Component({
  selector: 'app-expense-tracker',
  standalone: true,
  imports: [
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
  basicUrl!: string;
    // 模擬分類字典 (實務上會從 category 資料表查出)
  categoryMap: LocationAndCategory[] = [];
  dataSource = new MatTableDataSource<ExpenseRecord>([]);
    // Angular Material Table 要顯示的欄位
  displayedColumns: string[] = [
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
    this.getCatgories();
  }
  // 模擬登入使用者與群組環境
  currentGroupId = 1;
  currentUserId = 1;



  // 計算總支出
  totalExpense = computed(() =>
    this.dataSource.data.reduce((sum, r) => sum + (r.price || 0), 0),
  );
  openCreateDialog() {
    this.dialog.open(ExpensesAddComponent, {
      width: '540px',
      height: '540px',
      data: null,
    });
  }

  openEditDialog(record: any) {
    this.dialog.open(ExpensesEditComponent, {
      width: '540px',
      height: '540px',
      data: record,
    });
  }
  deleteById(e: object) {}
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
        console.log(this.categoryMap);
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
  // filterByCategory(catId: number) {
  //   if (catId === 0) {
  //     this.dataSource.data = this.itemList;
  //   } else {
  //     this.dataSource.data = this.itemList.filter(
  //       (item) => item.categoryId === catId,
  //     );
  //   }
  // }
  // 實作搜尋功能
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
