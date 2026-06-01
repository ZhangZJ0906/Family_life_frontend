import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
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
import { LocationAndCategory } from '../../common/interfaceList';
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
  private readonly specialCategories = ['訂閱', '保固', '藥品'];

  item: any = {};
  originalItem: any = {};

  group: any[] = [];
  today = new Date();

  categories: LocationAndCategory[] = [];
  location: LocationAndCategory[] = [];

  constructor(
    public dialogRef: MatDialogRef<ItemListEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.group = this.data.groups ?? [];
  }

  ngOnInit(): void {
    if (this.data && this.data.item) {
      this.item = { ...this.data.item };

      this.location = this.data.locationMap || [];
      this.categories = [...(this.data.categoriesMap || [])];
      this.categories.shift();

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

      if (this.data?.isWarrantyMode) {
        this.item.name = this.item.productName;
      }

      this.item.expireDate = this.formatDate(this.item.expireDate);
      this.item.purchaseDate = this.formatDate(this.item.purchaseDate);
      this.item.trialEndDate = this.formatDate(this.item.trialEndDate);
      this.item.nextBillingDate = this.formatDate(this.item.nextBillingDate);
      this.item.warrantyEndDate = this.formatDate(this.item.warrantyEndDate);
      this.originalItem = JSON.parse(JSON.stringify(this.item));
    }
  }

  get totalPrice(): number {
    return (this.item.unitPrice || 0) * (this.item.quantity || 0);
  }

  get hasChange(): boolean {
    return JSON.stringify(this.item) !== JSON.stringify(this.originalItem);
  }

  isSubscriptionCategory(): boolean {
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

  get originalCategoryName(): string {
    if (this.data?.item?.categoryId) {
      const original = this.categories.find(
        (cat) => Number(cat.id) === Number(this.data.item.categoryId),
      );
      if (original?.name) return original.name;
    }

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
      return cat.name !== this.originalCategoryName;
    } else {
      return this.specialCategories.includes(cat.name);
    }
  }
  get isExpired(): boolean {
    if (!this.item) return false;
    return this.item.status === '已到期' || this.item.status === '已逾期扣款' || this.item.status === '已過保';
  }
  /**
   * ✨ 核心檢查防呆：控管 HTML 確認按鈕的 [disabled] 狀態
   */
  isSubmitDisabled(): boolean {
    // 1. 如果資料完全沒有變更，直接停用
    if (!this.hasChange) return true;
    if (this.isExpired) {
      return (
        !this.item.name?.trim() ||
        this.item.groupId == null ||
        !this.item.categoryId
      );
    }
    // 2. 基本必填欄位檢查
    if (!this.item.name?.trim()) return true;
    if (this.item.groupId == null) return true;
    if (!this.item.categoryId) return true;

    // 3. 依照各種類別分別實施更嚴格的必填驗證
    if (this.isSubscriptionCategory()) {
      if (this.item.price === null || this.item.price < 0) return true;
      if (!this.item.billingCycle) return true;
      if (!this.item.purchaseDate) return true;
      if (!this.item.trialEndDate) return true;
    } else if (this.isWarrantyCategory()) {
      if (!this.item.purchaseDate) return true;
      if (!this.item.warrantyEndDate) return true;
    } else if (this.isMedicineCategory()) {
      if (this.item.quantity === null || this.item.quantity < 0) return true;
      if (!this.item.unit?.trim()) return true;
      if (!this.item.purchaseDate) return true;
      if (!this.item.expireDate) return true;
    } else {
      // 一般物品
      if (this.item.quantity === null || this.item.quantity < 0) return true;
      if (!this.item.locationId) return true;
      if (!this.item.purchaseDate) return true;
      if (!this.item.expireDate) return true;
    }

    return false;
  }

  private showError(msg: string) {
    Swal.fire({
      title: '資訊不完整',
      text: msg,
      icon: 'warning',
      confirmButtonColor: '#28a745',
    });
  }

  onOkClose(userId: number): void {
    if (this.isExpired) {
      let notifyType = 'notifyOnly'; // 預設一般物品

      if (this.isSubscriptionCategory()) notifyType = 'subscriptionNotifyOnly';
      else if (this.isWarrantyCategory()) notifyType = 'warrantyNotifyOnly';
      else if (this.isMedicineCategory()) notifyType = 'medicineNotifyOnly';

      this.dialogRef.close({
        _type: notifyType,
        id: this.item.id,
        notify: this.item.notify,
      });
      return;
    }
    // 防呆雙保險：如果因任何緣故按鈕未鎖定，進入方法時重新校驗
    if (!this.item.name?.trim()) {
      this.showError('請輸入物品名稱');
      return;
    }
    if (this.item.groupId == null) {
      this.showError('請選擇所屬群組');
      return;
    }
    if (!this.item.categoryId) {
      this.showError('請選擇分類');
      return;
    }

    const newCat = this.categories.find(
      (cat) => Number(cat.id) === Number(this.item.categoryId),
    );
    const newCatName = newCat?.name || '';
    const isOriginalSpecial = this.specialCategories.includes(
      this.originalCategoryName,
    );
    const isNewSpecial = this.specialCategories.includes(newCatName);

    if (isOriginalSpecial && newCatName !== this.originalCategoryName) {
      Swal.fire({
        title: '分類不可變更',
        text: `${this.originalCategoryName} 不可切換至其他分類`,
        icon: 'warning',
      });
      return;
    }

    if (!isOriginalSpecial && isNewSpecial) {
      Swal.fire({
        title: '分類不可變更',
        text: '一般物品不可切換至訂閱、保固或藥品',
        icon: 'warning',
      });
      return;
    }

    let payload: any;

    if (this.isSubscriptionCategory()) {
      if (this.item.price === null || this.item.price < 0) {
        this.showError('請輸入正確的訂閱金額');
        return;
      }
      if (!this.item.billingCycle) {
        this.showError('請選擇扣款週期');
        return;
      }
      if (!this.item.purchaseDate) {
        this.showError('請選擇購買日期');
        return;
      }
      if (!this.item.trialEndDate) {
        this.showError('請選擇試用結束日');
        return;
      }

      payload = {
        _type: 'subscription',
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
      if (!this.item.purchaseDate) {
        this.showError('請選擇購買日期');
        return;
      }
      if (!this.item.warrantyEndDate) {
        this.showError('請選擇保固到期日');
        return;
      }

      payload = {
        _type: 'warranty',
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
      if (this.item.quantity < 0) {
        this.showError('數量不能小於 0');
        return;
      }
      if (!this.item.unit?.trim()) {
        this.showError('請輸入藥品單位');
        return;
      }
      if (!this.item.expireDate) {
        this.showError('請選擇藥品到期日期');
        return;
      }

      payload = {
        _type: 'medicine',
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
        location: this.item.locationId
          ? this.item.locationId.toString()
          : this.item.location,
        source: this.item.source,
        notify: this.item.notify,
        note: this.item.note,
      };
    } else {
      if (this.item.quantity < 0) {
        this.showError('數量不能小於 0');
        return;
      }
      if (!this.item.locationId) {
        this.showError('請選擇存放位置');
        return;
      }
      if (!this.item.purchaseDate) {
        this.showError('請選擇購買日期');
        return;
      }
      if (!this.item.expireDate) {
        this.showError('請選擇到期日期');
        return;
      }

      payload = {
        _type: 'item',
        ...this.item,
        purchaseDate: this.formatDate(this.item.purchaseDate),
        expireDate: this.formatDate(this.item.expireDate),
        price: this.totalPrice,
        safeQuantity: this.item.safeQuantity ?? 0,
      };
    }

    this.dialogRef.close(payload);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private formatDate(date: any): string {
    if (!date) return '';

    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }

    if (typeof date === 'string' && /^\d{4}\/\d{2}\/\d{2}$/.test(date)) {
      return date.replaceAll('/', '-');
    }

    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
