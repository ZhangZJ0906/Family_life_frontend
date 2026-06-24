import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { TextFieldModule } from '@angular/cdk/text-field';
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
import { addItem, LocationAndCategory } from '../../common/interfaceList';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { HttpClientService } from '../../@services/http-client.service';
import Swal from 'sweetalert2';
import { AuthService } from '../../@services/auth.service';
import { CATEGORY_ICON_MAP, DEFAULT_IMAGES, DEFAULT_ITEM } from '../../common/item.const';

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
    MatDatepickerModule,
    MatSlideToggleModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './item-list-add-dialog.component.html',
  styleUrl: './item-list-add-dialog.component.scss',
})
export class ItemListAddDialogComponent implements OnInit {
  location: LocationAndCategory[] = [];
  categories: LocationAndCategory[] = [];
  minDate: string = '';
  today = new Date();
  selectedFile: File | null = null; //圖片
  basicUrl!: string;
  group: any[] = [];
  item: addItem = { ...DEFAULT_ITEM };

  defaultImages = DEFAULT_IMAGES;

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

    if (this.data?.location) {
      this.location = [...this.data.location];
    }

    if (this.data?.categories) {
      this.categories = [...this.data.categories];
      this.categories.shift(); // 移除「全部」
    }

    if (this.data?.currentGroupId != null) {
      this.item.groupId = this.data.currentGroupId;
    }

    if (this.data?.isSubscriptionMode) {
      const found = this.categories.find((cat) => cat.name === '訂閱');
      if (found) this.item.categoryId = found.id;
    }

    if (this.data?.isWarrantyMode) {
      const found = this.categories.find((cat) => cat.name === '保固');
      if (found) this.item.categoryId = found.id;
    }

    if (this.data?.isMedicineMode) {
      const found = this.categories.find((cat) => cat.name === '藥品');
      if (found) this.item.categoryId = found.id;
    }

