import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // 將 'token' 換成您 sessionStorage 實際存放的欄位名稱
  const isLoggedIn = sessionStorage.getItem('isLogin');

  if (isLoggedIn) {
    return true;
  }

  // 未登入則導回登入頁
  router.navigate(['/login']);
  return false;
};
