
import { DefaultImage,addItem } from './interfaceList';

//預設圖片
export const DEFAULT_IMAGES: DefaultImage[] = [
  // ==========================================
  // 1. 食品類 (food)
  // ==========================================
  { name: '雞蛋', url: 'assets/item/eggs.png', category: '食品' },
  { name: '牛奶,乳製品', url: 'assets/item/milk.png', category: '食品' },
  { name: '新鮮蔬菜', url: 'assets/item/vegetable.png', category: '食品' },
  { name: '新鮮水果', url: 'assets/item/fruits.png', category: '食品' },
  { name: '肉類,海鮮', url: 'assets/item/meat.png', category: '食品' },
  { name: '白飯', url: 'assets/item/rice.png', category: '食品' },
  { name: '泡麵', url: 'assets/item/noodles.png', category: '食品' },
  {
    name: '零食,餅乾,糖果',
    url: 'assets/item/candies.png',
    category: '食品',
  },
  { name: '麵包,吐司', url: 'assets/item/bread.png', category: '食品' },
  {
    name: '咖啡豆,茶包',
    url: 'assets/item/coffee-bag.png',
    category: '食品',
  },
  {
    name: '飲料,礦泉水',
    url: 'assets/item/soft-drink.png',
    category: '食品',
  },
  { name: '醬油,調味料', url: 'assets/item/ketchup.png', category: '食品' },

  // ==========================================
  // 2. 藥品類 (medicine)
  // ==========================================
  {
    name: '眼藥水',
    url: 'assets/item/eye-drop.png',
    category: '藥品',
  },
  {
    name: '維他命,保健食品',
    url: 'assets/item/vitamin-c.png',
    category: '藥品',
  },
  {
    name: 'OK繃,紗布,繃帶',
    url: 'assets/item/band-aid.png',
    category: '藥品',
  },
  {
    name: '棉花棒,醫療膠帶',
    url: 'assets/item/cotton-swabs.png',
    category: '藥品',
  },
  {
    name: '防蚊液',
    url: 'assets/item/insect-repellent.png',
    category: '藥品',
  },
  { name: '優碘', url: 'assets/item/bottle.png', category: '藥品' },
  { name: '耳溫槍', url: 'assets/item/medical.png', category: '藥品' },
  { name: '一般藥品', url: 'assets/item/medicine.png', category: '藥品' },

  // ==========================================
  // 3. 日用品類 (daily)
  // ==========================================
  {
    name: '衛生紙,袖珍包',
    url: 'assets/item/tissue-box.png',
    category: '日用品',
  },
  { name: '牙膏', url: 'assets/item/toothpaste.png', category: '日用品' },
  {
    name: '洗髮精,沐浴乳',
    url: 'assets/item/shampoo.png',
    category: '日用品',
  },
  {
    name: '面部保養',
    url: 'assets/item/facial.png',
    category: '日用品',
  },
  { name: '垃圾袋', url: 'assets/item/recyclable.png', category: '日用品' },

  // ==========================================
  // 4. 訂閱類 (subscription)
  // ==========================================
  {
    name: 'Netflix',
    url: 'assets/item/netflix.png',
    category: '訂閱',
  },
  {
    name: 'Spotify',
    url: 'assets/item/spotify.png',
    category: '訂閱',
  },
  {
    name: ' Google driver',
    url: 'assets/item/Google_Drive.png',
    category: '訂閱',
  },
  {
    name: ' iCloud',
    url: 'assets/item/icloud.png',
    category: '訂閱',
  },
  {
    name: 'Adobe',
    url: 'assets/item/logo.png',
    category: '訂閱',
  },
  {
    name: 'Microsoft 365',
    url: 'assets/item/office.png',
    category: '訂閱',
  },
  {
    name: '健身房會員',
    url: 'assets/item/gym.png',
    category: '訂閱',
  },
  {
    name: 'Foodpanda',
    url: 'assets/item/foodPanda.png',
    category: '訂閱',
  },
  {
    name: 'uberEats',
    url: 'assets/item/uberEats.png',
    category: '訂閱',
  },
  {
    name: 'ChatGPT',
    url: 'assets/item/chatGpt.png',
    category: '訂閱',
  },
  {
    name: 'claude',
    url: 'assets/item/Claude.jpg',
    category: '訂閱',
  },
  {
    name: 'gemini',
    url: 'assets/item/gemini.png',
    category: '訂閱',
  },
  // ==========================================
  // 5. 清潔用品類 (cleaning)
  // ==========================================
  {
    name: '洗衣用品',
    url: 'assets/item/detergent.png',
    category: '清潔用品',
  },
  { name: '洗碗精', url: 'assets/item/dish-soap.png', category: '清潔用品' },
  {
    name: '菜瓜布',
    url: 'assets/item/sponge.png',
    category: '清潔用品',
  },
  {
    name: '衛浴清潔用品',
    url: 'assets/item/images.jpg',
    category: '清潔用品',
  },

  // ==========================================
  // 6. 保固類 (warranty)
  // ==========================================
  {
    name: '平板電腦',
    url: 'assets/item/tablet.png',
    category: '保固',
  },
  {
    name: '智慧型手機',
    url: 'assets/item/smartphone.png',
    category: '保固',
  },
  {
    name: '筆記型電腦',
    url: 'assets/item/laptop.png',
    category: '保固',
  },
  {
    name: '桌上型電腦',
    url: 'assets/item/computer.png',
    category: '保固',
  },
  { name: '螢幕,電視', url: 'assets/item/monitor.png', category: '保固' },
  { name: '相機,鏡頭', url: 'assets/item/camera.png', category: '保固' },
  { name: '智慧手錶', url: 'assets/item/health.png', category: '保固' },
];
//預設Icon
export const CATEGORY_ICON_MAP: Record<string, string> = {
  食品: '🥬',
  藥品: '💊',
  日用品: '🧴',
  訂閱: '💳',
  清潔用品: '🧽',
  保固: '🛡️',
};
//item List table 設定
export enum TableMode {
  Item = 'item',
  Subscription = 'subscription',
  Warranty = 'warranty',
  Medicine = 'medicine',
  GlobalSearch = 'global',
}
export const COLUMN_CONFIG: Record<TableMode, string[]> = {
  [TableMode.Item]: [
    'select',
    'name',
    'quantity',
    'unitPrice',
    'price',
    'expireDate',
    'status',
    'avatar',
    'notify',
    'actions',
  ],
  [TableMode.Subscription]: [
    'select',
    'name',
    'price',
    'billingCycle',
    'trialEndDate',
    'nextBillingDate',
    'status',
    'avatar',
    'notify',
    'actions',
  ],
  [TableMode.Warranty]: [
    'select',
    'productName',
    'price',
    'brand',
    'model',
    'serialNumber',
    'purchaseDate',
    'warrantyEndDate',
    'status',
    'avatar',
    'notify',
    'actions',
  ],
  [TableMode.Medicine]: [
    'select',
    'name',
    'medicineType',
    'quantity',
    'price',
    'expireDate',
    'usageMethod',
    'status',
    'avatar',
    'notify',
    'actions',
  ],
  [TableMode.GlobalSearch]: [
    'select',
    '_typeName',
    'name',
    'price',
    'expireOrEndDate',
    'status',
    'avatar',
    'actions',
  ],
};

export const DEFAULT_ITEM: addItem = {
  created_by_id: 1,
  groupId: 1,
  locationId: 1,
  categoryId: 1,
  name: '',
  quantity: null,
  unit: '',
  unitPrice: null,
  price: null,
  safeQuantity: 0,
  purchaseDate: '',
  expireDate: '',
  notify: true,
  note: '',
  billingCycle: '每月',
  trialEndDate: '',
  nextBillingDate: '',
  brand: '',
  model: '',
  serialNumber: '',
  warrantyEndDate: '',
  storeName: '',
  medicineType: '',
  dosage: '',
  usageMethod: '',
  source: '',
};
