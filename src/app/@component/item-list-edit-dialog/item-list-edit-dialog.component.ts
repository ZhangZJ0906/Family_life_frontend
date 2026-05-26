import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle'; // 必須有這個
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Item, LocationAndCategory } from '../../common/interfaceList';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { AuthService } from '../../@services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-item-list-edit-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatDatepickerModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './item-list-edit-dialog.component.html',
  styleUrl: './item-list-edit-dialog.component.scss',
})
export class ItemListEditDialogComponent implements OnInit {
  private readonly specialCategories = ['訂閱', '保固', '藥品']; // 特殊類

  // 綁定表單的資料結構
  item: any = {};
  group: any[] = [];

  categories: LocationAndCategory[] = [];
  location: LocationAndCategory[] = [];

  isSubscriptionCategory(): boolean {
    // 優先用 categoryId 判斷，找不到才 fallback 到 mode 旗標
    if (this.item.categoryId) {
      const selectedCategory = this.categories.find(
        (cat) => Number(cat.id) === Number(this.item.categoryId),
      );
      return selectedCategory?.name === '訂閱';
    }
    return this.data?.isSubscriptionMode === true;
  }

  isWarrantyCategory(): boolean {
    if (this.item.categoryId) {
      const selectedCategory = this.categories.find(
        (cat) => Number(cat.id) === Number(this.item.categoryId),
      );
      return selectedCategory?.name === '保固';
    }
    return this.data?.isWarrantyMode === true;
  }

  isMedicineCategory(): boolean {
    if (this.item.categoryId) {
      const selectedCategory = this.categories.find(
        (cat) => Number(cat.id) === Number(this.item.categoryId),
      );
      return selectedCategory?.name === '藥品';
    }
    return this.data?.isMedicineMode === true;
  }
  get isOriginalSpecial(): boolean {
    return this.specialCategories.includes(this.originalCategoryName);
  }

  constructor(
    public dialogRef: MatDialogRef<ItemListEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private authService: AuthService,
  ) {
    console.log(this.data);
    this.group = this.data.groups;
  }

  ngOnInit(): void {
      if (this.data && this.data.item) {
        this.item = { ...this.data.item };

        this.location = this.data.locationMap || [];
        this.categories = this.data.categoriesMap || [];

        if (!this.item.categoryId) {
          let modeCategoryName = '';
          if (this.data?.isSubscriptionMode) modeCategoryName = '訂閱';
          else if (this.data?.isWarrantyMode) modeCategoryName = '保固';
          else if (this.data?.isMedicineMode) modeCategoryName = '藥品';

          if (modeCategoryName) {
            const found = this.categories.find(
              (cat) => cat.name === modeCategoryName,
            );
            if (found) this.item.categoryId = found.id;
          }
        }
        // 保固資料後端欄位是 productName，Dialog 共用 item.name
        if (this.data?.isWarrantyMode) {
          this.item.name = this.item.productName;
        }

        this.item.expireDate = this.formatDate(this.item.expireDate);
        this.item.purchaseDate = this.formatDate(this.item.purchaseDate);
        this.item.trialEndDate = this.formatDate(this.item.trialEndDate);
        this.item.nextBillingDate = this.formatDate(this.item.nextBillingDate);
        this.item.warrantyEndDate = this.formatDate(this.item.warrantyEndDate);
      }
  }
  // 在你的 Component 內，或是物件 model 內
  get totalPrice(): number {
    return (this.item.unitPrice || 0) * (this.item.quantity || 0);
  }

  // 日期格式化小工具：統一轉成 HTML date input 可用的 YYYY-MM-DD
  private formatDate(date: any): string {
    if (!date) return '';

    // 如果後端回來是 2026-05-18，直接回傳
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }

    // 如果後端回來是 2026/05/18，轉成 2026-05-18
    if (typeof date === 'string' && /^\d{4}\/\d{2}\/\d{2}$/.test(date)) {
      return date.replaceAll('/', '-');
    }

