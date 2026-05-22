import { Routes } from '@angular/router';
<<<<<<< HEAD
<<<<<<< HEAD
import { GroupPageComponent } from './@group/group-page/group-page.component';

export const routes: Routes = [
<<<<<<< HEAD
  {path:'group',component:GroupPageComponent}
=======
=======
import { GroupPageComponent } from './@group/group-page/group-page.component';
>>>>>>> main
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
    title: '我的物品清單',
  },
  {
    path: 'expenses',
    component: ExpensesComponent,
    data: { title: '記帳' },
  },
  {
    path: 'group',
    component: GroupPageComponent,
    title: '我的群組',
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
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
    data: { title: '物品清單' },
  },

<<<<<<< HEAD


>>>>>>> origin/feature-calendar
=======
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
>>>>>>> 2dcfdd2922ed702026575f2e79bf3d3a598e4c93
=======
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
>>>>>>> main
];
