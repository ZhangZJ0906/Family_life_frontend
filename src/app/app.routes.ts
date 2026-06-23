import { Routes } from '@angular/router';
import { GroupPageComponent } from './@group/group-page/group-page.component';
import { CalendarComponent } from './@component/calendar/calendar.component';
import { HomePageComponent } from './@component/home-page/home-page.component';
import { ProfileComponent } from './@component/profile/profile.component';
import { ItemListComponent } from './@component/item-list/item-list.component';
import { ExpensesComponent } from './@components/expenses/expenses.component';
import { authGuard } from './@guard/auth.guard';
import { pendingChangesGuard } from './@guard/pending-changes.guard';
import { ChatRoomComponent } from './@group/chat-room/chat-room.component';

export const routes: Routes = [
  // 1️⃣ default
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  // 2️⃣ auth pages
  {
    path: 'login',
    loadComponent: () =>
      import('./@components/login/login.component').then(
        (m) => m.LoginComponent,
      ),
    title: '登入',
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./@components/register/register.component').then(
        (m) => m.RegisterComponent,
      ),
    title: '註冊',
  },

  // 3️⃣ main pages
  {
    path: 'home-page',
    component: HomePageComponent,
    canActivate: [authGuard],
    title: '首頁',
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard, pendingChangesGuard],
    canDeactivate: [pendingChangesGuard],
    title: '個人資料',
  },

  // 4️⃣ shopping / items
  {
    path: 'shopping-list',
    loadComponent: () =>
      import('./@components/shopping-list/shopping-list.component').then(
        (m) => m.ShoppingListComponent,
      ),
    canActivate: [authGuard],
    title: '購物清單',
  },
  {
    path: 'purchase-item/:listId',
    loadComponent: () =>
      import('./@components/purchase-item/purchase-item.component').then(
        (m) => m.PurchaseItemComponent,
      ),
    canDeactivate: [pendingChangesGuard],
    title: '購物清單',
  },
  {
    path: 'edit-item/:listId',
    loadComponent: () =>
      import('./@components/purchase-item/purchase-item.component').then(
        (m) => m.PurchaseItemComponent,
      ),
    title: '修改清單',
  },

  // 5️⃣ item list
  {
    path: 'itemList',
    redirectTo: 'itemList/全部',
    pathMatch: 'full',
    title: '物品清單',
  },
  {
    path: 'itemList/:groupId',
    component: ItemListComponent,
    canActivate: [authGuard],
    title: '物品清單',
  },

  // 6️⃣ calendar
  {
    path: 'calendar',
    redirectTo: 'calendar/full',
    pathMatch: 'full',
    title: '行事曆',
  },
  {
    path: 'calendar/:groupId',
    component: CalendarComponent,
    canActivate: [authGuard],
    title: '行事曆',
  },

  // 7️⃣ others
  {
    path: 'expenses',
    component: ExpensesComponent,
    canActivate: [authGuard],
    title: '記帳',
  },
  {
    path: 'group',
    component: GroupPageComponent,
    canActivate: [authGuard],
    title: '家庭群組',
  },

  //聊天室
  {
    path: 'group-chat/:groupId',
    component: ChatRoomComponent,
  },

  // 8️⃣ fallback（最後一定要）
  {
    path: '**',
    redirectTo: 'home-page',
  },
];
