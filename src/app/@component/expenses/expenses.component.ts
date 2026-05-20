import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { ExpenseRecord, LocationAndCategory } from '../../common/interfaceList';
import { HttpClientService } from '../../@services/http-client.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-expense-tracker',
  standalone: true,
  imports: [
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
  constructor(private http: HttpClientService) {
    this.basicUrl = this.http.basicUrl;
    this.getCatgories();
  }
  // 模擬登入使用者與群組環境
  currentGroupId = 1;
  currentUserId = 1;

  // 表單獨立 Signal 綁定
  formCategoryId = signal<number>(1);
  formPrice = signal<number | null>(null);
  formNote = signal<string>('');
  formRelatedItemId = signal<number | null>(null);

  // 模擬分類字典 (實務上會從 category 資料表查出)
  categoryMap: LocationAndCategory[] = [];

  // 記帳紀錄列表 (改用資料庫欄位命名)
  records = signal<ExpenseRecord[]>([
    {
      id: 101,
      group_id: 1,
      user_id: 1,
      category_id: 1,
      related_item_id: null,
      price: 150,
      expense_date: '2026-05-14',
      note: '買晚餐便當',
      created_at: '2026-05-14 18:30:00',
    },
    {
      id: 102,
      group_id: 1,
      user_id: 1,
      category_id: 2,
      related_item_id: null,
      price: 1200,
      expense_date: '2026-05-15',
      note: '購買生活大潤發日常用品',
      created_at: '2026-05-15 10:15:00',
    },
  ]);

  // Angular Material Table 要顯示的欄位
  displayedColumns: string[] = [
    'expense_date',
    'category_id',
    'note',
    'price',
    'actions',
  ];

  // 計算總支出
  totalExpense = computed(() =>
    this.records().reduce((sum, r) => sum + (r.price || 0), 0),
  );

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

  // 新增紀錄
  addRecord() {
    if (!this.formPrice() || this.formPrice()! <= 0) {
      alert('請輸入有效的金額！');
      return;
    }

    const newRecord: ExpenseRecord = {
      id: Date.now(), // 暫時用時間戳記當前端 ID
      group_id: this.currentGroupId,
      user_id: this.currentUserId,
      category_id: this.formCategoryId(),
      related_item_id: this.formRelatedItemId(),
      price: this.formPrice(),
      expense_date: new Date().toISOString().split('T')[0], // 格式化為 YYYY-MM-DD
      note: this.formNote(),
      created_at: new Date().toLocaleString(),
    };

    // 更新 Signal 陣列 (新項目排在最前面)
    this.records.update((prev) => [newRecord, ...prev]);

    // 重設表單
    this.formPrice.set(null);
    this.formNote.set('');
    this.formRelatedItemId.set(null);
  }

  // 刪除紀錄
  deleteRecord(id: number | null) {
    if (!id) return;
    this.records.update((prev) => prev.filter((r) => r.id !== id));
  }
}