    // 如果是 Date 物件或其他日期格式，轉成 YYYY-MM-DD
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
  // 訂閱修改時，不需要前端傳 nextBillingDate，後端會用 trialEndDate + billingCycle 自動算
  onOkClose(userId :number): void {
    let payload: any;
    const newCat = this.categories.find(
      (cat) => Number(cat.id) === Number(this.item.categoryId),
    );
    const newCatName = newCat?.name || '';
    const isOriginalSpecial = this.specialCategories.includes(
      this.originalCategoryName,
    );
    const isNewSpecial = this.specialCategories.includes(newCatName);

    // 特殊類 → 只能是同一個
    if (isOriginalSpecial && newCatName !== this.originalCategoryName) {
      Swal.fire({
        title: '分類不可變更',
        text: `${this.originalCategoryName} 不可切換至其他分類`,
        icon: 'warning',
      });
      return;
    }

    // 一般類 → 不可切換到特殊類
    if (!isOriginalSpecial && isNewSpecial) {
      Swal.fire({
        title: '分類不可變更',
        text: '一般物品不可切換至訂閱、保固或藥品',
        icon: 'warning',
      });
      return;
    }

    if (this.isSubscriptionCategory()) {
    payload = {
      id: this.item.id,
      groupId: this.item.groupId,
      userId: userId,
      name: this.item.name,
      price: this.item.price || this.item.unitPrice || 0,
      billingCycle: this.item.billingCycle,
      purchaseDate: this.formatDate(this.item.purchaseDate),
      trialEndDate: this.formatDate(this.item.trialEndDate),
      notify: this.item.notify,
      note: this.item.note,
    };
  } else if (this.isWarrantyCategory()) {
    payload = {
      id: this.item.id,
      groupId: this.item.groupId,
      userId: userId,
      productName: this.item.name,
      brand: this.item.brand,
      model: this.item.model,
      serialNumber: this.item.serialNumber,
      purchaseDate: this.formatDate(this.item.purchaseDate),
      warrantyEndDate: this.formatDate(this.item.warrantyEndDate),
      storeName: this.item.storeName,
      price: this.item.price || 0,
      notify: this.item.notify,
      note: this.item.note,
    };
  } else if (this.isMedicineCategory()) {
  payload = {
    id: this.item.id,
    groupId: this.item.groupId,
    userId: userId,
    name: this.item.name,
    medicineType: this.item.medicineType,
    quantity: this.item.quantity,
    unit: this.item.unit,
    safeQuantity: this.item.safeQuantity ?? 0,
    purchaseDate: this.formatDate(this.item.purchaseDate),
    expireDate: this.formatDate(this.item.expireDate),
    dosage: this.item.dosage,
    usageMethod: this.item.usageMethod,
    unitPrice: this.item.unitPrice,
    location: this.item.location,
    source: this.item.source,
    notify: this.item.notify,
    note: this.item.note,
  };
}
  else {
    payload = {
      ...this.item,
      purchaseDate: this.formatDate(this.item.purchaseDate),
      expireDate: this.formatDate(this.item.expireDate),
      price: this.totalPrice,
      safeQuantity: this.item.safeQuantity ?? 0,
    };

    this.dialogRef.close(payload);
  }
}
  onCancel(): void {
    this.dialogRef.close();
  }

  get originalCategoryName(): string {
    if (this.data?.item?.categoryId) {
      const original = this.categories.find(
        (cat) => Number(cat.id) === Number(this.data.item.categoryId),
      );
      if (original?.name) return original.name;
    }

    // 沒有 categoryId，用 mode 旗標推斷
    if (this.data?.isSubscriptionMode) return '訂閱';
    if (this.data?.isWarrantyMode) return '保固';
    if (this.data?.isMedicineMode) return '藥品';

    return '';
  }

  isCategoryDisabled(cat: LocationAndCategory): boolean {
    const isOriginalSpecial = this.specialCategories.includes(
      this.originalCategoryName,
    );

    if (isOriginalSpecial) {
      // 原始是特殊類 → 只能選「同一個」特殊類，其他全禁
      return cat.name !== this.originalCategoryName;
    } else {
      // 原始是一般類 → 特殊類全禁，一般類可換
      return this.specialCategories.includes(cat.name);
    }
  }
}
