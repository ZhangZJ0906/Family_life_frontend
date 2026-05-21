export interface ShoppingList {
  id: number;
  // GROUP_FEATURE: group_id 是 groups 表的 foreign key。
  // 目前建立清單可選「無」，所以這裡允許 null；之後接群組功能時改成帶實際 group_id。
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
}

export interface CreateListReq {
  shoppingList: ShoppingList;
  // 清單可以純建立，購物項目會在 PurchaseItemComponent 裡新增。
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
