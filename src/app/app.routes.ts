import { Routes } from '@angular/router';
import { ItemListComponent } from './@components/item-list/item-list.component';

export const routes: Routes = [
  {
    path: 'itemList',
    component: ItemListComponent,
  },
  {
    path: '', // 當網址為空時
    redirectTo: 'itemList', // 自動跳轉到 itemList
    pathMatch: 'full',
  },
];
