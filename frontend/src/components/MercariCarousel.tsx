import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Flame,
  ShoppingBag,
  X,
  Heart,
  Search,
  Gamepad2,
  Shirt,
  Sparkles,
  Music,
  ShoppingCart,
  Send,
  Pause,
  Play,
  Star,
  MapPin,
  Clock,
  Truck,
  User,
  MessageCircle,
  ThumbsUp,
  Copy,
  Check,
} from 'lucide-react';
import { mercariService, POPULAR_CATEGORIES } from '../services/mercariService';
import type { MercariItem, MercariItemDetail } from '../services/mercariService';

interface MercariCarouselProps {
  title?: string;
  subtitle?: string;
  keyword?: string;
  showCategories?: boolean;
}

const JPY_TO_THB = 0.25;

// Japanese to Thai translations
const CONDITION_MAP: Record<string, string> = {
  '新品、未使用': 'ใหม่ ไม่เคยใช้',
  '未使用に近い': 'เกือบใหม่',
  '目立った傷や汚れなし': 'ไม่มีรอยหรือคราบเห็นชัด',
  'やや傷や汚れあり': 'มีรอยหรือคราบเล็กน้อย',
  '傷や汚れあり': 'มีรอยหรือคราบ',
  '全体的に状態が悪い': 'สภาพไม่ดี',
};

const SHIPPING_PAYER_MAP: Record<string, string> = {
  '送料込み(出品者負担)': 'ผู้ขายจ่ายค่าส่ง',
  '着払い(購入者負担)': 'ผู้ซื้อจ่ายค่าส่ง',
};

const SHIPPING_DURATION_MAP: Record<string, string> = {
  '1~2日で発送': 'จัดส่งใน 1-2 วัน',
  '2~3日で発送': 'จัดส่งใน 2-3 วัน',
  '4~7日で発送': 'จัดส่งใน 4-7 วัน',
};

const AREA_MAP: Record<string, string> = {
  '未定': 'ยังไม่ระบุ',
  '北海道': 'ฮอกไกโด',
  '青森県': 'อาโอโมริ',
  '岩手県': 'อิวาเตะ',
  '宮城県': 'มิยางิ',
  '秋田県': 'อากิตะ',
  '山形県': 'ยามากาตะ',
  '福島県': 'ฟุกุชิมะ',
  '茨城県': 'อิบารากิ',
  '栃木県': 'โทจิงิ',
  '群馬県': 'กุมมะ',
  '埼玉県': 'ไซตามะ',
  '千葉県': 'ชิบะ',
  '東京都': 'โตเกียว',
  '神奈川県': 'คานากาวะ',
  '新潟県': 'นีงาตะ',
  '富山県': 'โทยามะ',
  '石川県': 'อิชิกาวะ',
  '福井県': 'ฟุกุอิ',
  '山梨県': 'ยามานาชิ',
  '長野県': 'นากาโน',
  '岐阜県': 'กิฟุ',
  '静岡県': 'ชิซุโอกะ',
  '愛知県': 'ไอจิ',
  '三重県': 'มิเอะ',
  '滋賀県': 'ชิงะ',
  '京都府': 'เกียวโต',
  '大阪府': 'โอซาก้า',
  '兵庫県': 'เฮียวโงะ',
  '奈良県': 'นารา',
  '和歌山県': 'วากายามะ',
  '鳥取県': 'ทตโตริ',
  '島根県': 'ชิมาเนะ',
  '岡山県': 'โอกายามะ',
  '広島県': 'ฮิโรชิม่า',
  '山口県': 'ยามากุจิ',
  '徳島県': 'โทคุชิมะ',
  '香川県': 'คากาวะ',
  '愛媛県': 'เอฮิเมะ',
  '高知県': 'โคจิ',
  '福岡県': 'ฟุกุโอกะ',
  '佐賀県': 'ซากะ',
  '長崎県': 'นางาซากิ',
  '熊本県': 'คุมาโมโตะ',
  '大分県': 'โออิตะ',
  '宮崎県': 'มิยาซากิ',
  '鹿児島県': 'คาโกชิมา',
  '沖縄県': 'โอกินาว่า',
};

