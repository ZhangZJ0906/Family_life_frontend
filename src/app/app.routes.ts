import { Routes } from '@angular/router';
import { ItemListComponent } from './@components/item-list/item-list.component';
import { ExpensesComponent } from './@components/expenses/expenses.component';
import { GroupPageComponent } from './@group/group-page/group-page.component';

export const routes: Routes = [

  {
    path: 'itemList',
    component: ItemListComponent,
  },
  {
    path: 'expenses',
    component: ExpensesComponent,
  },
  {
    path: 'group',
    component: GroupPageComponent,},

 {
    path: 'login',
    loadComponent: () =>
      import('./@components/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'shopping-list',
    loadComponent: () =>
      import('./@components/shopping-list/shopping-list.component').then(
        (m) => m.ShoppingListComponent
      )
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'

  }
];
