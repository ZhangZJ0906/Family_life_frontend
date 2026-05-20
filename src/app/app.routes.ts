import { Routes } from '@angular/router';



import { GroupPageComponent } from './@group/group-page/group-page.component';
import { CalendarComponent } from './@component/calendar/calendar.component';
import { HomePageComponent } from './@component/home-page/home-page.component';
import { ProfileComponent } from './@component/profile/profile.component';
import { TopbarComponent } from './shared/topbar/topbar.component';
import { ItemListComponent } from './@component/item-list/item-list.component';
import { ExpensesComponent } from './@component/expenses/expenses.component';



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

  },





  {path: 'calendar',component: CalendarComponent},
  {path: 'home-page',component: HomePageComponent},
  {path: 'profile', component: ProfileComponent},
  {path: 'topbar', component: TopbarComponent},
  {path: 'itemList', component: ItemListComponent},
  {path: 'expenses', component: ExpensesComponent},




];
