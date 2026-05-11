import { Item } from './../../common/interfaceList';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { HttpClientService } from '../../@services/http-client.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-item-list',
  imports: [MatPaginator],
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
  itemList!: Item[];
  dataSource = new MatTableDataSource<Item>(this.itemList);

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
}
