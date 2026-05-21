import { Routes } from '@angular/router';

export const routes: Routes = [
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
    path: 'purchase-item/:listId',
    loadComponent: () =>
      import('./@components/purchase-item/purchase-item.component').then(
        (m) => m.PurchaseItemComponent
      )
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./@components/register/register.component').then(
        (m) => m.RegisterComponent
      )
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  }
];
