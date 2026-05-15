import { Routes } from '@angular/router';
import { ItemListComponent } from './@components/item-list/item-list.component';
import { ExpensesComponent } from './@components/expenses/expenses.component';

export const routes: Routes = [
  {
    path: 'itemList',
    component: ItemListComponent,
  },
  {
    path: 'expenses',
    component: ExpensesComponent,
  },
];