    this.applyPrefillItem();
  }
  isSubscriptionCategory(): boolean {
    return (
      this.categories.find(
        (cat) => Number(cat.id) === Number(this.item.categoryId),
      )?.name === '訂閱'
    );
  }

  isWarrantyCategory(): boolean {
    return (
      this.categories.find(
        (cat) => Number(cat.id) === Number(this.item.categoryId),
      )?.name === '保固'
    );
  }

  isMedicineCategory(): boolean {
    return (
      this.categories.find(
        (cat) => Number(cat.id) === Number(this.item.categoryId),
      )?.name === '藥品'
    );
  }
  private applyPrefillItem(): void {
    const prefill = this.data?.prefillItem;
    if (!prefill) return;

    this.item = {
      ...this.item,
      groupId: prefill.groupId ?? this.item.groupId,
      categoryId: prefill.categoryId ?? this.item.categoryId,
      name: prefill.name ?? this.item.name,
      quantity: prefill.quantity ?? this.item.quantity,
      purchaseDate: prefill.purchaseDate ?? this.item.purchaseDate,
      unit: (prefill.unit ?? this.item.unit) || '',
      created_by_id: prefill.assignedUserId ?? this.item.created_by_id,
    };
  }

  get totalPrice(): number {
    return (this.item.unitPrice || 0) * (this.item.quantity || 0);
  }
  //選圖片
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // 限制 1MB
    const maxSize = 1 * 1024 * 1024;

    if (file.size > maxSize) {
      Swal.fire({
        icon: 'warning',
        title: '圖片太大',
        text: '請上傳 1MB 以下的圖片',
        confirmButtonText: '確認',
      });

      // 清空 input
      input.value = '';

      // 清空已選檔案
      this.selectedFile = null;

      return;
    }

    // 檢查通過後才存檔案
    this.selectedFile = file;
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
<div style="overflow-x: hidden;">
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

      // ✅ 修正：你原本宣告存圖片的變數是 selectedFile，直接賦值給它
      this.selectedFile = file;
      // 我們要把原生的檔案輸入框（Input File）清空，避免畫面和資料打架
      const fileInput = document.getElementById('image') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      Swal.fire('錯誤', '無法載入預設圖片', 'error');
    }
  }
  // ✅ 全面補強，四種模式都有完整驗證
  isSubmitDisabled(): boolean {
    if (!this.item.name?.trim()) return true;
    if (this.item.groupId == null) return true;
    if (!this.item.categoryId) return true;

    if (this.isSubscriptionCategory()) {
      if (this.item.unitPrice === null || this.item.unitPrice < 0) return true;
      if (!this.item.billingCycle) return true;
      if (!this.item.purchaseDate) return true;
      if (!this.item.trialEndDate) return true;
      return false;
    }

    if (this.isWarrantyCategory()) {
      if (!this.item.purchaseDate) return true;
      if (!this.item.warrantyEndDate) return true;
      return false;
    }

    if (this.isMedicineCategory()) {
      if (!this.item.unit?.trim()) return true;
      if (!this.item.expireDate) return true;
      if (!this.item.purchaseDate) return true; // 👈 補這行

      return false;
    }

    // 一般物品
    if (!this.item.quantity) return true;
    if (!this.item.locationId) return true;
    if (!this.item.purchaseDate) return true;
    if (!this.item.expireDate) return true;
    return false;
  }

  addItemInfo() {
    if (this.isSubscriptionCategory()) {
      this.addSubscriptionInfo();
      return;
    }
    if (this.isWarrantyCategory()) {
      this.addWarrantyInfo();
      return;
    }
    if (this.isMedicineCategory()) {
      this.addMedicineInfo();
      return;
    }

    const payload = {
      ...this.item,
      price: this.totalPrice,
      userId: this.item.created_by_id,
      purchaseDate: this.formatDate(this.item.purchaseDate),
      expireDate: this.formatDate(this.item.expireDate),
    };

    if (!payload.name?.trim()) {
      this.showError('請輸入物品名稱');
      return;
    }
    if (!payload.unitPrice) {
      this.showError('單價不能為0');
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
    if (!payload.expireDate) {
      this.showError('請選擇到期日期');
      return;
    }
    if ((payload.quantity ?? 0) < 0) {
      this.showError('數量不能小於 0');
      return;
    }
    if (this.item.safeQuantity !== null && this.item.safeQuantity < 0) {
      this.showError('安全庫存量不能小於 0');
      return;
    }

    this.showLoading('新增物品中...');
    const formData = new FormData();

    // 1. 將純 JSON 轉為 Blob 並指定 type 為 application/json 傳給後端的 @RequestPart("req")
    const jsonBlob = new Blob([JSON.stringify(payload)], {
      type: 'application/json',
    });
    formData.append('req', jsonBlob);

    // 2. 如果有選檔案，封裝給後端的 @RequestPart("avatar")
    if (this.selectedFile) {
      formData.append('avatar', this.selectedFile);
    }
    this.http.postApi('item/add', formData).subscribe({
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
      Swal.fire({ title: '成功', text: '物品已新增', icon: 'success' });
      this.dialogRef.close(true);
      return;
    }

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
      .postApi('expense/addInfo', expensePayload)
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
    if ((payload.price ?? 0) < 0 || !payload.price || payload.price <= 0) {
      this.showError('訂閱金額不可小於 0');
      return;
    }
    if (!payload.billingCycle) {
      this.showError('請選擇扣款週期');
      return;
    }
    if (!payload.purchaseDate) {
      this.showError('請選擇購買日期');
      return;
    }
    if (!payload.trialEndDate) {
      this.showError('請選擇試用結束日');
      return;
    }

    this.showLoading('新增訂閱中...');
    //圖片加資料
    const formData = new FormData();

    // 1. 將純 JSON 轉為 Blob 並指定 type 為 application/json 傳給後端的 @RequestPart("req")
    const jsonBlob = new Blob([JSON.stringify(payload)], {
      type: 'application/json',
    });
    formData.append('req', jsonBlob);

    // 2. 如果有選檔案，封裝給後端的 @RequestPart("avatar")
    if (this.selectedFile) {
      formData.append('avatar', this.selectedFile);
    }
    this.http.postApi('subscription/add', formData).subscribe({
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

        const expensePayload = {
          userId: payload.userId,
          groupId: payload.groupId ?? 0,
          categoryId: this.item.categoryId,
          relatedItemId: res?.itemId ?? res?.id ?? res?.data?.id ?? null,
          relatedItemName: payload.name,
          price: payload.price,
          note: payload.note || '由訂閱自動建立',
          expenseDate: payload.purchaseDate,
        };

        this.http
          .postApi('expense/addInfo', expensePayload)
          .subscribe({
            next: (expRes: any) => {
              if (expRes.code != 200) {
                Swal.fire({
                  title: '訂閱已新增，記帳建立失敗',
                  text: expRes.message || 'Server error',
                  icon: 'warning',
                });
                this.dialogRef.close(true);
                return;
              }
              Swal.fire({
                title: '成功',
                text: '訂閱與記帳已新增',
                icon: 'success',
              });
              this.dialogRef.close(true);
            },
            error: (err: any) => {
              Swal.fire({
                title: '訂閱已新增，記帳建立失敗',
                text: err.message || 'Server error',
                icon: 'warning',
              });
              this.dialogRef.close(true);
            },
          });
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
    if (payload.groupId == null) {
      this.showError('請選擇所屬群組');
      return;
    }
    if ((payload.price ?? 0) < 0 || !payload.price || payload.price <= 0) {
      this.showError('物品金額不可小於 0');
      return;
    }
    if (!payload.purchaseDate) {
      this.showError('請選擇購買日期');
      return;
    }
    if (!payload.warrantyEndDate) {
      this.showError('請選擇保固到期日');
      return;
    }

    this.showLoading('新增保固中...');
    const formData = new FormData();

    // 1. 將純 JSON 轉為 Blob 並指定 type 為 application/json 傳給後端的 @RequestPart("req")
    const jsonBlob = new Blob([JSON.stringify(payload)], {
      type: 'application/json',
    });
    formData.append('req', jsonBlob);

    // 2. 如果有選檔案，封裝給後端的 @RequestPart("avatar")
    if (this.selectedFile) {
      formData.append('avatar', this.selectedFile);
    }
    this.http.postApi('warranty/add', formData).subscribe({
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
        const expensePayload = {
          userId: payload.userId,
          groupId: payload.groupId ?? 0,
          categoryId: this.item.categoryId,
          relatedItemId: res?.itemId ?? res?.id ?? res?.data?.id ?? null,
          relatedItemName: payload.productName,
          price: payload.price,
          note: payload.note || '由保固自動建立',
          expenseDate: payload.purchaseDate,
        };

        this.http
          .postApi('expense/addInfo', expensePayload)
          .subscribe({
            next: (expRes: any) => {
              if (expRes.code != 200) {
                Swal.fire({
                  title: '保固已新增，記帳建立失敗',
                  text: expRes.message || 'Server error',
                  icon: 'warning',
                });
                this.dialogRef.close(true);
                return;
              }
              Swal.fire({
                title: '成功',
                text: '保固與記帳已新增',
                icon: 'success',
              });
              this.dialogRef.close(true);
            },
            error: (err: any) => {
              Swal.fire({
                title: '保固已新增，記帳建立失敗',
                text: err.message || 'Server error',
                icon: 'warning',
              });
              this.dialogRef.close(true);
            },
          });
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
      quantity: this.item.quantity || 0,
      unit: this.item.unit,
      price: (this.item.unitPrice || 0) * (this.item.quantity || 0),
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
    if (!payload.unitPrice) {
      this.showError('藥品價格不能是0');
      return;
    }
    if (payload.quantity <= 0) {
      this.showError('請輸入藥品數量');
      return;
    }
    if (!payload.unit?.trim()) {
      this.showError('請選擇藥品單位');
      return;
    }
    if (this.item.safeQuantity !== null && this.item.safeQuantity < 0) {
      this.showError('安全庫存量不能小於 0');
      return;
    }
    if (!payload.purchaseDate) {
      this.showError('請選擇購買日期');
      return;
    }
    if (!payload.expireDate) {
      this.showError('請選擇藥品到期日');
      return;
    }
    if (!payload.unitPrice || payload.unitPrice <= 0) {
      this.showError('請輸入藥品單價');
      return;
    }
    this.showLoading('新增藥品中...');
    const formData = new FormData();

    // 1. 將純 JSON 轉為 Blob 並指定 type 為 application/json 傳給後端的 @RequestPart("req")
    const jsonBlob = new Blob([JSON.stringify(payload)], {
      type: 'application/json',
    });
    formData.append('req', jsonBlob);

    // 2. 如果有選檔案，封裝給後端的 @RequestPart("avatar")
    if (this.selectedFile) {
      formData.append('avatar', this.selectedFile);
    }

    this.http.postApi('medicine/add', formData).subscribe({
      next: (res: any) => {
        Swal.close();
        if (res.code != 200) {
          Swal.fire('錯誤', res.message || 'Server error', 'error');
          return;
        }

        const expensePayload = {
          userId: payload.userId,
          groupId: payload.groupId ?? 0,
          categoryId: this.item.categoryId,
          relatedItemId: res?.itemId ?? res?.id ?? res?.data?.id ?? null,
          relatedItemName: payload.name,
          price: payload.price,
          note: payload.note || '由藥品自動建立',
          expenseDate: payload.purchaseDate,
        };

        this.http
          .postApi('expense/addInfo', expensePayload)
          .subscribe({
            next: (expRes: any) => {
              if (expRes.code != 200) {
                Swal.fire(
                  '藥品已新增，記帳建立失敗',
                  expRes.message || 'Server error',
                  'warning',
                );
                this.dialogRef.close(true);
                return;
              }
              Swal.fire('成功', '藥品與記帳已新增', 'success');
              this.dialogRef.close(true);
            },
            error: (err: any) => {
              Swal.fire(
                '藥品已新增，記帳建立失敗',
                err.message || 'Server error',
                'warning',
              );
              this.dialogRef.close(true);
            },
          });
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

  private showLoading(message: string = '處理中...'): void {
    Swal.fire({
      title: message,
      text: '請稍候',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });
  }
}
