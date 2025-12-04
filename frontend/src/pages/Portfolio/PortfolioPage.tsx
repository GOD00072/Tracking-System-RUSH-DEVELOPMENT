import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Filter, ChevronDown } from 'lucide-react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  category: string | null;
  isFeatured: boolean;
  displayOrder: number | null;
  createdAt: string;
}

const PortfolioPage = () => {
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch portfolio items
  const { data: portfolioData, isLoading } = useQuery({
    queryKey: ['portfolio', selectedCategory, showFeaturedOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (showFeaturedOnly) params.append('featured', 'true');
      const res = await api.get(`/portfolio?${params.toString()}`);
      return res.data;
    },
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['portfolio-categories'],
    queryFn: async () => {
      const res = await api.get('/portfolio/categories');
      return res.data;
    },
  });

  const items: PortfolioItem[] = portfolioData?.data || [];
  const categories: string[] = categoriesData?.data || [];

  return (
    <div className="min-h-screen bg-[#FFFBF2]">
      {/* Hero Section */}
      <div className="pt-24 pb-12 md:pt-32 md:pb-16">
        <div className="container-custom text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <span className="inline-block px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-sm font-medium mb-6">
              Our Portfolio
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              ผลงานของเรา
            </h1>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              実績紹介
              <span className="block text-base mt-2 font-normal text-gray-400">
                รวมผลงานการจัดส่งสินค้าจากญี่ปุ่นที่ลูกค้าไว้วางใจ
              </span>
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container-custom pb-20 px-4">
        {/* Filter Bar */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-wrap items-center gap-3">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="md:hidden flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg rounded-full text-sm font-medium text-gray-700"
            >
              <Filter className="w-4 h-4" />
              ตัวกรอง
              {(selectedCategory || showFeaturedOnly) && (
                <span className="w-2 h-2 bg-orange-500 rounded-full" />
              )}
            </button>

            {/* Desktop Category Pills */}
            <div className="hidden md:flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === null
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg text-gray-700 hover:bg-white'
                }`}
              >
                ทั้งหมด
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                      : 'bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg text-gray-700 hover:bg-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Featured Toggle */}
            <button
              onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
              className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                showFeaturedOnly
                  ? 'bg-yellow-400 text-yellow-900 shadow-lg shadow-yellow-400/30'
                  : 'bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg text-gray-700 hover:bg-white'
              }`}
            >
              <Star className={`w-4 h-4 ${showFeaturedOnly ? 'fill-current' : ''}`} />
              แนะนำ
            </button>
          </div>

          {/* Mobile Filter Dropdown */}
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden mt-3 overflow-hidden"
              >
                <div className="bg-white/70 backdrop-blur-xl rounded-xl border border-white/50 shadow-lg p-4 space-y-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">หมวดหมู่</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-3 py-1.5 rounded-full text-sm ${
                          selectedCategory === null
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100/70 backdrop-blur-sm text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        ทั้งหมด
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1.5 rounded-full text-sm ${
                            selectedCategory === cat
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-100/70 backdrop-blur-sm text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showFeaturedOnly}
                        onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                        className="w-5 h-5 rounded text-orange-500 focus:ring-orange-500"
                      />
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        แสดงเฉพาะผลงานแนะนำ
                      </span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Gallery Grid */}
        {isLoading ? (
          <LoadingSpinner />
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-100">
              <Star className="w-10 h-10 text-orange-200" />
            </div>
            <p className="text-gray-500 text-lg">ยังไม่มีผลงานในหมวดหมู่นี้</p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5"
          >
            <AnimatePresence mode="popLayout">
              {items.map((item, index) => (
                                <motion.div
                                  key={item.id}
                                  layout
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  transition={{ delay: index * 0.05 }}
                                  onClick={() => setSelectedItem(item)}
                                  className="group cursor-pointer"
                                >
                                  <div className="relative aspect-square rounded-2xl md:rounded-[2rem] overflow-hidden bg-white border border-orange-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                    {item.imageUrl ? (
                                      <img
                                        src={item.imageUrl}
                                        alt={item.title}
                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                        loading="lazy"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-orange-50/50">
                                        <Star className="w-12 h-12 text-orange-200" />
                                      </div>
                                    )}
                
                                    {/* Featured Badge */}
                                    {item.isFeatured && (
                                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-yellow-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5 z-10">
                                        <Star className="w-3.5 h-3.5 fill-current" />
                                        <span className="hidden md:inline">Recommended</span>
                                      </div>
                                    )}
                
                                    {/* Hover Overlay - More subtle */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4 md:p-6">
                                      <div className="text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                        <h3 className="font-bold text-lg leading-tight mb-1">
                                          {item.title}
                                        </h3>
                                        {item.category && (
                                          <span className="inline-block px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-xs font-medium text-white/90">
                                            {item.category}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row bg-white rounded-2xl overflow-hidden"
            >
              {/* Image */}
              <div className="flex-1 bg-gray-100 flex items-center justify-center min-h-[40vh] md:min-h-[50vh]">
                {selectedItem.imageUrl ? (
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.title}
                    className="max-w-full max-h-[60vh] md:max-h-[80vh] object-contain"
                  />
                ) : (
                  <Star className="w-24 h-24 text-gray-300" />
                )}
              </div>

              {/* Info Panel */}
              <div className="md:w-72 p-6 bg-white">
                <div className="flex items-start gap-2 mb-3">
                  {selectedItem.isFeatured && (
                    <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-medium">
                      <Star className="w-3 h-3 fill-current" />
                      แนะนำ
                    </span>
                  )}
                  {selectedItem.category && (
                    <span className="inline-block bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-medium border border-orange-100">
                      {selectedItem.category}
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  {selectedItem.title}
                </h2>

                {selectedItem.description && (
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {selectedItem.description}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PortfolioPage;
