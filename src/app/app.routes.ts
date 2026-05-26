import { Routes } from '@angular/router';
import { GroupPageComponent } from './@group/group-page/group-page.component';
import { CalendarComponent } from './@component/calendar/calendar.component';
import { HomePageComponent } from './@component/home-page/home-page.component';
import { ProfileComponent } from './@component/profile/profile.component';
import { TopbarComponent } from './shared/topbar/topbar.component';
import { ItemListComponent } from './@component/item-list/item-list.component';
import { ExpensesComponent } from './@components/expenses/expenses.component';
import { authGuard } from './@guard/auth.guard';

export const routes: Routes = [
  {
    path: 'itemList',
    component: ItemListComponent,
    title: '我的物品清單',
    canActivate: [authGuard], //未登入跳到這頁面會被返回到登入葉面
  },
  {
    path: 'expenses',
    component: ExpensesComponent,
    data: { title: '記帳' },
    canActivate: [authGuard], //未登入跳到這頁面會被返回到登入葉面
  },
  {
    path: 'group',
    component: GroupPageComponent,
    title: '我的群組',
    canActivate: [authGuard], //未登入跳到這頁面會被返回到登入葉面
  },
  {
    path: 'login',
    title: '登入',
    loadComponent: () =>
      import('./@components/login/login.component').then(
        (m) => m.LoginComponent,
      ),
    data: { title: '登入' },
  },
  {
    path: 'shopping-list',
    loadComponent: () =>
      import('./@components/shopping-list/shopping-list.component').then(
        (m) => m.ShoppingListComponent,
      ),
    data: { title: '購物清單' },
    canActivate: [authGuard], //未登入跳到這頁面會被返回到登入葉面
  },
  {
    path: 'purchase-item/:listId',
    loadComponent: () =>
      import('./@components/purchase-item/purchase-item.component').then(
        (m) => m.PurchaseItemComponent,
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./@components/register/register.component').then(
        (m) => m.RegisterComponent,
      ),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
    data: { title: '物品清單' },
  },

  {
    path: 'calendar',
    component: CalendarComponent,
    data: { title: '行事曆' },
    canActivate: [authGuard], //未登入跳到這頁面會被返回到登入葉面
  },
  {
    path: 'home-page',
    component: HomePageComponent,
    data: { title: '首頁' },
    canActivate: [authGuard], //未登入跳到這頁面會被返回到登入葉面
  },
  {
    path: 'profile',
    component: ProfileComponent,
    data: { title: '個人資訊' },
    canActivate: [authGuard], //未登入跳到這頁面會被返回到登入葉面
  },
  {
    path: '**',
    redirectTo: 'home-page', // 或導向 404 頁面
    
  },
];
