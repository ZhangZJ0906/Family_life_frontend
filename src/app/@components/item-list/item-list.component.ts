import { Item } from './../../common/interfaceList';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { HttpClientService } from '../../@services/http-client.service';
import Swal from 'sweetalert2';
import { MatFormFieldModule } from '@angular/material/form-field'; // 必須匯入
import { MatInputModule } from '@angular/material/input'; // 必須匯入
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-item-list',
  imports: [
    MatPaginator,
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './item-list.component.html',
  styleUrl: './item-list.component.scss',
})
export class ItemListComponent {
  displayedColumns: string[] = [
    'id',
    'name',
    'quantity',
    'price',
    'expireDate',
  ];

  // 初始化 dataSource
  dataSource = new MatTableDataSource<Item>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }
  basicUrl!: string;
  constructor(private http: HttpClientService) {
    this.basicUrl = this.http.basicUrl;
    this.getItemByGroupId();
  }

  getItemByGroupId() {
    const group = 2;
    this.http
      .getApi(this.basicUrl + `item/getItems?groupId=${group}`)
      .subscribe({
        next: (res: any) => {
          const arr = res.items;
          console.log(arr);
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
