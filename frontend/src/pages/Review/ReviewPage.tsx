import { Star } from 'lucide-react';
import { useReviews } from '../../hooks/useReviews';
import LoadingSpinner from '../../components/LoadingSpinner';

const ReviewPage = () => {
  const { data: reviewsData, isLoading } = useReviews(1, 50, true); // Only show approved reviews

  if (isLoading) {
    return (
      <div className="container-custom py-12">
        <LoadingSpinner />
      </div>
    );
  }

  const featuredReviews = reviewsData?.data.filter(review => review.isFeatured) || [];
  const regularReviews = reviewsData?.data.filter(review => !review.isFeatured) || [];

  return (
    <div className="container-custom py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">รีวิวจากลูกค้า</h1>
        <p className="text-gray-600 text-lg">ความคิดเห็นและประสบการณ์จากลูกค้าที่ใช้บริการของเรา</p>
      </div>

      {/* Featured Reviews */}
      {featuredReviews.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            รีวิวแนะนำ
          </h2>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {featuredReviews.map((review) => (
              <div key={review.id} className="card hover:shadow-lg transition-shadow border-2 border-primary-200">
                <div className="flex items-start gap-4 mb-4">
                  {review.customerImage ? (
                    <img
                      src={review.customerImage}
                      alt={review.customerName || 'Customer'}
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary-400"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xl border-2 border-primary-400">
                      {(review.customerName || review.customer?.companyName || 'C').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">
                      {review.customerName || review.customer?.companyName || review.customer?.contactPerson || 'ลูกค้า'}
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
                      <span className="text-sm text-gray-600">({review.rating}/5)</span>
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-gray-700 leading-relaxed mb-3">"{review.comment}"</p>
                )}
                {review.order && (
                  <div className="text-xs text-gray-500 mt-3 pt-3 border-t">
                    คำสั่งซื้อ: {review.order.orderNumber}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regular Reviews */}
      {regularReviews.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">รีวิวทั้งหมด</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {regularReviews.map((review) => (
              <div key={review.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  {review.customerImage ? (
                    <img
                      src={review.customerImage}
                      alt={review.customerName || 'Customer'}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                      {(review.customerName || review.customer?.companyName || 'C').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {review.customerName || review.customer?.companyName || review.customer?.contactPerson || 'ลูกค้า'}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
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
                  <p className="text-gray-600 text-sm leading-relaxed">"{review.comment}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Reviews */}
      {reviewsData && reviewsData.data.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">ยังไม่มีรีวิวในขณะนี้</p>
        </div>
      )}
    </div>
  );
};

export default ReviewPage;
