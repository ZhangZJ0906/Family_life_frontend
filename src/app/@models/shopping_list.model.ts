export interface ShoppingList {
  id: number;
  group_id: number | null;
  title: string;
  createrId: number;
  createdDate?: string;
}

export interface PurchaseItemVo {
  userId: number;
  categoryId: number;
  item: string;
  quantity: number;
  listId: number;
  id: number;
  check: boolean;
  checkDate?: string;
  checkMan?: number;
}

export interface CreateListReq {
  shoppingList: ShoppingList;
  purchaseItemVoList: PurchaseItemVo[];
}

export interface AddPurchaseItemReq {
  listId: number;
  createrId: number;
  purchaseItemVoList: PurchaseItemVo[];
}

export interface BasicRes {
  code: number;
  message: string;
}

export interface GroupListRes {
  code: number;
  message?: string;
  groupIdList?: Record<string, string>;
}
