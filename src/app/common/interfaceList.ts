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
  price: number;
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
  // icon:string,
}
/*============================================ */