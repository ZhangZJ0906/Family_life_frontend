import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AddPurchaseItemReq,
  BasicRes,
  CreateListReq,
  PurchaseItemVo,
  ShoppingList
} from '../@models/shopping_list.model';

@Injectable({
  providedIn: 'root'
})
export class ShoppingListService {
  private readonly http = inject(HttpClient);
  private readonly shoppingUrl = 'http://localhost:8080/shopping_lists';

  // 取得目前使用者建立的 shopping lists，用在左側「我的清單」。
  getLists(createrId: number): Observable<ShoppingList[]> {
    return this.http.get<ShoppingList[]>(this.shoppingUrl, {
      params: { createrId }
    });
  }

  create(req: CreateListReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(`${this.shoppingUrl}/create`, req);
  }

  // 後端目前 delete/check 都是 POST + RequestParam，不是 REST DELETE/PUT。
  deleteList(listId: number): Observable<BasicRes> {
    return this.http.post<BasicRes>(
      `${this.shoppingUrl}/delete`,
      null,
      { params: { listId } }
    );
  }

  updateList(req: CreateListReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(`${this.shoppingUrl}/update`, req);
  }

  getItems(listId: number): Observable<PurchaseItemVo[]> {
    return this.http.get<PurchaseItemVo[]>(`${this.shoppingUrl}/items`, {
      params: { listId }
    });
  }

  addItems(req: AddPurchaseItemReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(`${this.shoppingUrl}/items/add`, req);
  }

  deleteItem(listId: number, itemId: number): Observable<BasicRes> {
    return this.http.post<BasicRes>(
      `${this.shoppingUrl}/items/delete`,
      null,
      { params: { listId, itemId } }
    );
  }

  updateCheck(
    listId: number,
    itemId: number,
    check: boolean,
    checkMan: number
  ): Observable<BasicRes> {
    return this.http.post<BasicRes>(
      `${this.shoppingUrl}/items/check`,
      null,
      { params: { listId, itemId, check, checkMan } }
    );
  }
}
