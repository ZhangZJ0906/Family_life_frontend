import { Routes } from '@angular/router';
import { CalendarComponent } from './@component/calendar/calendar.component';
import { HomePageComponent } from './@component/home-page/home-page.component';
import { ProfileComponent } from './@component/profile/profile.component';
import { TopbarComponent } from './shared/topbar/topbar.component';
import { ItemListComponent } from './@components/item-list/item-list.component';
import { ExpensesComponent } from './@components/expenses/expenses.component';

export const routes: Routes = [
  {path: 'calendar',component: CalendarComponent},
  {path: 'home-page',component: HomePageComponent},
  {path: 'profile', component: ProfileComponent},
  {path: 'topbar', component: TopbarComponent},



  {
    path: 'itemList',
    component: ItemListComponent,
  },
  {
    path: 'expenses',
    component: ExpensesComponent,
  },
];
