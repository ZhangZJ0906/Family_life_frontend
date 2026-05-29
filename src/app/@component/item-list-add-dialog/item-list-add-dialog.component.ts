import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { TextFieldModule } from '@angular/cdk/text-field'; // ✨ 匯入這個
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { LocationAndCategory } from '../../common/interfaceList';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { HttpClientService } from '../../@services/http-client.service';
import Swal from 'sweetalert2';

import { AuthService } from '../../@services/auth.service';

@Component({
  selector: 'app-item-list-add-dialog',
  imports: [
    CommonModule,
    TextFieldModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatDatepickerModule,
    MatSlideToggleModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './item-list-add-dialog.component.html',
  styleUrl: './item-list-add-dialog.component.scss',
})
export class ItemListAddDialogComponent implements OnInit {
  // 初始化對應資料庫欄位的物件
  groupId: number | null = null;
  location: LocationAndCategory[] = [];
  categories: LocationAndCategory[] = [];
  minDate: string = ''; // 日期限制
  today = new Date();

  subscriptionCategoryId = 4; // 依照你的資料庫分類 id 調整，訂閱如果不是 4 就改成正確 id

  isSubscriptionCategory(): boolean {
    const selectedCategory = this.categories.find(
      (cat) => Number(cat.id) === Number(this.item.categoryId),
    );

    return selectedCategory?.name === '訂閱';
  }

  isWarrantyCategory(): boolean {
    const selectedCategory = this.categories.find(
      (cat) => Number(cat.id) === Number(this.item.categoryId),
    );

    return selectedCategory?.name === '保固';
  }

  isMedicineCategory(): boolean {
    const selectedCategory = this.categories.find(
      (cat) => Number(cat.id) === Number(this.item.categoryId),
    );

    return selectedCategory?.name === '藥品';
  }
  item = {
    created_by_id: 1,
    groupId: 1,
    locationId: 1,
    categoryId: 1,

    name: '',
    quantity: 1,
    unit: '',
    unitPrice: 0,
    price: 0,
    purchaseDate: '',
    expireDate: '',
    notify: true,
    safeQuantity: 0,
    note: '',

    // 訂閱用欄位
    billingCycle: '每月',
    trialEndDate: '',
    nextBillingDate: '',

    // 保固用欄位
    brand: '',
    model: '',
    serialNumber: '',
    warrantyEndDate: '',
    storeName: '',

    // 藥品用欄位
    medicineType: '',
    dosage: '',
    usageMethod: '',
    source: '',
  };

  basicUrl!: string;
  group: any[] = [];
  constructor(
    public dialogRef: MatDialogRef<ItemListAddDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClientService,
    private authService: AuthService,
  ) {
    this.basicUrl = this.http.basicUrl;
    this.group = this.data?.groups ?? [];
    this.item.created_by_id = this.authService.currentUser()?.user_id ?? 0;
  }

  ngOnInit(): void {
    this.minDate = this.today.toISOString().split('T')[0];

    if (this.data && this.data.location) {
      this.location = [...this.data.location];
    }

    if (this.data && this.data.categories) {
      this.categories = [...this.data.categories];
      this.categories.shift();
    }

    if (
      this.data?.currentGroupId !== undefined &&
      this.data?.currentGroupId !== null
    ) {
      this.item.groupId = this.data.currentGroupId;
    }

    if (this.data?.isSubscriptionMode) {
      const subscriptionCategory = this.categories.find(
        (cat) => cat.name === '訂閱',
      );
      if (subscriptionCategory) {
        this.item.categoryId = subscriptionCategory.id;
      }
    }

    if (this.data?.isWarrantyMode) {
      const warrantyCategory = this.categories.find(
        (cat) => cat.name === '保固',
      );
      if (warrantyCategory) {
        this.item.categoryId = warrantyCategory.id;
      }
    }

    // 藥品要獨立判斷，不能放在訂閱裡面
    if (this.data?.isMedicineMode) {
      const medicineCategory = this.categories.find(
        (cat) => cat.name === '藥品',
      );
      if (medicineCategory) {
        this.item.categoryId = medicineCategory.id;
      }
    }

    this.applyPrefillItem();
  }

  private applyPrefillItem(): void {
    const prefill = this.data?.prefillItem;

    if (!prefill) {
      return;
    }

    this.item = {
      ...this.item,
      groupId: prefill.groupId ?? this.item.groupId,
      categoryId: prefill.categoryId ?? this.item.categoryId,
      name: prefill.name ?? this.item.name,
      quantity: prefill.quantity ?? this.item.quantity,
      purchaseDate: prefill.purchaseDate ?? this.item.purchaseDate,
      unit: (prefill.unit ?? this.item.unit) || '個',
    };
  }

  get totalPrice(): number {
    return (this.item.unitPrice || 0) * (this.item.quantity || 0);
  }
  addItemInfo() {
    // 如果是訂閱類別，走訂閱的新增流程
    if (this.isSubscriptionCategory()) {
      this.addSubscriptionInfo();
      return;
    }

    // 如果是保固類別，走保固的新增流程
    if (this.isWarrantyCategory()) {
      this.addWarrantyInfo();
      return;
    }

    // 如果是藥品類別，走藥品的新增流程
    if (this.isMedicineCategory()) {
      this.addMedicineInfo();
      return;
    }

    // 一般物品的新增流程
    const payload = {
      ...this.item,
      price: this.totalPrice,
      userId: this.item.created_by_id,
      groupId: this.item.groupId,
      purchaseDate: this.formatDate(this.item.purchaseDate),
      expireDate: this.formatDate(this.item.expireDate),
    };

    if (!payload.name?.trim()) {
      this.showError('請輸入物品名稱');
      return;
    }

    if (!payload.categoryId) {
      this.showError('請選擇分類');
      return;
    }

    if (!payload.locationId) {
      this.showError('請選擇存放位置');
      return;
    }

    if (!payload.purchaseDate) {
      this.showError('請選擇購買日期');
      return;
    }

    if (payload.quantity < 0) {
      this.showError('數量不能小於 0');
      return;
    }

    this.showLoading('新增物品中...');

    this.http.postApi(this.basicUrl + 'item/add', payload).subscribe({
      next: (res: any) => {

        Swal.close();

        if (res.code != 200) {
          Swal.fire({
            title: '錯誤',
            text: res.message || 'Server error',
            icon: 'error',
          });
          return;
        }

        this.createExpenseForItem(payload, res);
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

  private createExpenseForItem(itemPayload: any, itemAddRes: any): void {
    if (!itemPayload.price || itemPayload.price <= 0) {
      Swal.fire({
        title: '成功',
        text: '物品已新增',
        icon: 'success',
      });
      this.dialogRef.close(true);
      return;
    }
    console.log(itemPayload);
    const expensePayload = {
      userId: itemPayload.userId,
      groupId: itemPayload.groupId ?? 0,
      categoryId: itemPayload.categoryId,
      relatedItemId: this.getCreatedItemId(itemAddRes),
      relatedItemName: itemPayload.name,
      price: itemPayload.price,
      note: itemPayload.note || '由物品清單自動建立',
      expenseDate: itemPayload.purchaseDate,
    };

    this.showLoading('新增物品與記帳中...');

    this.http
      .postApi(this.basicUrl + 'expense/addInfo', expensePayload)
      .subscribe({
        next: (res: any) => {

          Swal.close();

          if (res.code != 200) {
            Swal.fire({
              title: '物品已新增，記帳建立失敗',
              text: res.message || 'Server error',
              icon: 'warning',
            });
            this.dialogRef.close(true);
            return;
          }

          Swal.fire({
            title: '成功',
            text: '物品與記帳已新增',
            icon: 'success',
          });
          this.dialogRef.close(true);
        },
        error: (err: any) => {
          Swal.fire({
            title: '物品已新增，記帳建立失敗',
            text: err.message || 'Server error',
            icon: 'warning',
          });
          this.dialogRef.close(true);
        },
      });
  }

  private getCreatedItemId(res: any): number | null {
    return (
      res?.itemId ??
      res?.id ??
      res?.data?.id ??
      res?.item?.id ??
      res?.itemInfo?.id ??
      null
    );
  }

  // 訂閱的新增流程
  addSubscriptionInfo(): void {
    const payload = {
      groupId: this.item.groupId,
      userId: this.item.created_by_id,
      name: this.item.name,
      price: this.item.unitPrice,
      billingCycle: this.item.billingCycle,
      purchaseDate: this.formatDate(this.item.purchaseDate),
      trialEndDate: this.formatDate(this.item.trialEndDate),
      notify: this.item.notify,
      note: this.item.note,
    };

    if (!payload.name?.trim()) {
      this.showError('請輸入訂閱名稱');
      return;
    }

    // if (!payload.groupId) {
    //   this.showError('請選擇所屬群組'+ payload.groupId);
    //   return;
    // }

    if (payload.price < 0) {
      this.showError('訂閱金額不可小於 0');
      return;
    }

    if (!payload.billingCycle) {
      this.showError('請選擇扣款週期');
      return;
    }

    this.showLoading('新增訂閱中...');

    this.http.postApi(this.basicUrl + 'subscription/add', payload).subscribe({
      next: (res: any) => {
        Swal.close();
        if (res.code != 200) {
          Swal.fire({
            title: '錯誤',
            text: res.message || 'Server error',
            icon: 'error',
          });
          return;
        }

        Swal.fire({
          title: '成功',
          text: res.message,
          icon: 'success',
        });

        this.dialogRef.close(true);
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

  addWarrantyInfo(): void {
    const payload = {
      groupId: this.item.groupId,
      userId: this.item.created_by_id,
      productName: this.item.name,
      brand: this.item.brand,
      model: this.item.model,
      serialNumber: this.item.serialNumber,
      purchaseDate: this.formatDate(this.item.purchaseDate),
      warrantyEndDate: this.formatDate(this.item.warrantyEndDate),
      storeName: this.item.storeName,
      price: this.item.unitPrice,
      notify: this.item.notify,
      note: this.item.note,
    };

    if (!payload.productName?.trim()) {
      this.showError('請輸入產品名稱');
      return;
    }

    // if (!payload.groupId) {
    //   this.showError('請選擇所屬群組');
    //   return;
    // }

    if (!payload.purchaseDate) {
      this.showError('請選擇購買日期');
      return;
    }

    if (!payload.warrantyEndDate) {
      this.showError('請選擇保固到期日');
      return;
    }

    this.showLoading('新增保固中...');

    this.http.postApi(this.basicUrl + 'warranty/add', payload).subscribe({
      next: (res: any) => {

        Swal.close();
        if (res.code != 200) {
          Swal.fire({
            title: '錯誤',
            text: res.message || 'Server error',
            icon: 'error',
          });
          return;
        }

        Swal.fire({
          title: '成功',
          text: res.message,
          icon: 'success',
        });

        this.dialogRef.close(true);
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

  addMedicineInfo(): void {
    const payload = {
      groupId: this.item.groupId,
      userId: this.item.created_by_id,
      name: this.item.name,
      medicineType: this.item.medicineType,
      quantity: this.item.quantity,
      unit: this.item.unit,
      unitPrice: this.item.unitPrice,
      safeQuantity: this.item.safeQuantity,
      purchaseDate: this.formatDate(this.item.purchaseDate),
      expireDate: this.formatDate(this.item.expireDate),
      dosage: this.item.dosage,
      usageMethod: this.item.usageMethod,
      location: this.item.locationId?.toString(),
      source: this.item.source,
      notify: this.item.notify,
      note: this.item.note,
    };

    if (!payload.name?.trim()) {
      this.showError('請輸入藥品名稱');
      return;
    }

    if (!payload.unit?.trim()) {
      this.showError('請輸入單位');
      return;
    }

    if (!payload.expireDate) {
      this.showError('請選擇藥品到期日');
      return;
    }

    this.showLoading('新增藥品中...');

    this.http.postApi(this.basicUrl + 'medicine/add', payload).subscribe({
      next: (res: any) => {
        Swal.close();
        if (res.code != 200) {
          Swal.fire('錯誤', res.message || 'Server error', 'error');
          return;
        }

        Swal.fire('成功', res.message, 'success');
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        Swal.fire('錯誤', err.message || 'Server error', 'error');
      },
    });
  }

  private formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
  private showError(msg: string) {
    Swal.fire({
      title: '資訊不完整',
      text: msg,
      icon: 'warning',
      confirmButtonColor: '#28a745',
    });
  }
  onNoClick(): void {
    this.dialogRef.close();
  }

  isSubmitDisabled(): boolean {
    if (!this.item.name?.trim()) {
      return true;
    }

    if (this.isSubscriptionCategory()) {
      return !this.item.billingCycle || !this.item.trialEndDate;
    }

    return !this.item.expireDate;
  }

  private showLoading(message: string = '處理中...'): void {
    Swal.fire({
      title: message,
      text: '請稍候',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  }
}
