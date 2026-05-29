import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  AddPurchaseItemReq,
  BasicRes,
  CreateListReq,
  GroupListRes,
  PurchaseItemVo,
  ShoppingList
} from '../@models/shopping_list.model';

@Injectable({
  providedIn: 'root'
})
export class ShoppingListService {
  private readonly http = inject(HttpClient);
  private readonly shoppingUrl = 'http://localhost:8080/shopping_lists';
  private readonly groupUrl = 'http://localhost:8080/family_life';

  getLists(userId: number): Observable<ShoppingList[]> {
    return this.http.get<ShoppingList[]>(this.shoppingUrl, {
      params: { userId }
    });
  }

  getUserGroups(userId: number): Observable<GroupListRes> {
    return this.http.get<GroupListRes>(`${this.groupUrl}/getGroupList`, {
      params: { user_Id: userId }
    });
  }

  create(req: CreateListReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(`${this.shoppingUrl}/create`, req);
  }

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

  updateItem(req: AddPurchaseItemReq): Observable<BasicRes> {
    return this.http.post<BasicRes>(`${this.shoppingUrl}/items/update`, req);
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

  updateAssignedUser(
    listId: number,
    itemId: number,
    userId: number
  ): Observable<BasicRes> {
    return this.http.post<BasicRes>(
      `${this.shoppingUrl}/items/assign`,
      null,
      { params: { listId, itemId, userId } }
    );
  }
}
