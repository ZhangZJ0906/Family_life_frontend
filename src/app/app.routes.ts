import { Routes } from '@angular/router';
import { GroupPageComponent } from './@group/group-page/group-page.component';
import { CalendarComponent } from './@component/calendar/calendar.component';
import { HomePageComponent } from './@component/home-page/home-page.component';
import { ProfileComponent } from './@component/profile/profile.component';
import { TopbarComponent } from './shared/topbar/topbar.component';
import { ItemListComponent } from './@component/item-list/item-list.component';
import { ExpensesComponent } from './@components/expenses/expenses.component';


export const routes: Routes = [
  {
    path: 'itemList',
    component: ItemListComponent,
    data: { title: '物品清單' },
  },
  {
    path: 'expenses',
    component: ExpensesComponent,
    data: { title: '記帳' },
  },
  {
    path: 'group',
    component: GroupPageComponent,
    data: { title: '群組' },
  },

  {
    path: 'login',
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
  },
  {
    path: 'home-page',
    component: HomePageComponent,
    data: { title: '首頁' },
  },
  { path: 'profile', component: ProfileComponent, data: { title: '個人資訊' } },
  // { path: 'topbar', component: TopbarComponent, data: { title: '物品清單' } },
];
