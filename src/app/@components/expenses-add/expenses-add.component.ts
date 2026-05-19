import { Component, Inject } from '@angular/core';
import { HttpClientService } from '../../@services/http-client.service';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { LocationAndCategory } from '../../common/interfaceList';
import Swal from 'sweetalert2';
import { MatDatepickerModule } from "@angular/material/datepicker";
import { provideNativeDateAdapter } from '@angular/material/core';
@Component({
  selector: 'app-expenses-add',
  imports: [
    MatIcon,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatDatepickerModule,
  ],
  templateUrl: './expenses-add.component.html',
  styleUrl: './expenses-add.component.scss',
  providers: [provideNativeDateAdapter()],
})
export class ExpensesAddComponent {
  basicUrl!: string;
  expenseForm!: FormGroup;

  categoryMap: LocationAndCategory[] = []; // 分類對照
  userGroups: any[] = [1, 2]; // 儲存使用者擁有的群組清單
  itemList: any[] = []; // 動態變更的物品清單

  currentUserId = 1; // 目前登入的使用者 ID

  constructor(
    private fb: FormBuilder,
    private http: HttpClientService,
    private dialogRef: MatDialogRef<ExpensesAddComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.basicUrl = this.http.basicUrl;
  }

  ngOnInit(): void {
    // 從主畫面接收傳遞過來的初始共用資料
    if (this.data) {
      this.categoryMap = this.data.categoryMap || [];
      this.userGroups = this.data.userGroups || []; // 💡 記得主畫面要把使用者持有的群組陣列傳進來
    }

    this.initForm();
    this.watchFormChanges(); // 啟動欄位連動監聽器
  }

  /**
   * 初始化表單控制項
   */
  initForm() {
    this.expenseForm = this.fb.group({
      selectedEnvId: [null, Validators.required], // 記帳環境控制項 (0:個人, >0:群組ID)
      expenseDate: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(0)]],
      categoryId: [null, Validators.required],
      related_item_id: [null],
      note: [''],
    });
  }

  /**
   * 監聽表單欄位聯動
   */
  watchFormChanges() {
    // 監聽 1：當「相關物品」切換時，自動帶入名稱並鎖定 note
    this.expenseForm
      .get('related_item_id')
      ?.valueChanges.subscribe((itemId) => {
        const noteControl = this.expenseForm.get('note');
        if (itemId) {
          const selectedItem = this.itemList.find((item) => item.id === itemId);
          if (selectedItem) {
            noteControl?.setValue(selectedItem.name);
            noteControl?.disable(); // 帶入物品名稱，鎖定不讓使用者改
          }
        } else {
          noteControl?.enable(); // 無關聯物品，解除鎖定自由輸入
          noteControl?.setValue('');
        }
      });
  }

  /**
   * 監聽 2：當切換「記帳環境（群組/個人）」時，動態去後端重拉對應的物品清單
   */
  onEnvChange(envId: number) {
    // 先把舊的物品與備註清空，避免錯亂
    this.expenseForm.get('related_item_id')?.setValue(null);
    this.expenseForm.get('note')?.setValue('');
    this.expenseForm.get('note')?.enable();
    this.itemList = [];

    // 去後端重拉清單 (如果是 0 代表個人私帳，傳 null 給後端)
    const groupIdParam = envId === 0 ? null : envId;
    this.loadItemList(groupIdParam, this.currentUserId);
  }

  /**
   * 呼叫後端 API 動態載入物品清單
   */
  loadItemList(groupId: number | null, userId: number) {
    let url = `${this.basicUrl}item/getInfo?userId=${userId}`;
    if (groupId !== null) {
      url += `&groupId=${groupId}`;
    }

    this.http.getApi(url).subscribe({
      next: (res: any) => {
        if (res.code === 200) {
          this.itemList = res.list || []; // 後端依據有無 groupId 回傳群組物品或個人物品
        }
      },
    });
  }

  /**
   * 按下「儲存」送出
   */
  onSave() {
    if (this.expenseForm.invalid) return;

    // ⚠️ 關鍵：使用 getRawValue() 才能抓到被 .disable() 鎖定的 note 欄位值！
    const formValues = this.expenseForm.getRawValue();

    // 建立要送去後端的 payload
    const payload = {
      user_id: this.currentUserId,
      group_id:
        formValues.selectedEnvId === 0 ? null : formValues.selectedEnvId, // 0 轉成 null 送給後端，代表這是私人帳
      categoryId: formValues.categoryId,
      related_item_id: formValues.related_item_id,
      price: formValues.price,
      note: formValues.note,
      expenseDate: this.formatToBackendDate(formValues.expenseDate), // 格式化為 YYYY-MM-DD
    };

    this.http.postApi(this.basicUrl + 'expense/saveInfo', payload).subscribe({
      next: (res: any) => {
        if (res.code != 200) {
          Swal.fire({
            title: '新增錯誤',
            text: res.message || 'Server error',
            icon: 'error',
          });
          return;
        }

        Swal.fire({
          title: '新增成功',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
        this.dialogRef.close(true); // 回傳 true 讓主畫面重新整理 Table
      },
      error: (err) => {
        Swal.fire({
          title: '新增錯誤',
          text: err.message || '網路異常',
          icon: 'error',
        });
      },
    });
  }

  private formatToBackendDate(dateInput: any): string {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
