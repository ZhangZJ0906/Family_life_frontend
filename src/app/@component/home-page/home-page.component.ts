import { Component, OnInit } from '@angular/core';
import { TopbarComponent } from '../../shared/topbar/topbar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { HttpClientService } from '../../@services/http-client.service';
import Swal from 'sweetalert2';

interface PriorityTask {
  id: string;
  title: string;
  description: string;
  level: number;
  levelText: '高' | '中' | '低';
  levelClass: 'danger' | 'warning' | 'normal';
}
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
  expenseGroups: { groupId: number; groupName: string; avatar?: string }[] = [];
  // 登入者名稱，首頁問候語使用
  currentUserName = '';
  // 登入者自己的頭像，私人記帳使用
  currentUserAvatar = 'assets/default-avatar.png';
  // 目前年月
  selectedYear = new Date().getFullYear();
  selectedMonth = new Date().getMonth() + 1;
  // 首頁顯示的本月支出
  monthlyExpense = 0;
  itemsList: any[] = []; // 物品清單
  medicineList: any[] = []; // 備用藥品
  subscriptionList: any[] = []; // 定期訂閱
  warrantyList: any[] = [];
  // 物品位置對照表
  locationMap: { [key: number]: string } = {};

  constructor(private http: HttpClientService) {
    this.basicUrl = this.http.basicUrl;

    const raw = sessionStorage.getItem('family-life-current-user');

    if (raw) {
      const user = JSON.parse(raw);

      this.currentUserId = user.user_id;

      // 首頁顯示登入者名稱
      this.currentUserName = user.name || '使用者';

      // 私人記帳使用自己的頭像
      this.currentUserAvatar = user.avatar || 'assets/default-avatar.png';
    }
  }

  ngOnInit(): void {
    // 載入群組
    this.getExpenseGroups();
    // 一開始先查私人記帳
    this.getHomeMonthlyExpense();
    this.loadAllCategoriesData();
  }

  // 取得使用者群組，資料來源改成跟 Profile 一樣
  // 這樣才拿得到 group.avatar
  getExpenseGroups(): void {
    this.http
      .getApi(
          `family_life/get_group_list?user_id=${this.currentUserId}`,
      )
      .subscribe({
        next: (res: any) => {
          // Profile 頁是直接使用 res.groupList
          // 所以首頁也改用 res.groupList
          if (!res.groupList) {
            Swal.fire({
              icon: 'error',
              title: '群組載入失敗',
              text: res.message || '無法取得群組資料',
            });
            return;
          }

          const groups = res.groupList.map((group: any) => ({
            groupId: Number(group.groupId),
            groupName: group.groupName,

            // 真正的群組頭像
            // 如果資料庫沒有頭像，才使用預設圖
            avatar: group.avatar || 'assets/default-avatar.png',
          }));

          // 私人記帳固定放第一個
          // 頭像使用登入者自己的頭像
          this.expenseGroups = [
            {
              groupId: 0,
              groupName: '私人記帳',
              avatar: this.currentUserAvatar || 'assets/default-avatar.png',
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

          Swal.fire({
            icon: 'error',
            title: '群組載入失敗',
            text: '請確認後端是否啟動',
          });
        },
      });
  }
  // 取得目前選到的群組資料
  getCurrentExpenseGroup() {
    return this.expenseGroups.find(
      (group) => Number(group.groupId) === Number(this.currentGroupId),
    );
  }
  // 切換群組
  onExpenseGroupChange(groupId: number): void {
    this.currentGroupId = groupId;
    this.getHomeMonthlyExpense();
    this.loadAllCategoriesData();
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
    let url = `expense/getInfo?userId=${this.currentUserId}`;

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
        `item/getItems?userId=${userId}&groupId=${groupId}`,
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

          // 物品清單
          this.itemsList = res.items || [];

          // 關鍵：把後端回傳的位置對照表存起來
          // 例如 { 1: '冰箱', 2: '廚房', 3: '浴室', 4: '儲藏室' }
          this.locationMap = res.locationMap || {};

          console.log('物品清單資料:', res);
          console.log('物品清單第一筆:', this.itemsList[0]);
          console.log('位置對照表:', this.locationMap);
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
        `medicine/getByGroup?userId=${userId}&groupId=${groupId}`,
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
        `subscription/getByGroup?userId=${userId}&groupId=${groupId}`,
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
        `warranty/getByGroup?userId=${userId}&groupId=${groupId}`,
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

  get expiringFoodCount(): number {
    return this.itemsList.filter((item: any) => item.status === '即將到期')
      .length;
  }

  get medicineReminderCount(): number {
    return this.medicineList.filter(
      (item: any) =>
        item.status === '即將到期' ||
        item.status === '庫存不足' ||
        item.status === '已到期',
    ).length;
  }

  get warrantyExpiringCount(): number {
    return this.warrantyList.filter(
      (item: any) => item.status === '即將到期' || item.status === '即將到期',
    ).length;
  }

  get subscriptionReminderCount(): number {
    return this.subscriptionList.filter(
      (item: any) =>
        item.status === '即將扣款' ||
        item.status === '試用即將結束' ||
        item.status === '已逾期扣款',
    ).length;
  }

  // 今日優先處理清單
  // 從物品、藥品、保固、訂閱四種資料整理出最需要處理的前 3 筆
  get priorityTasks(): PriorityTask[] {
    const tasks: PriorityTask[] = [];

    // 1. 物品 / 食材：即將到期、已到期、庫存不足
    this.itemsList.forEach((item: any) => {
      const status = item.status || '';
      const name = item.name || '未命名物品';

      if (status === '已到期') {
        tasks.push({
          id: `item-expired-${item.id}`,
          title: `${name} 已到期`,
          description: `${this.getRemainText(item.expireDate)}｜${this.getItemLocationText(item)}`,
          level: 3,
          levelText: '高',
          levelClass: 'danger',
        });
      }

      if (status === '即將到期') {
        tasks.push({
          id: `item-soon-${item.id}`,
          title: `${name} 即將到期`,
          description: `${this.getRemainText(item.expireDate)}｜${this.getItemLocationText(item)}`,
          level: 3,
          levelText: '高',
          levelClass: 'danger',
        });
      }

      if (status === '庫存不足') {
        tasks.push({
          id: `item-low-${item.id}`,
          title: `${name} 庫存不足`,
          description: `目前數量 ${item.quantity ?? 0} ${item.unit || ''}`,
          level: 2,
          levelText: '中',
          levelClass: 'warning',
        });
      }
    });

    // 2. 藥品：到期、即將到期、庫存不足
    this.medicineList.forEach((item: any) => {
      const status = item.status || '';
      const name = item.name || item.medicineName || '未命名藥品';

      if (status === '已到期') {
        tasks.push({
          id: `medicine-expired-${item.id}`,
          title: `${name} 已到期`,
          description: `${this.getRemainText(item.expireDate)}｜藥品`,
          level: 3,
          levelText: '高',
          levelClass: 'danger',
        });
      }

      if (status === '即將到期') {
        tasks.push({
          id: `medicine-soon-${item.id}`,
          title: `${name} 即將到期`,
          description: `${this.getRemainText(item.expireDate)}｜藥品`,
          level: 2,
          levelText: '中',
          levelClass: 'warning',
        });
      }

      if (status === '庫存不足') {
        tasks.push({
          id: `medicine-low-${item.id}`,
          title: `${name} 庫存不足`,
          description: `目前數量 ${item.quantity ?? 0}`,
          level: 2,
          levelText: '中',
          levelClass: 'warning',
        });
      }
    });

    // 3. 保固：即將到期、已到期
    this.warrantyList.forEach((item: any) => {
      const status = item.status || '';
      const name = item.productName || item.name || '未命名保固';

      if (status === '已到期') {
        tasks.push({
          id: `warranty-expired-${item.id}`,
          title: `${name} 保固已到期`,
          description: `${this.getRemainText(item.warrantyEndDate)}｜保固`,
          level: 2,
          levelText: '中',
          levelClass: 'warning',
        });
      }

      if (status === '即將到期') {
        tasks.push({
          id: `warranty-soon-${item.id}`,
          title: `${name} 保固即將到期`,
          description: `${this.getRemainText(item.warrantyEndDate)}｜保固`,
          level: 2,
          levelText: '中',
          levelClass: 'warning',
        });
      }
    });

    // 4. 訂閱：即將扣款、試用即將結束、逾期扣款
    this.subscriptionList.forEach((item: any) => {
      const status = item.status || '';
      const name = item.name || '未命名訂閱';

      if (status === '已逾期扣款') {
        tasks.push({
          id: `subscription-overdue-${item.id}`,
          title: `${name} 已逾期扣款`,
          description: `${this.getRemainText(item.nextBillingDate)}｜NT$${item.price ?? 0}`,
          level: 3,
          levelText: '高',
          levelClass: 'danger',
        });
      }

      if (status === '即將扣款') {
        tasks.push({
          id: `subscription-soon-${item.id}`,
          title: `${name} 即將續扣`,
          description: `${this.getRemainText(item.nextBillingDate)}｜NT$${item.price ?? 0}`,
          level: 1,
          levelText: '低',
          levelClass: 'normal',
        });
      }

      if (status === '試用即將結束') {
        tasks.push({
          id: `subscription-trial-${item.id}`,
          title: `${name} 試用即將結束`,
          description: `${this.getRemainText(item.trialEndDate)}｜訂閱`,
          level: 2,
          levelText: '中',
          levelClass: 'warning',
        });
      }
    });

    // 不要只取前三筆，全部顯示，讓右側清單可以滾動
    return tasks.sort((a, b) => b.level - a.level);
  }
  get highPriorityCount(): number {
    return this.priorityTasks.filter((task) => task.level === 3).length;
  }

  // 已到期總件數
get expiredTotalCount(): number {
  const expiredItems = this.itemsList.filter(
    (item: any) => item.status === '已到期'
  ).length;

  const expiredMedicines = this.medicineList.filter(
    (item: any) => item.status === '已到期'
  ).length;

  const expiredWarranties = this.warrantyList.filter(
    (item: any) => item.status === '已到期'
  ).length;

  const expiredSubscriptions = this.subscriptionList.filter(
    (item: any) =>
      item.status === '已逾期扣款' ||
      item.status === '已到期'
  ).length;

  return expiredItems + expiredMedicines + expiredWarranties + expiredSubscriptions;
}
  // 計算剩餘天數文字
  getRemainText(dateStr: string): string {
    if (!dateStr) {
      return '未設定日期';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays < 0) {
      return `已過期 ${Math.abs(diffDays)} 天`;
    }

    if (diffDays === 0) {
      return '今天到期';
    }

    return `剩餘 ${diffDays} 天`;
  }

  // 取得物品位置文字
  getItemLocationText(item: any): string {
    // 後端可能回傳 locationId 或 location_id
    const locationId = item.locationId ?? item.location_id;

    // 如果 item 本身有位置名稱，優先使用
    if (item.locationName) {
      return item.locationName;
    }

    if (item.location) {
      return item.location;
    }

    // 如果 item 只有 locationId，就去 locationMap 找名稱
    if (locationId !== undefined && locationId !== null) {
      return this.locationMap[Number(locationId)] || '未設定位置';
    }

    return '未設定位置';
  }
}
