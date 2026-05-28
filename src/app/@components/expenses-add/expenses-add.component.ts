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
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import {
  DropDownGroupList,
  LocationAndCategory,
} from '../../common/interfaceList';
import Swal from 'sweetalert2';
import { MatDatepickerModule } from '@angular/material/datepicker';
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
  currentGroupId!: number ;
  today = new Date();
  categoryMap: LocationAndCategory[] = []; // 分類對照
  userGroups: DropDownGroupList[] = []; // 儲存使用者擁有的群組清單
  itemList: any[] = []; // 動態變更的物品清單
  user: any;
  currentUserId: number; // 目前登入的使用者 ID

  constructor(
    private fb: FormBuilder,
    private http: HttpClientService,
    private dialogRef: MatDialogRef<ExpensesAddComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.basicUrl = this.http.basicUrl;
    const raw = sessionStorage.getItem('family-life-current-user'); // ← localStorage 改 sessionStorage
    this.user = JSON.parse(raw!);
    this.currentUserId = this.user.user_id;
  }

  ngOnInit(): void {
    // 從主畫面接收傳遞過來的初始共用資料
    if (this.data) {
      this.categoryMap = this.data.categoryMap || [];
      this.userGroups = this.data.groupList || [];
      this.currentGroupId = this.data.currentGroupId;
    }

    this.initForm();
    this.watchFormChanges(); // 啟動欄位連動監聽器
    const groupId = this.currentGroupId ?? 0;
    this.expenseForm.get('selectedEnvId')?.setValue(groupId);
    this.onEnvChange(groupId); // 觸發拉物品清單
  }

  /**
   * 初始化表單控制項
   */
  initForm() {
    this.expenseForm = this.fb.group({
      // selectedEnvId: [null, Validators.required], // 記帳環境控制項 (0:個人, >0:群組ID)
      selectedEnvId: [null], // 記帳環境控制項 (0:個人, >0:群組ID)
      expenseDate: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(0)]],
      categoryId: [null, Validators.required],
      related_item_id: [null],
      related_item_name: ['', Validators.required], // ✅ 新增，作為消費名稱 snapshot
      note: [''], // ✅ 還原成純備註
    });
  }
  get currentGroupName(): string {
    return (
      this.userGroups.find((g) => g.groupId === this.data.currentGroupId)
        ?.groupName ?? '私人記帳'
    );
  }
  /**
   * 監聽表單欄位聯動
   */
  watchFormChanges() {
    this.expenseForm
      .get('related_item_id')
      ?.valueChanges.subscribe((itemId) => {
        const nameControl = this.expenseForm.get('related_item_name');
        if (itemId) {
          const selectedItem = this.itemList.find((item) => item.id === itemId);
          if (selectedItem) {
            nameControl?.setValue(selectedItem.name); // ✅ snapshot
            nameControl?.disable(); // 鎖定
          }
        } else {
          nameControl?.enable();
          nameControl?.setValue('');
        }
      });
  }

  /**
   * 監聽 2：當切換「記帳環境（群組/個人）」時，動態去後端重拉對應的物品清單
   */
  onEnvChange(envId: number) {
    // 先把舊的物品與備註清空，避免錯亂
    this.expenseForm.get('related_item_id')?.setValue(null);
    this.expenseForm.get('related_item_name')?.setValue('');
    this.expenseForm.get('related_item_name')?.enable();
    this.expenseForm.get('note')?.setValue('');
    this.expenseForm.get('note')?.enable();
    this.itemList = [];

    // 去後端重拉清單 (如果是 0 代表個人私帳，傳 null 給後端)
    const groupIdParam = envId;
    this.getItemList(groupIdParam, this.currentUserId);
  }

  /**
   * 呼叫後端 API 動態載入物品清單
   */
  getItemList(groupId: number | null, userId: number) {
    const resolvedGroupId = groupId ?? 0;
    const url = `${this.basicUrl}item/getItems?userId=${userId}&groupId=${resolvedGroupId}`;

    this.http.getApi(url).subscribe({
      next: (res: any) => {
        if (res.code === 200) {
          this.itemList = res.list || []; // 後端依據有無 groupId 回傳群組物品或個人物品
        }
      },
    });
  }
  private validatePayload(formValues: any): string | null {
    if (!formValues.categoryId) return '請選擇分類';
    if (!formValues.price || formValues.price <= 0) return '請輸入有效金額';
    if (!formValues.expenseDate) return '請選擇日期';

    const selected = new Date(formValues.expenseDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // 今天的最後一刻
    if (selected > today) return '日期不能選未來';

    return null;
  }
  /**
   * 按下「儲存」送出
   */
  onSave() {
    if (this.expenseForm.invalid) return;

    // ⚠️ 關鍵：使用 getRawValue() 才能抓到被 .disable() 鎖定的 note 欄位值！
    const formValues = this.expenseForm.getRawValue();
    const error = this.validatePayload(formValues);
    if (error) {
      Swal.fire({ title: '請檢查輸入', text: error, icon: 'warning' });
      return;
    }
    // 建立要送去後端的 payload
    // group_id: formValues.selectedEnvId === 0 ? null : formValues.selectedEnvId,
    // 要變回 任意選群組就把group_id 改成上面這樣
    const payload = {
      userId: this.currentUserId,
      groupId: this.currentGroupId,
      categoryId: formValues.categoryId,
      relatedItemId: formValues.related_item_id,
      relatedItemName: formValues.related_item_name,
      price: formValues.price,
      note: formValues.note,
      expenseDate: this.formatToBackendDate(formValues.expenseDate),
    };
    // console.log(payload);

    this.http.postApi(this.basicUrl + 'expense/addInfo', payload).subscribe({
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
