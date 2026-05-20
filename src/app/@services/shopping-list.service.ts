import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AddPurchaseItemReq,
  BasicRes,
  CreateListReq,
  PurchaseItemVo
} from '../@models/shopping_list.model';


@Injectable({
  providedIn: 'root'
})
export class ShoppingListService {

  private http = inject(HttpClient);

  private shoppingUrl = 'http://localhost:8080/shopping_lists';

  /** 新增購物清單 */
  create(req: CreateListReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(`${this.shoppingUrl}/create`, req);
  }

  /** 刪除購物清單 */
  deleteList(listId: number): Observable<BasicRes> {
    return this.http.delete<BasicRes>(`${this.shoppingUrl}/delete/${listId}`);
  }

  /** 修改購物清單 */
  updateList(req: CreateListReq): Observable<BasicRes> {
    return this.http.put<BasicRes>(`${this.shoppingUrl}/update`, req);
  }

  /** 取得購物項目 */
  getItems(listId: number): Observable<PurchaseItemVo[]> {
    return this.http.get<PurchaseItemVo[]>(
      'http://localhost:8080/shopping_lists/items',
      { params: { listId: listId } });
  }

  /** 新增購物項目 */
  addItems(req: AddPurchaseItemReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(`${this.shoppingUrl}/items/add`, req);
  }

  /** 刪除購物項目 */
  deleteItem(listId: number, itemId: number): Observable<BasicRes> {
    return this.http.delete<BasicRes>(
      `${this.shoppingUrl}/items/${listId}/${itemId}`
    );
  }

  /** 勾選 / 取消勾選 */
  updateCheck(
    listId: number,
    itemId: number,
    check: boolean,
    checkMan: number
  ): Observable<BasicRes> {

    return this.http.put<BasicRes>(
      `${this.shoppingUrl}/check`,
      {
        listId,
        itemId,
        check,
        checkMan
      }
    );
  }
}
