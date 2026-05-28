import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotifySettingService {

  // 使用者名稱
  private nameSubject = new BehaviorSubject<string>('');
  nameSubject$ = this.nameSubject.asObservable();

  // 到期通知
  private notifyByEndDateSubject = new BehaviorSubject<boolean>(true);
  notifyByEndDate$ = this.notifyByEndDateSubject.asObservable();

  // Email 通知
  private notifyByEmailSubject = new BehaviorSubject<boolean>(true);
  notifyByEmail$ = this.notifyByEmailSubject.asObservable();

  // 更新名稱
  setName(value: string) {
    this.nameSubject.next(value);
  }

  // 更新到期通知
  setNotifyByEndDate(value: boolean) {
    this.notifyByEndDateSubject.next(value);
  }

  // 更新 email 通知
  setNotifyByEmail(value: boolean) {
    this.notifyByEmailSubject.next(value);
  }
}
