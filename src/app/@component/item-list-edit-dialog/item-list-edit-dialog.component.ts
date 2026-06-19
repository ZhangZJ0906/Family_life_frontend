import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
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
import Swal from 'sweetalert2';
import { CATEGORY_ICON_MAP, DEFAULT_IMAGES } from '../../common/item.const';

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
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  defaultImages = DEFAULT_IMAGES;
  constructor(
    public dialogRef: MatDialogRef<ItemListEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private chr: ChangeDetectorRef,
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
      if (this.item && this.item.avatar) {
        this.imagePreview = this.item.avatar;
      }
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
    return (
      this.item.status === '已到期' ||
      this.item.status === '已逾期扣款' ||
      this.item.status === '已過保'
    );
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      // 使用 FileReader 產生 Base64 供前端預覽
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }
  /**
   * ✨ 核心檢查防呆：控管 HTML 確認按鈕的 [disabled] 狀態
   */
  isSubmitDisabled(): boolean {
    // 1. 如果資料完全沒有變更，直接停用
    if (!this.hasChange && !this.selectedFile) return true;
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
    if (!this.selectedFile) {
      this.selectedFile = this.item.selectedFile;
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
        selectedFile: this.selectedFile,
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
        selectedFile: this.selectedFile,
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
      if (this.item.safeQuantity < 0) {
        this.showError('安全庫存不能小於0');
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
        selectedFile: this.selectedFile,
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
      if (this.item.safeQuantity < 0) {
        this.showError('安全庫存不能小於0');
        return;
      }

      payload = {
        _type: 'item',
        ...this.item,
        purchaseDate: this.formatDate(this.item.purchaseDate),
        expireDate: this.formatDate(this.item.expireDate),
        price: this.totalPrice,
        safeQuantity: this.item.safeQuantity ?? 0,
        selectedFile: this.selectedFile,
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

  //分類跟預設圖片選擇
  openDefaultImageModal(): void {
    const iconMap = CATEGORY_ICON_MAP;

    const usedCategories = [
      ...new Set(this.defaultImages.map((img) => img.category)),
    ];

    // 預設選第一個分類
    const defaultCategory = usedCategories[0];

    const renderImages = (filter: string): string => {
      const items = this.defaultImages.filter((img) => img.category === filter);
      if (!items.length) {
        return `<div class="col-12 text-center text-muted py-4">此分類暫無圖片</div>`;
      }
      return items
        .map(
          (img) => `
          <div class="col-6 col-sm-4 col-md-3">
            <div class="default-img-option d-flex flex-column align-items-center justify-content-center p-2"
                 data-url="${img.url}" data-name="${img.name}"
                 style="border:2px solid #e0e0e0; border-radius:10px; cursor:pointer;
                        transition:all .2s; height:130px; background:#fff;">
              <img src="${img.url}" width="80" height="80"
                   style="object-fit:cover; border-radius:6px;">
              <span style="font-size:12px; color:#555; margin-top:6px; text-align:center;
                           white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%;">
                ${img.name}
              </span>
            </div>
          </div>
        `,
        )
        .join('');
    };

    const chipsHtml = usedCategories
      .map(
        (cat, i) => `
        <div class="cat-chip" data-category="${cat}"
             style="display:inline-flex; align-items:center; gap:4px;
                    padding:6px 14px; border-radius:999px; font-size:14px;
                    border:1px solid ${i === 0 ? '#1976d2' : '#ccc'};
                    background:${i === 0 ? '#1976d2' : '#f5f5f5'};
                    color:${i === 0 ? '#fff' : '#333'};
                    cursor:pointer; transition:all .2s;">
          ${iconMap[cat] ?? ''} ${cat}
        </div>
      `,
      )
      .join('');

    Swal.fire({
      title: '請選擇預設物品圖片',
      width: 'min(720px, 95vw)', // 讓 md grid 有足夠空間
      html: `
<div style="overflow-x: hidden;">   <!-- ✅ 包一層擋掉 row 負 margin -->

      <div id="chip-bar"
           style="display:flex; flex-wrap:wrap; gap:8px;
                  justify-content:center; margin-bottom:16px;">
        ${chipsHtml}
      </div>

      <div style="max-height:400px; overflow-y:auto; overflow-x:hidden; padding:4px;">
        <div id="default-img-container" class="row g-3">
          ${renderImages(defaultCategory)}
        </div>
      </div>

    </div>
    `,
      showConfirmButton: false,
      showCloseButton: true,
      didOpen: () => {
        document
          .getElementById('chip-bar')
          ?.querySelectorAll('.cat-chip')
          .forEach((chip) => {
            chip.addEventListener('click', () => {
              const selected = (chip as HTMLElement).dataset['category']!;

              // chip 樣式重置
              document.querySelectorAll('.cat-chip').forEach((c) => {
                (c as HTMLElement).style.background = '#f5f5f5';
                (c as HTMLElement).style.color = '#333';
                (c as HTMLElement).style.borderColor = '#ccc';
              });
              (chip as HTMLElement).style.background = '#1976d2';
              (chip as HTMLElement).style.color = '#fff';
              (chip as HTMLElement).style.borderColor = '#1976d2';

              // 重新渲染圖片
              const container = document.getElementById(
                'default-img-container',
              )!;
              container.innerHTML = renderImages(selected);
              this.bindImageClick(container);
            });
          });

        this.bindImageClick(document.getElementById('default-img-container')!);
      },
    });
  }
  // 抽出圖片點擊事件，chip 切換後也能重新綁定
  private bindImageClick(container: HTMLElement): void {
    container.querySelectorAll('.default-img-option').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        (el as HTMLElement).style.borderColor = '#1976d2';
        (el as HTMLElement).style.boxShadow = '0 2px 8px rgba(25,118,210,0.2)';
        (el as HTMLElement).style.transform = 'translateY(-2px)';
      });
      el.addEventListener('mouseleave', () => {
        (el as HTMLElement).style.borderColor = '#e0e0e0';
        (el as HTMLElement).style.boxShadow = 'none';
        (el as HTMLElement).style.transform = 'none';
      });
      el.addEventListener('click', async () => {
        const url = (el as HTMLElement).dataset['url']!;
        const name = (el as HTMLElement).dataset['name']!;
        Swal.showLoading();
        await this.selectDefaultImage(url, name);
        Swal.close();
      });
    });
  }

  // 3. 修正後的版本：完全配合你原本的 selectedFile 變數
  async selectDefaultImage(url: string, name: string): Promise<void> {
    try {
      // 抓取前端 assets 的圖片二進位資料
      const response = await fetch(url);
      const blob = await response.blob();

      // 包裝成標準 File 物件
      const file = new File([blob], `${name}.png`, { type: 'image/png' });

      this.selectedFile = file;
      const render = new FileReader();
      render.onload = (e: any) => {
        this.imagePreview = e.target.result;
        this.chr.detectChanges();
      };
      render.readAsDataURL(file);

      const fileInput = document.getElementById('image') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      Swal.fire('錯誤', '無法載入預設圖片', 'error');
    }
  }
}
