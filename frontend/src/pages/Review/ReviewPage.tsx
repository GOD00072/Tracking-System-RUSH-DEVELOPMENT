import { useState } from 'react';
import { Star, X, ChevronLeft, ChevronRight, Quote, Sparkles } from 'lucide-react';
import { useReviews } from '../../hooks/useReviews';
import LoadingSpinner from '../../components/LoadingSpinner';
import { SERVER_URL } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface ReviewImage {
  url: string;
  caption?: string;
}

const ReviewPage = () => {
  const { data: reviewsData, isLoading } = useReviews(1, 50, true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const getImageSrc = (imageUrl: string | null) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    if (imageUrl.startsWith('/uploads/')) {
      return `${SERVER_URL}${imageUrl}`;
    }
    return imageUrl;
  };

  const openLightbox = (images: ReviewImage[], startIndex: number = 0) => {
    setLightboxImages(images.map(img => getImageSrc(img.url) || ''));
    setLightboxIndex(startIndex);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % lightboxImages.length);
  };

  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const featuredReviews = reviewsData?.data.filter(review => review.isFeatured) || [];
  const regularReviews = reviewsData?.data.filter(review => !review.isFeatured) || [];
  const allReviews = [...featuredReviews, ...regularReviews];

  // Calculate stats
  const totalReviews = allReviews.length;
  const avgRating = totalReviews > 0
    ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : '0';
  const ratingCounts = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: allReviews.filter(r => r.rating === rating).length,
    percentage: totalReviews > 0
      ? (allReviews.filter(r => r.rating === rating).length / totalReviews) * 100
      : 0
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-orange-500/10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-primary-200 text-primary-600 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Customer Reviews
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
              รีวิวจากลูกค้า
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              ความคิดเห็นและประสบการณ์จริงจากลูกค้าที่ใช้บริการของเรา
            </p>
          </motion.div>

          {/* Rating Summary */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-12 max-w-3xl mx-auto"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Average Rating */}
                <div className="text-center md:border-r md:border-gray-200 md:pr-8">
                  <div className="text-6xl font-bold text-gray-900">{avgRating}</div>
                  <div className="flex justify-center mt-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`w-6 h-6 ${
                          i <= Math.round(Number(avgRating))
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-500 mt-2">{totalReviews} รีวิว</p>
                </div>

                {/* Rating Bars */}
                <div className="flex-1 w-full space-y-2">
                  {ratingCounts.map(({ rating, count, percentage }) => (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-8">{rating}</span>
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, delay: 0.3 + (5 - rating) * 0.1 }}
                          className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-8">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Reviews */}
      {featuredReviews.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-3 mb-8"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
                <Star className="w-6 h-6 text-white fill-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">รีวิวแนะนำ</h2>
                <p className="text-gray-500 text-sm">Featured Reviews</p>
              </div>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {featuredReviews.map((review, index) => {
                const reviewImages = (review.reviewImages as ReviewImage[]) || [];
                return (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="group bg-white rounded-3xl p-6 shadow-lg border-2 border-primary-100 hover:border-primary-300 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      {review.customerImage ? (
                        <img
                          src={getImageSrc(review.customerImage) || ''}
                          alt={review.customerName || 'Customer'}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-primary-200 shadow-md"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                          {(review.customerName || 'C').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900">
                          {review.customerName || review.customer?.companyName || 'ลูกค้า'}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
                                i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <Quote className="w-10 h-10 text-primary-200 opacity-50" />
                    </div>

                    {review.comment && (
                      <p className="text-gray-700 leading-relaxed mt-4 text-lg italic">
                        "{review.comment}"
                      </p>
                    )}

                    {/* Review Images */}
                    {reviewImages.length > 0 && (
                      <div className="mt-4 grid grid-cols-4 gap-2">
                        {reviewImages.slice(0, 4).map((img, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group/img"
                            onClick={() => openLightbox(reviewImages, idx)}
                          >
                            <img
                              src={getImageSrc(img.url) || ''}
                              alt=""
                              className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300"
                            />
                            {idx === 3 && reviewImages.length > 4 && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-lg">
                                +{reviewImages.length - 4}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* All Reviews - Masonry Layout */}
      {regularReviews.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-white to-orange-50/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-2">รีวิวทั้งหมด</h2>
              <p className="text-gray-500">All Customer Reviews</p>
            </motion.div>

            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              {regularReviews.map((review, index) => {
                const reviewImages = (review.reviewImages as ReviewImage[]) || [];
                return (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: (index % 6) * 0.05 }}
                    className="break-inside-avoid bg-white rounded-2xl p-5 shadow-md hover:shadow-xl border border-gray-100 hover:border-primary-200 transition-all duration-300"
                  >
                    {/* Review Images - Show at top if there are images */}
                    {reviewImages.length > 0 && (
                      <div className={`mb-4 ${reviewImages.length === 1 ? '' : 'grid grid-cols-2 gap-2'}`}>
                        {reviewImages.slice(0, reviewImages.length === 1 ? 1 : 4).map((img, idx) => (
                          <div
                            key={idx}
                            className={`relative overflow-hidden cursor-pointer group/img ${
                              reviewImages.length === 1 ? 'rounded-xl aspect-video' : 'rounded-lg aspect-square'
                            }`}
                            onClick={() => openLightbox(reviewImages, idx)}
                          >
                            <img
                              src={getImageSrc(img.url) || ''}
                              alt=""
                              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                            />
                            {idx === 3 && reviewImages.length > 4 && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold">
                                +{reviewImages.length - 4}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      {review.customerImage ? (
                        <img
                          src={getImageSrc(review.customerImage) || ''}
                          alt={review.customerName || 'Customer'}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold">
                          {(review.customerName || 'C').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {review.customerName || review.customer?.companyName || 'ลูกค้า'}
                        </h3>
                        <div className="flex items-center gap-1 mt-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {review.comment && (
                      <p className="text-gray-600 text-sm leading-relaxed mt-3">
                        "{review.comment}"
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* No Reviews */}
      {allReviews.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <Star className="w-12 h-12 text-gray-300" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">ยังไม่มีรีวิว</h3>
          <p className="text-gray-500">เราจะเพิ่มรีวิวจากลูกค้าเร็วๆ นี้</p>
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition"
            >
              <X className="w-8 h-8" />
            </button>

            {lightboxImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-4 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-4 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            <motion.img
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              src={lightboxImages[lightboxIndex]}
              alt=""
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            {lightboxImages.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                {lightboxImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(idx); }}
                    className={`w-2.5 h-2.5 rounded-full transition ${
                      idx === lightboxIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReviewPage;
