import { Item, LocationAndCategory } from './../../common/interfaceList';
import { MatIconModule } from '@angular/material/icon';
import { MatChipListbox, MatChipOption } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { Component, inject, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { HttpClientService } from '../../@services/http-client.service';
import Swal from 'sweetalert2';
import { MatFormFieldModule } from '@angular/material/form-field'; // 必須匯入
import { MatInputModule } from '@angular/material/input'; // 必須匯入
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ItemListAddDialogComponent } from '../item-list-add-dialog/item-list-add-dialog.component';
import { ItemListEditDialogComponent } from '../item-list-edit-dialog/item-list-edit-dialog.component';
import { MatSelect, MatOption } from '@angular/material/select';
@Component({
  selector: 'app-item-list',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatPaginator,
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipListbox,
    MatChipOption,
    MatSelect,
    MatOption,
  ],
  templateUrl: './item-list.component.html',
  styleUrl: './item-list.component.scss',
})
export class ItemListComponent {
  readonly dialog = inject(MatDialog);
  location: LocationAndCategory[] = [];
  /*群組陣列 */
  userGroups: any[] = [1, 2];
  // 現在的群組
  currentGroupId: number = 0;
  displayedColumns: string[] = [
    'id',
    'name',
    'quantity',
    'totalPrice',
    'price', // 單價
    'expireDate',
    'notify',
  ];
  selectedCategory = '全部';
  categories: LocationAndCategory[] = [];
  itemList: Item[] = [];
  // 初始化 dataSource
  dataSource = new MatTableDataSource<Item>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }
  basicUrl!: string;
  constructor(private http: HttpClientService) {
    this.basicUrl = this.http.basicUrl;

    this.getItemByGroupId(this.userGroups[0]);
  }
  /*TODO 缺少 拿user 資料跟拿user 群組資料 分類資料 通知功能 */
  /*新增物品 */
  openAddDialog() {
    const dialogRef = this.dialog.open(ItemListAddDialogComponent, {
      width: '540px',
      height: '540px',
      data: {
        title: '新增物品',
        location: this.location,
        categories: this.categories,
      },
    });
  }
  /*修改物品 */
  openEditDialog(row: Item) {
    // console.log(row)
    const dialogRef = this.dialog.open(ItemListEditDialogComponent, {
      width: '540px',
      height: '540px',
      data: {
        title: '修改物品資料',
        item: row,
        locationMap: this.location,
        categoriesMap: this.categories,
      },
    });
    /*TODO 更新還沒做 */
    // dialogRef.afterClosed().subscribe((result) => {
    //   if (result) {
    //     this.updateItem(result); // 呼叫更新 API
    //   }
    // });
  }
  /*分類 */
  filterByCategory(catId: number) {
    if (catId === 0) {
      this.dataSource.data = this.itemList;
    } else {
      this.dataSource.data = this.itemList.filter(
        (item) => item.categoryId === catId,
      );
    }
  }
  /*取得DB 物品清單資料 */
  getItemByGroupId(groupId: number) {
    this.currentGroupId = groupId;
    if (this.currentGroupId <= 0) {
      Swal.fire({
        title: 'fail',
        text: '群組ID參數錯誤',
        icon: 'error',
      });
      return;
    }
    this.http
      .getApi(this.basicUrl + `item/getItems?groupId=${this.currentGroupId}`)
      .subscribe({
        next: (res: any) => {
          this.itemList = res.items;
          this.dataSource.data = res.items;

          this.location = Object.entries(res.locationMap).map(([id, name]) => ({
            id: Number(id),
            name: name as string,
          }));
          this.categories = Object.entries(res.categoriesMap).map(
            ([id, name]) => ({
              id: Number(id),
              name: name as string,
            }),
          );

          this.categories.unshift({ id: 0, name: '全部' });
          // console.log(this.dataSource.data);
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

  // 實作搜尋功能
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
