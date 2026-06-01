import { Component, OnInit } from '@angular/core';
import { TopbarComponent } from '../../shared/topbar/topbar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { HttpClientService } from '../../@services/http-client.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-home-page',
  imports: [
    TopbarComponent,
    CommonModule,
    FormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
})
export class HomePageComponent implements OnInit {
  basicUrl = '';
  currentUserId!: number;
  currentGroupId: number = 0;
  expenseGroups: { groupId: number; groupName: string }[] = [];
  // 目前年月
  selectedYear = new Date().getFullYear();
  selectedMonth = new Date().getMonth() + 1;
  // 首頁顯示的本月支出
  monthlyExpense = 0;
  itemsList: any[] = []; // 物品清單
  medicineList: any[] = []; // 備用藥品
  subscriptionList: any[] = []; // 定期訂閱
  warrantyList: any[] = [];

  constructor(private http: HttpClientService) {
    this.basicUrl = this.http.basicUrl;

    const raw = sessionStorage.getItem('family-life-current-user');

    if (raw) {
      const user = JSON.parse(raw);
      this.currentUserId = user.user_id;
    }
  }

  ngOnInit(): void {
    // 載入群組
    this.getExpenseGroups();
    // 一開始先查私人記帳
    this.getHomeMonthlyExpense();
    this.loadAllCategoriesData();
  }

  // 取得使用者群組，邏輯跟記帳頁相同
  getExpenseGroups(): void {
    this.http
      .getApi(
        this.basicUrl +
          `family_life/getGroupList?user_Id=${this.currentUserId}`,
      )
      .subscribe({
        next: (res: any) => {
          if (res.code !== 200) {
            return;
          }

          const groups = Object.entries(res.groupIdList).map(([id, name]) => ({
            groupId: Number(id),
            groupName: name as string,
          }));

          // 私人記帳固定放第一個
          this.expenseGroups = [
            {
              groupId: 0,
              groupName: '私人記帳',
            },
            ...groups,
          ];

          // 預設私人記帳
          this.currentGroupId = 0;

          // 群組載入後再查一次私人記帳
          this.getHomeMonthlyExpense();
        },
        error: (err) => {
          console.log(err);
        },
      });
  }

  // 切換群組
  onExpenseGroupChange(groupId: number): void {
    this.currentGroupId = groupId;
    this.getHomeMonthlyExpense();
  }

  // 上一個月
  prevMonth(): void {
    if (this.selectedMonth === 1) {
      this.selectedYear--;
      this.selectedMonth = 12;
    } else {
      this.selectedMonth--;
    }

    this.getHomeMonthlyExpense();
  }

  // 下一個月
  nextMonth(): void {
    if (this.isCurrentMonth()) {
      return;
    }

    if (this.selectedMonth === 12) {
      this.selectedYear++;
      this.selectedMonth = 1;
    } else {
      this.selectedMonth++;
    }

    this.getHomeMonthlyExpense();
  }

  // 是否為目前月份
  isCurrentMonth(): boolean {
    const now = new Date();

    return (
      this.selectedYear === now.getFullYear() &&
      this.selectedMonth === now.getMonth() + 1
    );
  }

  // 查詢首頁本月支出
  getHomeMonthlyExpense(): void {
    // 畫面上的 0 是私人記帳，後端要吃 0，所以不帶 groupId
    const apiGroupId = this.currentGroupId === 0 ? 0 : this.currentGroupId;
    console.log('查詢首頁支出，groupId:', this.currentUserId);
    let url = `${this.basicUrl}expense/getInfo?userId=${this.currentUserId}`;

    if (apiGroupId !== null) {
      url += `&groupId=${apiGroupId}`;
    }

    this.http.getApi(url).subscribe({
      next: (res: any) => {
        if (res.code !== 200) {
          this.monthlyExpense = 0;
          return;
        }
        console.log('支出列表', res.list);
        const list = res.list ? [...res.list] : [];

        // 只加總目前 selectedYear / selectedMonth 的支出
        const monthList = list.filter((item: any) => {
          if (!item.expenseDate) {
            return false;
          }

          const [year, month] = item.expenseDate.split('-').map(Number);

          return year === this.selectedYear && month === this.selectedMonth;
        });

        this.monthlyExpense = monthList.reduce((sum: number, item: any) => {
          return sum + (Number(item.price) || 0);
        }, 0);
      },
      error: (err) => {
        console.log(err);
        this.monthlyExpense = 0;
      },
    });
  }

  loadAllCategoriesData(): void {
    const userId = this.currentUserId;
    const groupId = this.currentGroupId;

    // 1. 取得物品清單 (Items) -> 對應 /item/getItems
    this.http
      .getApi(
        `${this.basicUrl}item/getItems?userId=${userId}&groupId=${groupId}`,
      )
      .subscribe({
        next: (res: any) => {
          if (res.code != 200) {
            Swal.fire({
              title: '錯誤',
              text: '取得物品清單失敗:' + res.message,
              icon: 'error',
            });
            return;
          }
          // 請根據後端 GetItemsRes 的實際欄位調整，這裡假設是 res.list 或 res.items
          this.itemsList = res.items || [];
          console.log('物品清單資料:',res);
        },
        error: (err) => {
          Swal.fire({
            title: '錯誤',
            text: '取得物品清單失敗:' + err,
            icon: 'error',
          });
        },
      });

    // 2. 取得備用藥品 (Medicine) -> 對應 /medicine/getByGroup
    this.http
      .getApi(
        `${this.basicUrl}medicine/getByGroup?userId=${userId}&groupId=${groupId}`,
      )
      .subscribe({
        next: (res: any) => {
          if (res.code != 200) {
            Swal.fire({
              title: '錯誤',
              text: '取得備用藥品失敗:' + res.message,
              icon: 'error',
            });
            return;
          }
          this.medicineList = res.data || [];
          console.log('備用藥品資料:', this.medicineList);
        },
        error: (err) => {
          Swal.fire({
            title: '錯誤',
            text: '取得備用藥品失敗:',
            icon: 'error',
          });
        },
      });

    // 3. 取得定期訂閱 (Subscription) -> 對應 /subscription/getByGroup
    this.http
      .getApi(
        `${this.basicUrl}subscription/getByGroup?userId=${userId}&groupId=${groupId}`,
      )
      .subscribe({
        next: (res: any) => {
          if (res.code != 200) {
            Swal.fire({
              title: '錯誤',
              text: '取得定期訂閱失敗:' + res.message,
              icon: 'error',
            });
            return;
          }
          this.subscriptionList = res.data || [];
          console.log('定期訂閱資料:', this.subscriptionList);
        },
        error: (err) => {
          Swal.fire({
            title: '錯誤',
            text: '取得定期訂閱失敗:' + err,
            icon: 'error',
          });
        },
      });

    // 4. 取得保固到期 (Warranty) -> 對應 /warranty/getByGroup
    this.http
      .getApi(
        `${this.basicUrl}warranty/getByGroup?userId=${userId}&groupId=${groupId}`,
      )
      .subscribe({
        next: (res: any) => {
          if (res.code != 200) {
            Swal.fire({
              title: '錯誤',
              text: '取得保固到期失敗:' + res.message,
              icon: 'error',
            });
            return;
          }
          this.warrantyList = res.list || res.warranties || [];
          console.log('保固到期資料:', this.warrantyList);
        },
        error: (err) => {
          Swal.fire({
            title: '錯誤',
            text: '取得保固到期失敗:' + err,
            icon: 'error',
          });
        },
      });
  }
}
