import axios from 'axios';

// Mercari API base URL - connects through backend proxy
const MERCARI_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export interface MercariItem {
  id: string;
  name: string;
  price: number;
  status: 'on_sale' | 'sold' | string;
  thumbnail: string;
  thumbnails: string[];
  seller_id?: string;
  created?: string;
  updated?: string;
  item_condition_id?: number;
  shipping_payer_id?: number;
  category_id?: number;
  source?: 'mercari' | 'rakuten';
}

export interface MercariItemDetail {
  id: string;
  name: string;
  price: number;
  description: string;
  status: string;
  photos: string[];
  thumbnails: string[];
  num_likes: number;
  num_comments: number;
  created: string | null;
  updated: string | null;
  seller: {
    id: string;
    name: string;
    photo: string;
    num_sell_items: number;
    ratings: {
      good: number;
      normal: number;
      bad: number;
    };
    num_ratings: number;
    quick_shipper: boolean;
  };
  item_condition: {
    id: number;
    name: string;
  };
  item_category: {
    id: number;
    name: string;
  };
  shipping_payer: {
    id: number;
    name: string;
  };
  shipping_method: {
    id: number;
    name: string;
  };
  shipping_from_area: {
    id: number;
    name: string;
  };
  shipping_duration: {
    id: number;
    name: string;
  };
  comments: {
    id: string;
    message: string;
    user: {
      id: string;
      name: string;
      photo: string;
    };
    created: string | null;
  }[];
}

export interface MercariSearchResponse {
  total: number;
  items: MercariItem[];
}

export interface MercariCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
  nameTh: string;
}

// Popular categories for display
export const POPULAR_CATEGORIES: MercariCategory[] = [
  { id: 0, name: 'トレカ', icon: '🃏', color: 'yellow', nameTh: 'การ์ดสะสม' },
  { id: 0, name: 'フィギュア', icon: '🤖', color: 'red', nameTh: 'ฟิกเกอร์' },
  { id: 0, name: 'ぬいぐるみ', icon: '🧸', color: 'pink', nameTh: 'ตุ๊กตา' },
  { id: 0, name: 'アイドル', icon: '⭐', color: 'purple', nameTh: 'ไอดอล' },
  { id: 0, name: 'アニメ', icon: '🎬', color: 'blue', nameTh: 'อนิเมะ' },
  { id: 0, name: 'ゲーム', icon: '🎮', color: 'green', nameTh: 'เกม' },
  { id: 0, name: 'スニーカー', icon: '👟', color: 'gray', nameTh: 'รองเท้า' },
  { id: 0, name: 'バッグ', icon: '👜', color: 'amber', nameTh: 'กระเป๋า' },
];

// Main categories from Mercari
export const MAIN_CATEGORIES: MercariCategory[] = [
  { id: 1, name: 'レディース', icon: '👩', color: 'pink', nameTh: 'เสื้อผ้าผู้หญิง' },
  { id: 2, name: 'メンズ', icon: '👨', color: 'blue', nameTh: 'เสื้อผ้าผู้ชาย' },
  { id: 3, name: 'ベビー・キッズ', icon: '👶', color: 'purple', nameTh: 'เด็ก/ทารก' },
  { id: 4, name: 'インテリア・住まい・小物', icon: '🛋️', color: 'amber', nameTh: 'บ้าน/อินทีเรีย' },
  { id: 5, name: '本・音楽・ゲーム', icon: '📚', color: 'yellow', nameTh: 'หนังสือ/เกม' },
  { id: 1328, name: 'おもちゃ・ホビー・グッズ', icon: '🎮', color: 'red', nameTh: 'ของเล่น/ฮอบบี้' },
  { id: 6, name: 'コスメ・香水・美容', icon: '💄', color: 'fuchsia', nameTh: 'เครื่องสำอาง' },
  { id: 7, name: '家電・スマホ・カメラ', icon: '📱', color: 'indigo', nameTh: 'มือถือ/กล้อง' },
  { id: 8, name: 'スポーツ・レジャー', icon: '⚽', color: 'emerald', nameTh: 'กีฬา/เอาท์ดอร์' },
  { id: 9, name: 'ハンドメイド', icon: '🎨', color: 'cyan', nameTh: 'แฮนด์เมด' },
  { id: 1027, name: 'チケット', icon: '🎫', color: 'orange', nameTh: 'ตั๋ว' },
  { id: 1318, name: '自動車・オートバイ', icon: '🚗', color: 'slate', nameTh: 'รถยนต์' },
  { id: 10, name: 'その他', icon: '📦', color: 'gray', nameTh: 'อื่นๆ' },
];

const mercariApi = axios.create({
  baseURL: MERCARI_API_URL,
  timeout: 30000,
});

export const mercariService = {
  // Search products
  async search(params: {
    keyword?: string;
    category?: number;
    priceMin?: number;
    priceMax?: number;
    sort?: string;
    status?: string;
  }): Promise<MercariSearchResponse> {
    const searchParams = new URLSearchParams();

    if (params.keyword) searchParams.append('q', params.keyword);
    if (params.category) searchParams.append('category', params.category.toString());
    if (params.priceMin) searchParams.append('price_min', params.priceMin.toString());
    if (params.priceMax) searchParams.append('price_max', params.priceMax.toString());
    if (params.sort) searchParams.append('sort', params.sort);
    if (params.status) searchParams.append('status', params.status);

    const response = await mercariApi.get(`/mercari/search?${searchParams.toString()}`);
    return response.data;
  },

  // Get item details
  async getItemDetail(itemId: string): Promise<MercariItemDetail> {
    const response = await mercariApi.get(`/mercari/item?id=${itemId}`);
    return response.data;
  },

  // Get popular/trending items
  async getPopularItems(keyword: string = 'トレカ'): Promise<MercariSearchResponse> {
    return this.search({ keyword, sort: 'created_desc' });
  },

  // Get items by category
  async getByCategory(categoryId: number): Promise<MercariSearchResponse> {
    return this.search({ category: categoryId });
  },

  // Get featured items for homepage
  async getFeaturedItems(): Promise<MercariItem[]> {
    const keywords = ['フィギュア', 'ぬいぐるみ', 'トレカ', 'アニメ'];
    const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
    const response = await this.search({ keyword: randomKeyword, sort: 'created_desc' });
    return response.items.slice(0, 20);
  },
};

export default mercariService;
