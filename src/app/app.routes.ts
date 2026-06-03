import { Routes } from '@angular/router';



import { GroupPageComponent } from './@group/group-page/group-page.component';

import { CalendarComponent } from './@component/calendar/calendar.component';
import { HomePageComponent } from './@component/home-page/home-page.component';
import { ProfileComponent } from './@component/profile/profile.component';

import { ItemListComponent } from './@component/item-list/item-list.component';
import { ExpensesComponent } from './@components/expenses/expenses.component';
import { authGuard } from './@guard/auth.guard';
import { pendingChangesGuard } from './@guard/pending-changes.guard';

export const routes: Routes = [
  // 1️⃣ default
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  // 2️⃣ auth pages
  {
    path: 'login',
    loadComponent: () =>
      import('./@components/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./@components/register/register.component').then(m => m.RegisterComponent),
  },

  // 3️⃣ main pages
  {
    path: 'home-page',
    component: HomePageComponent,
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard, pendingChangesGuard],
    canDeactivate: [pendingChangesGuard],
  },

  // 4️⃣ shopping / items
  {
    path: 'shopping-list',
    loadComponent: () =>
      import('./@components/shopping-list/shopping-list.component')
        .then(m => m.ShoppingListComponent),
    canActivate: [authGuard],
  },
  {
    path: 'purchase-item/:listId',
    loadComponent: () =>
      import('./@components/purchase-item/purchase-item.component')
        .then(m => m.PurchaseItemComponent),
    canDeactivate: [pendingChangesGuard],
  },
  {
    path: 'edit-item/:listId',
    loadComponent: () =>
      import('./@components/purchase-item/purchase-item.component')
        .then(m => m.PurchaseItemComponent),
  },

  // 5️⃣ item list
  {
    path: 'itemList',
    redirectTo: 'itemList/全部',
    pathMatch: 'full',
  },
  {
    path: 'itemList/:groupId',
    component: ItemListComponent,
    canActivate: [authGuard],
  },

  // 6️⃣ calendar
  {
    path: 'calendar',
    redirectTo: 'calendar/full',
    pathMatch: 'full',
  },
  {
    path: 'calendar/:groupId',
    component: CalendarComponent,
    canActivate: [authGuard],
  },

  // 7️⃣ others
  {
    path: 'expenses',
    component: ExpensesComponent,
    canActivate: [authGuard],
  },
  {
    path: 'group',
    component: GroupPageComponent,
    canActivate: [authGuard],
  },

  // 8️⃣ fallback（最後一定要）
  {
    path: '**',
    redirectTo: 'home-page',
  },
];
