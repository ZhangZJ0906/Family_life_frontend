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
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  }
];
