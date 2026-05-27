import { CanDeactivateFn } from '@angular/router';

export interface CanComponentDeactivate {
  canDeactivate: () => boolean | Promise<boolean>;
}

export const pendingChangesGuard: CanDeactivateFn<any> = (
  component
) => {

  // 防呆檢查
  if (typeof component.canDeactivate === 'function') {
    return component.canDeactivate();
  }

  return true;
};
