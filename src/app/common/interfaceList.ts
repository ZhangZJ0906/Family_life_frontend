/*物品清單  2026-05-11 by zj */
export interface Item {
  id: number;
  groupId: number;
  categoryId: number;
  createdById: number;
  name: string;
  quantity: number;
  unit: string;
  locationId: number;
  purchaseDate: string; // YYYY-MM-DD
  expireDate: string; // YYYY-MM-DD
  safeQuantity: number;
  unit_price: number; //單價
  price: number; // 總價
  notify: boolean;
  note: string;
  createdAt: string; // ISO 8601 格式
  // souce:string//貨源
}
/*============================================== */
/* 存放地點  && 分類  2026-05-12 by zj */
export interface LocationAndCategory {
  id: number;
  name: string;
  icon?:string,
}
/*============================================ */
/*記帳 2026-05-15 by zj */
export interface ExpenseRecord {
  id: number | null;
  group_id: number;
  user_id: number;
  category_id: number;
  related_item_id: number | null;
  price: number | null;
  expense_date: string;
  note: string;
  created_at?: string;
}

/*============================================ */
