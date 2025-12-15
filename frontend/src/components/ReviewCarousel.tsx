import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Quote,
  X,
  Pause,
  Play,
} from 'lucide-react';

interface Review {
  id: string;
  customerName: string;
  customerImage: string;
  rating: number;
  comment: string;
  reviewImages: { url: string; caption: string }[];
  createdAt: string;
}

interface ReviewCarouselProps {
  title?: string;
  subtitle?: string;
}

const ReviewCarousel = ({
  title = 'รีวิวจากลูกค้า',
  subtitle = 'Customer Reviews',
}: ReviewCarouselProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; images: { url: string }[]; index: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/reviews?page=1&limit=50`);
        const data = await response.json();
        if (data.success) {
          setReviews(data.data);
        } else {
          setError('ไม่สามารถโหลดรีวิวได้');
        }
      } catch (err) {
        setError('ไม่สามารถโหลดรีวิวได้');
        console.error('Failed to fetch reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  // Smooth infinite scroll animation
  useEffect(() => {
    if (loading || reviews.length === 0 || isPaused) return;

    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let scrollPosition = 0;
    const scrollSpeed = 0.3;

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
  }, [loading, reviews.length, isPaused]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 350;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Duplicate reviews for seamless infinite scroll
  const displayReviews = [...reviews, ...reviews];

  if (loading) {
    return (
      <section className="py-12 bg-gradient-to-br from-primary-50 via-white to-orange-50 rounded-[2rem] mx-2 md:mx-4 my-8">
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
      </section>
    );
  }

  if (error || reviews.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gradient-to-br from-primary-50 via-white to-orange-50 rounded-[2rem] mx-2 md:mx-4 my-8 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="flex flex-col md:flex-row md:items-center md:justify-between mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="mb-4 md:mb-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-orange-500 flex items-center justify-center shadow-lg">
                <Quote className="w-6 h-6 text-white" />
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

        {/* Reviews Carousel */}
        <div
          ref={scrollRef}
          className={`flex gap-4 pb-4 ${isPaused ? 'overflow-x-auto' : 'overflow-x-hidden'}`}
          onTouchStart={() => setIsPaused(true)}
          onMouseDown={() => setIsPaused(true)}
        >
          {displayReviews.map((review, index) => (
            <motion.div
              key={`${review.id}-${index}`}
              className="flex-shrink-0 w-80 md:w-96 bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(index * 0.05, 0.3) }}
              whileHover={{ y: -5 }}
              onClick={() => setSelectedReview(review)}
            >
              <div className="p-5">
                {/* Customer Info */}
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={review.customerImage}
                    alt={review.customerName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-primary-100"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{review.customerName}</p>
                    <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                    />
                  ))}
                </div>

                {/* Comment */}
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4">
                  {review.comment}
                </p>

                {/* Review Images */}
                {review.reviewImages && review.reviewImages.length > 0 && (
                  <div className="flex gap-2 overflow-hidden">
                    {review.reviewImages.slice(0, 3).map((img, idx) => (
                      <div
                        key={idx}
                        className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0"
                      >
                        <img
                          src={img.url}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    ))}
                    {review.reviewImages.length > 3 && (
                      <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-500 font-semibold">+{review.reviewImages.length - 3}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Review Detail Modal */}
      <AnimatePresence>
        {selectedReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedReview(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">รีวิวจากลูกค้า</h3>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 overflow-y-auto max-h-[calc(90vh-60px)]">
                {/* Customer Info */}
                <div className="flex items-center gap-4 mb-5">
                  <img
                    src={selectedReview.customerImage}
                    alt={selectedReview.customerName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary-200"
                  />
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{selectedReview.customerName}</p>
                    <p className="text-sm text-gray-400">{formatDate(selectedReview.createdAt)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${i < selectedReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Comment */}
                <div className="bg-gray-50 rounded-2xl p-4 mb-5">
                  <Quote className="w-6 h-6 text-primary-300 mb-2" />
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedReview.comment}
                  </p>
                </div>

                {/* Review Images */}
                {selectedReview.reviewImages && selectedReview.reviewImages.length > 0 && (
                  <div className="space-y-3">
                    <p className="font-semibold text-gray-700">รูปภาพรีวิว</p>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedReview.reviewImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="aspect-square rounded-xl overflow-hidden cursor-pointer"
                          onClick={() => setSelectedImage({ url: img.url, images: selectedReview.reviewImages, index: idx })}
                        >
                          <img
                            src={img.url}
                            alt=""
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Viewer Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center"
            onClick={() => setSelectedImage(null)}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition z-10"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Image Counter */}
            {selectedImage.images.length > 1 && (
              <div className="absolute top-4 left-4 px-4 py-2 bg-black/50 text-white rounded-full text-sm">
                {selectedImage.index + 1} / {selectedImage.images.length}
              </div>
            )}

            {/* Main Image */}
            <motion.img
              key={selectedImage.url}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={selectedImage.url}
              alt=""
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
              drag={selectedImage.images.length > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.x > 100) {
                  // Swipe right - previous image
                  const newIndex = selectedImage.index === 0 ? selectedImage.images.length - 1 : selectedImage.index - 1;
                  setSelectedImage({
                    url: selectedImage.images[newIndex].url,
                    images: selectedImage.images,
                    index: newIndex,
                  });
                } else if (info.offset.x < -100) {
                  // Swipe left - next image
                  const newIndex = selectedImage.index === selectedImage.images.length - 1 ? 0 : selectedImage.index + 1;
                  setSelectedImage({
                    url: selectedImage.images[newIndex].url,
                    images: selectedImage.images,
                    index: newIndex,
                  });
                }
              }}
            />

            {/* Navigation Arrows */}
            {selectedImage.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newIndex = selectedImage.index === 0 ? selectedImage.images.length - 1 : selectedImage.index - 1;
                    setSelectedImage({
                      url: selectedImage.images[newIndex].url,
                      images: selectedImage.images,
                      index: newIndex,
                    });
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
                >
                  <ChevronLeft className="w-8 h-8 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newIndex = selectedImage.index === selectedImage.images.length - 1 ? 0 : selectedImage.index + 1;
                    setSelectedImage({
                      url: selectedImage.images[newIndex].url,
                      images: selectedImage.images,
                      index: newIndex,
                    });
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
                >
                  <ChevronRight className="w-8 h-8 text-white" />
                </button>
              </>
            )}

            {/* Thumbnail Strip */}
            {selectedImage.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-2">
                {selectedImage.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage({
                        url: img.url,
                        images: selectedImage.images,
                        index: idx,
                      });
                    }}
                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === selectedImage.index ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
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

export default ReviewCarousel;