// Translate Japanese text
const translateJP = (text: string | undefined, maps: Record<string, string>[]): string => {
  if (!text) return '-';
  for (const map of maps) {
    if (map[text]) return map[text];
  }
  return text;
};

// Icon mapping for categories (no emojis)
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'トレカ': <Sparkles className="w-5 h-5" />,
  'フィギュア': <Gamepad2 className="w-5 h-5" />,
  'ぬいぐるみ': <Heart className="w-5 h-5" />,
  'アイドル': <Music className="w-5 h-5" />,
  'アニメ': <Sparkles className="w-5 h-5" />,
  'ゲーム': <Gamepad2 className="w-5 h-5" />,
  'スニーカー': <Shirt className="w-5 h-5" />,
  'バッグ': <ShoppingBag className="w-5 h-5" />,
};

// Random keywords for variety
const RANDOM_KEYWORDS = [
  'フィギュア',
  'ぬいぐるみ',
  'トレカ',
  'アニメ',
  'ポケモン',
  'Nintendo',
  'PlayStation',
  'ワンピース',
  '鬼滅の刃',
  '呪術廻戦',
];

const MercariCarousel = ({
  title = 'สินค้าจาก Mercari',
  subtitle = 'Mercari Products',
  keyword,
  showCategories = true,
}: MercariCarouselProps) => {
  const [items, setItems] = useState<MercariItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    keyword || RANDOM_KEYWORDS[Math.floor(Math.random() * RANDOM_KEYWORDS.length)]
  );
  const [selectedItem, setSelectedItem] = useState<MercariItem | null>(null);
  const [itemDetail, setItemDetail] = useState<MercariItemDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  // Fetch items
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await mercariService.search({
          keyword: selectedCategory,
          sort: 'created_desc',
        });
        // Shuffle items for variety
        const shuffled = [...response.items].sort(() => Math.random() - 0.5);
        setItems(shuffled.slice(0, 30));
      } catch (err) {
        setError('ไม่สามารถโหลดสินค้าได้');
        console.error('Failed to fetch Mercari items:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [selectedCategory]);

  // Fetch item detail when modal opens
  useEffect(() => {
    if (!selectedItem) {
      setItemDetail(null);
      setCurrentImageIndex(0);
      return;
    }

    const fetchDetail = async () => {
      setLoadingDetail(true);
      try {
        const detail = await mercariService.getItemDetail(selectedItem.id);
        setItemDetail(detail);
      } catch (err) {
        console.error('Failed to fetch item detail:', err);
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchDetail();
  }, [selectedItem]);

  // Smooth infinite scroll animation
  useEffect(() => {
    if (loading || items.length === 0 || isPaused) return;

    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollPosition = 0;
    const scrollSpeed = 0.5;

    const animate = () => {
      if (isPaused) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      scrollPosition += scrollSpeed;
      const contentWidth = scrollContainer.scrollWidth / 2;

      if (scrollPosition >= contentWidth) {
        scrollPosition = 0;
      }

      scrollContainer.scrollLeft = scrollPosition;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [loading, items.length, isPaused]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP').format(price);
  };

  const toTHB = (jpy: number) => {
    return Math.round(jpy * JPY_TO_THB);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSelectedCategory(searchQuery);
    setShowSearch(false);
    setSearchQuery('');
  };

  const handleOrderInquiry = (item: MercariItem | MercariItemDetail) => {
    window.open(`https://line.me/R/ti/p/@279jlkpc?oat_content=url&ts=10030235`, '_blank');
  };

  const handleRandomize = () => {
    const randomKeyword = RANDOM_KEYWORDS[Math.floor(Math.random() * RANDOM_KEYWORDS.length)];
    setSelectedCategory(randomKeyword);
  };

  const handleCopyLink = (itemId: string) => {
    navigator.clipboard.writeText(`https://jp.mercari.com/item/${itemId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get images array
  const getImages = () => {
    if (itemDetail?.photos && itemDetail.photos.length > 0) {
      return itemDetail.photos;
    }
    if (itemDetail?.thumbnails && itemDetail.thumbnails.length > 0) {
      return itemDetail.thumbnails;
    }
    if (selectedItem?.thumbnails && selectedItem.thumbnails.length > 0) {
      return selectedItem.thumbnails;
    }
    return selectedItem?.thumbnail ? [selectedItem.thumbnail] : [];
  };

  // Duplicate items for seamless infinite scroll
  const displayItems = [...items, ...items];

  return (
    <section className="py-12 bg-gradient-to-br from-orange-50 via-white to-amber-50 rounded-[2rem] mx-2 md:mx-4 my-8 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="flex flex-col md:flex-row md:items-center md:justify-between mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="mb-4 md:mb-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-lg overflow-hidden">
                <img src="/brands/mercari.png" alt="Mercari" className="w-10 h-10 object-contain" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-400">{subtitle}</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`p-2.5 rounded-full transition-all ${
                isPaused
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 shadow-md hover:shadow-lg hover:bg-gray-50'
              }`}
              title={isPaused ? 'เล่นต่อ' : 'หยุด'}
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>

            <button
              onClick={handleRandomize}
              className="p-2.5 rounded-full bg-white text-gray-600 shadow-md hover:shadow-lg hover:bg-gray-50 transition-all"
              title="สุ่มสินค้าใหม่"
            >
              <Sparkles className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2.5 rounded-full transition-all ${
                showSearch
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 shadow-md hover:shadow-lg hover:bg-gray-50'
              }`}
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              onClick={() => { setIsPaused(true); scroll('left'); }}
              className="p-2.5 rounded-full bg-white shadow-md hover:shadow-lg hover:bg-gray-50 transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => { setIsPaused(true); scroll('right'); }}
              className="p-2.5 rounded-full bg-white shadow-md hover:shadow-lg hover:bg-gray-50 transition-all"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </motion.div>

        {/* Search Bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="ค้นหาสินค้า... (เช่น Pokemon, Nintendo, Anime)"
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                />
                <button
                  onClick={handleSearch}
                  className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/30"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Pills */}
        {showCategories && (
          <motion.div
            className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            {POPULAR_CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all duration-300 ${
                  selectedCategory === cat.name
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-600 shadow-sm'
                }`}
              >
                {CATEGORY_ICONS[cat.name] || <ShoppingBag className="w-5 h-5" />}
                <span className="text-sm font-medium">{cat.nameTh}</span>
              </button>
            ))}
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-20">
            <p className="text-gray-500">{error}</p>
            <button
              onClick={() => setSelectedCategory(selectedCategory)}
              className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition"
            >
              ลองใหม่
            </button>
          </div>
        )}

        {/* Products Carousel */}
        {!loading && !error && items.length > 0 && (
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-hidden pb-4"
          >
            {displayItems.map((item, index) => (
              <motion.div
                key={`${item.id}-${index}`}
                className="flex-shrink-0 w-52 md:w-60 bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(index * 0.02, 0.2) }}
                whileHover={{ y: -5 }}
                onClick={() => setSelectedItem(item)}
              >
                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ShoppingBag className="w-12 h-12" />
                    </div>
                  )}

                  {item.status === 'sold' && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="px-4 py-1.5 bg-red-500 text-white text-xs font-bold rounded-full">
                        SOLD OUT
                      </span>
                    </div>
                  )}

                  <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded-md flex items-center gap-1">
                    <img src="/brands/mercari.png" alt="Mercari" className="w-4 h-4 object-contain" />
                    Mercari
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                    <span className="flex items-center gap-2 text-white text-sm font-medium bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                      <Search className="w-4 h-4" />
                      ดูรายละเอียด
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-800 line-clamp-2 h-10 leading-5 mb-2">
                    {item.name}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-orange-600">
                      ¥{formatPrice(item.price)}
                    </span>
                  </div>
                  <div className="text-sm text-green-600 font-semibold">
                    ฿{formatPrice(toTHB(item.price))}
                  </div>
                </div>
              </motion.div>
            ))}

            <motion.a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 w-52 md:w-60 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center text-white group min-h-[320px]"
              whileHover={{ scale: 1.02 }}
            >
              <Flame className="w-14 h-14 mb-4 group-hover:scale-110 transition-transform" />
              <span className="text-xl font-bold">ดูเพิ่มเติม</span>
              <span className="text-sm text-white/80 mt-1">View More</span>
              <div className="mt-4 px-6 py-2 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                <ExternalLink className="w-4 h-4 inline mr-2" />
                เปิดหน้าค้นหา
              </div>
            </motion.a>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && items.length === 0 && (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">ไม่พบสินค้า</p>
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-2 md:p-4"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl max-w-3xl w-full max-h-[95vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <img src="/brands/mercari.png" alt="Mercari" className="w-6 h-6 object-contain" />
                  <span className="font-bold text-red-500">Mercari</span>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto max-h-[calc(95vh-60px)]">
                {loadingDetail ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <>
                    {/* Image Gallery */}
                    <div className="relative bg-gray-100">
                      <div className="aspect-square md:aspect-[4/3] flex items-center justify-center">
                        {getImages().length > 0 ? (
                          <img
                            src={getImages()[currentImageIndex]}
                            alt={itemDetail?.name || selectedItem.name}
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <ShoppingBag className="w-24 h-24 text-gray-300" />
                        )}
                      </div>

                      {/* Status Badge */}
                      {(itemDetail?.status?.includes('SOLD') || selectedItem.status === 'sold') ? (
                        <div className="absolute top-4 left-4 px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-full shadow-lg flex items-center gap-2">
                          <X className="w-4 h-4" />
                          SOLD OUT
                        </div>
                      ) : (
                        <div className="absolute top-4 left-4 px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-full shadow-lg flex items-center gap-2">
                          <ShoppingCart className="w-4 h-4" />
                          ON SALE
                        </div>
                      )}

                      {/* Image Navigation */}
                      {getImages().length > 1 && (
                        <>
                          <button
                            onClick={() => setCurrentImageIndex(prev => prev === 0 ? getImages().length - 1 : prev - 1)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full shadow-lg flex items-center justify-center hover:bg-white transition"
                          >
                            <ChevronLeft className="w-6 h-6" />
                          </button>
                          <button
                            onClick={() => setCurrentImageIndex(prev => prev === getImages().length - 1 ? 0 : prev + 1)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full shadow-lg flex items-center justify-center hover:bg-white transition"
                          >
                            <ChevronRight className="w-6 h-6" />
                          </button>
                        </>
                      )}

                      {/* Thumbnail Strip */}
                      {getImages().length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-2">
                          {getImages().map((img, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentImageIndex(idx)}
                              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                                idx === currentImageIndex ? 'border-white scale-110' : 'border-transparent opacity-60'
                              }`}
                            >
                              <img src={img} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Image Counter */}
                      {getImages().length > 1 && (
                        <div className="absolute top-4 right-4 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
                          {currentImageIndex + 1} / {getImages().length}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 md:p-6">
                      {/* Title */}
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight mb-4">
                        {itemDetail?.name || selectedItem.name}
                      </h3>

                      {/* Price Card */}
                      <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-5 mb-5 text-white shadow-lg">
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-white/70 text-sm mb-1">Price (JPY)</p>
                            <p className="text-4xl font-bold">¥{formatPrice(itemDetail?.price || selectedItem.price)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white/70 text-sm mb-1">Price (THB)</p>
                            <p className="text-2xl font-bold text-green-300">฿{formatPrice(toTHB(itemDetail?.price || selectedItem.price))}</p>
                          </div>
                        </div>
                      </div>

                      {/* Item Details Grid */}
                      {itemDetail && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                          <div className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                              <Star className="w-4 h-4" />
                              <span className="text-xs">สภาพสินค้า</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-700">
                              {translateJP(itemDetail.item_condition?.name, [CONDITION_MAP])}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                              <ShoppingBag className="w-4 h-4" />
                              <span className="text-xs">หมวดหมู่</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-700 truncate">{itemDetail.item_category?.name || '-'}</p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                              <Truck className="w-4 h-4" />
                              <span className="text-xs">ค่าส่ง</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-700">
                              {translateJP(itemDetail.shipping_payer?.name, [SHIPPING_PAYER_MAP])}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                              <MapPin className="w-4 h-4" />
                              <span className="text-xs">จัดส่งจาก</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-700">
                              {translateJP(itemDetail.shipping_from_area?.name, [AREA_MAP])}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                              <Clock className="w-4 h-4" />
                              <span className="text-xs">ระยะเวลาส่ง</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-700">
                              {translateJP(itemDetail.shipping_duration?.name, [SHIPPING_DURATION_MAP])}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                              <Heart className="w-4 h-4" />
                              <span className="text-xs">ถูกใจ</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-700">{itemDetail.num_likes || 0} คน</p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                              <MessageCircle className="w-4 h-4" />
                              <span className="text-xs">ความคิดเห็น</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-700">{itemDetail.num_comments || 0} ข้อความ</p>
                          </div>
                        </div>
                      )}

                      {/* Description */}
                      {itemDetail?.description && (
                        <div className="mb-5">
                          <h4 className="font-bold text-gray-700 mb-2">รายละเอียดสินค้า</h4>
                          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 whitespace-pre-wrap max-h-48 overflow-y-auto">
                            {itemDetail.description}
                          </div>
                        </div>
                      )}

                      {/* Seller Info */}
                      {itemDetail?.seller && (
                        <div className="bg-blue-50 rounded-xl p-4 mb-5">
                          <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            ข้อมูลผู้ขาย
                          </h4>
                          <div className="flex items-center gap-3">
                            {itemDetail.seller.photo && (
                              <img src={itemDetail.seller.photo} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow" />
                            )}
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">{itemDetail.seller.name}</p>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mt-1">
                                <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                  <ThumbsUp className="w-3 h-3" />
                                  {itemDetail.seller.ratings?.good || 0} ดี
                                </span>
                                <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                                  {itemDetail.seller.num_sell_items || 0} รายการ
                                </span>
                                {itemDetail.seller.quick_shipper && (
                                  <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">ส่งเร็ว</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Comments */}
                      {itemDetail?.comments && itemDetail.comments.length > 0 && (
                        <div className="mb-5">
                          <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            ความคิดเห็น ({itemDetail.comments.length})
                          </h4>
                          <div className="space-y-3 max-h-60 overflow-y-auto">
                            {itemDetail.comments.map((comment) => (
                              <div key={comment.id} className="bg-gray-50 rounded-xl p-3">
                                <div className="flex items-start gap-3">
                                  {comment.user?.photo && (
                                    <img src={comment.user.photo} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold text-sm text-gray-800">{comment.user?.name || 'User'}</span>
                                      {comment.created && (
                                        <span className="text-xs text-gray-400">
                                          {new Date(comment.created).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">{comment.message}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="space-y-3">
                        <button
                          onClick={() => handleOrderInquiry(itemDetail || selectedItem)}
                          disabled={itemDetail?.status?.includes('SOLD') || selectedItem.status === 'sold'}
                          className={`w-full flex items-center justify-center gap-3 px-6 py-4 font-bold rounded-2xl transition-all ${
                            itemDetail?.status?.includes('SOLD') || selectedItem.status === 'sold'
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-[#06C755] text-white hover:bg-[#05B04C] shadow-lg shadow-green-500/30 hover:shadow-xl hover:-translate-y-0.5'
                          }`}
                        >
                          <Send className="w-5 h-5" />
                          {itemDetail?.status?.includes('SOLD') || selectedItem.status === 'sold' ? 'สินค้าหมดแล้ว' : 'สั่งซื้อผ่าน LINE'}
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                          <a
                            href={`https://jp.mercari.com/item/${selectedItem.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
                          >
                            <ExternalLink className="w-5 h-5" />
                            ดูใน Mercari
                          </a>
                          <button
                            onClick={() => handleCopyLink(selectedItem.id)}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
                          >
                            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                            {copied ? 'Copied!' : 'Copy Link'}
                          </button>
                        </div>
                      </div>

                      {/* Help Text */}
                      <div className="mt-5 p-4 bg-orange-50 rounded-xl">
                        <p className="text-sm text-orange-700">
                          <strong>วิธีสั่งซื้อ:</strong> กดปุ่ม "สั่งซื้อผ่าน LINE" แล้วส่งลิงก์สินค้าให้เรา ทีมงานจะแจ้งราคารวมค่าบริการและค่าจัดส่งให้ทราบ
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

export default MercariCarousel;
