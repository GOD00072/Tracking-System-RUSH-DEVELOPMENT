import { useState } from 'react';
import { Star, Plus, Edit, Trash2, Check, X, Upload, Image as ImageIcon, Images, ChevronRight } from 'lucide-react';
import { useReviews, useDeleteReview } from '../../hooks/useReviews';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import LoadingSpinner from '../../components/LoadingSpinner';
import api, { SERVER_URL } from '../../lib/api';
import useSwipeToDismiss from '../../hooks/useSwipeToDismiss';

interface ReviewImage {
  url: string;
  caption?: string;
}

const AdminReviewsPage = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerImage: '',
    orderId: '',
    rating: 5,
    comment: '',
    isApproved: false,
    isFeatured: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Multiple review images
  const [reviewImageFiles, setReviewImageFiles] = useState<File[]>([]);
  const [reviewImagePreviews, setReviewImagePreviews] = useState<{url: string, isNew: boolean}[]>([]);
  const [existingReviewImages, setExistingReviewImages] = useState<ReviewImage[]>([]);

  // Swipe to dismiss for mobile modal
  const formSheetRef = useSwipeToDismiss({
    onDismiss: () => {
      setShowModal(false);
      setEditingReview(null);
      resetForm();
    },
    enabled: showModal,
  });

  const { data: reviewsData, isLoading } = useReviews(1, 50);
  const deleteReview = useDeleteReview();

  // Create review mutation with FormData
  const createReview = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await api.post('/reviews', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('เพิ่มรีวิวสำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      setShowModal(false);
      resetForm();
    },
    onError: () => {
      toast.error('เกิดข้อผิดพลาดในการเพิ่มรีวิว');
    },
  });

  // Update review mutation with FormData
  const updateReview = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      const res = await api.patch(`/reviews/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('อัปเดตรีวิวสำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      setShowModal(false);
      setEditingReview(null);
      resetForm();
    },
    onError: () => {
      toast.error('เกิดข้อผิดพลาดในการอัปเดตรีวิว');
    },
  });

  // Quick update mutation (for approve/feature toggles)
  const quickUpdate = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
      const res = await api.patch(`/reviews/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = new FormData();
    data.append('customerName', formData.customerName);
    data.append('rating', String(formData.rating));
    data.append('comment', formData.comment);
    data.append('isApproved', String(formData.isApproved));
    data.append('isFeatured', String(formData.isFeatured));

    if (formData.customerId) {
      data.append('customerId', formData.customerId);
    }
    if (formData.orderId) {
      data.append('orderId', formData.orderId);
    }

    // Handle customer avatar image
    if (imageFile) {
      data.append('image', imageFile);
    } else if (formData.customerImage) {
      data.append('customerImage', formData.customerImage);
    }

    // Handle multiple review images
    reviewImageFiles.forEach(file => {
      data.append('images', file);
    });

    // Include existing review images that weren't removed
    if (existingReviewImages.length > 0) {
      data.append('reviewImages', JSON.stringify(existingReviewImages));
    }

    if (editingReview) {
      updateReview.mutate({ id: editingReview.id, data });
    } else {
      createReview.mutate(data);
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      customerName: '',
      customerImage: '',
      orderId: '',
      rating: 5,
      comment: '',
      isApproved: false,
      isFeatured: false,
    });
    setImageFile(null);
    setImagePreview(null);
    setReviewImageFiles([]);
    setReviewImagePreviews([]);
    setExistingReviewImages([]);
  };

  const handleEdit = (review: any) => {
    setEditingReview(review);
    setFormData({
      customerId: review.customerId || '',
      customerName: review.customerName || '',
      customerImage: review.customerImage || '',
      orderId: review.orderId || '',
      rating: review.rating,
      comment: review.comment || '',
      isApproved: review.isApproved,
      isFeatured: review.isFeatured,
    });
    // Set customer image preview
    setImagePreview(getImageSrc(review.customerImage));
    setImageFile(null);

    // Set existing review images
    const images = (review.reviewImages as ReviewImage[]) || [];
    setExistingReviewImages(images);
    setReviewImagePreviews(images.map(img => ({ url: img.url, isNew: false })));
    setReviewImageFiles([]);

    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('ต้องการลบรีวิวนี้?')) {
      deleteReview.mutate(id);
    }
  };

  const handleApprove = (review: any) => {
    quickUpdate.mutate({
      id: review.id,
      data: { isApproved: !review.isApproved },
    });
  };

  const handleFeature = (review: any) => {
    quickUpdate.mutate({
      id: review.id,
      data: { isFeatured: !review.isFeatured },
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setFormData({ ...formData, customerImage: '' });
    }
  };

  const handleReviewImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Add new files
    setReviewImageFiles(prev => [...prev, ...files]);

    // Create previews for new files
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReviewImagePreviews(prev => [...prev, { url: reader.result as string, isNew: true }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeReviewImage = (index: number) => {
    const preview = reviewImagePreviews[index];

    if (preview.isNew) {
      // Find and remove from files array
      const newFileIndex = reviewImagePreviews.slice(0, index + 1).filter(p => p.isNew).length - 1;
      setReviewImageFiles(prev => prev.filter((_, i) => i !== newFileIndex));
    } else {
      // Remove from existing images
      const existingIndex = reviewImagePreviews.slice(0, index + 1).filter(p => !p.isNew).length - 1;
      setExistingReviewImages(prev => prev.filter((_, i) => i !== existingIndex));
    }

    setReviewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Helper function to get image URL (handles both Cloudinary and legacy local URLs)
  const getImageSrc = (customerImage: string | null) => {
    if (!customerImage) return null;
    if (customerImage.startsWith('http://') || customerImage.startsWith('https://')) {
      return customerImage;
    }
    if (customerImage.startsWith('/uploads/')) {
      return `${SERVER_URL}${customerImage}`;
    }
    return customerImage;
  };

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold">จัดการรีวิว</h1>
        <button
          onClick={() => {
            setEditingReview(null);
            resetForm();
            setShowModal(true);
          }}
          className="bg-primary-600 text-white px-3 py-2 md:px-4 rounded-lg hover:bg-primary-700 flex items-center gap-2 text-sm md:text-base"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden md:inline">เพิ่มรีวิว</span>
          <span className="md:hidden">เพิ่ม</span>
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ลูกค้า
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    คะแนน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    รูปภาพรีวิว
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ความคิดเห็น
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การจัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reviewsData?.data.map((review) => {
                  const reviewImages = (review.reviewImages as ReviewImage[]) || [];
                  return (
                    <tr key={review.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {review.customerImage ? (
                            <img
                              src={getImageSrc(review.customerImage) || ''}
                              alt={review.customerName || 'Customer'}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <ImageIcon className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {review.customerName || review.customer?.companyName || review.customer?.contactPerson || 'N/A'}
                            </div>
                            {review.order && (
                              <div className="text-xs text-gray-500">
                                Order: {review.order.orderNumber}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm text-gray-600">({review.rating})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {reviewImages.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <div className="flex -space-x-2">
                              {reviewImages.slice(0, 3).map((img, idx) => (
                                <img
                                  key={idx}
                                  src={getImageSrc(img.url) || ''}
                                  alt=""
                                  className="w-8 h-8 rounded object-cover border-2 border-white"
                                />
                              ))}
                            </div>
                            {reviewImages.length > 3 && (
                              <span className="text-xs text-gray-500 ml-1">+{reviewImages.length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">ไม่มีรูป</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {review.comment || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              review.isApproved
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {review.isApproved ? 'อนุมัติแล้ว' : 'รอตรวจสอบ'}
                          </span>
                          {review.isFeatured && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              แนะนำ
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(review)}
                            className={`${
                              review.isApproved ? 'text-gray-600' : 'text-green-600'
                            } hover:opacity-70`}
                            title={review.isApproved ? 'ยกเลิกอนุมัติ' : 'อนุมัติ'}
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleFeature(review)}
                            className={`${
                              review.isFeatured ? 'text-purple-600' : 'text-gray-400'
                            } hover:opacity-70`}
                            title={review.isFeatured ? 'ยกเลิกแนะนำ' : 'แนะนำ'}
                          >
                            <Star className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleEdit(review)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(review.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {reviewsData && reviewsData.data.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                ยังไม่มีรีวิว กดปุ่ม "เพิ่มรีวิว" เพื่อสร้างรีวิวแรก
              </div>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {reviewsData?.data.map((review) => {
              const reviewImages = (review.reviewImages as ReviewImage[]) || [];
              return (
                <div
                  key={review.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  {/* Review Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {review.customerImage ? (
                          <img
                            src={getImageSrc(review.customerImage) || ''}
                            alt={review.customerName || 'Customer'}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">
                            {review.customerName || review.customer?.companyName || review.customer?.contactPerson || 'N/A'}
                          </p>
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
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            review.isApproved
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {review.isApproved ? 'อนุมัติแล้ว' : 'รอตรวจสอบ'}
                        </span>
                        {review.isFeatured && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            แนะนำ
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Comment */}
                    {review.comment && (
                      <p className="text-gray-600 text-sm mt-3 line-clamp-2">{review.comment}</p>
                    )}

                    {/* Review Images */}
                    {reviewImages.length > 0 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                        {reviewImages.map((img, idx) => (
                          <img
                            key={idx}
                            src={getImageSrc(img.url) || ''}
                            alt=""
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex border-t border-gray-100 divide-x divide-gray-100">
                    <button
                      onClick={() => handleApprove(review)}
                      className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 ${
                        review.isApproved ? 'text-gray-600' : 'text-green-600'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      {review.isApproved ? 'ยกเลิก' : 'อนุมัติ'}
                    </button>
                    <button
                      onClick={() => handleFeature(review)}
                      className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1.5 ${
                        review.isFeatured ? 'text-purple-600' : 'text-gray-600'
                      }`}
                    >
                      <Star className="w-4 h-4" />
                      แนะนำ
                    </button>
                    <button
                      onClick={() => handleEdit(review)}
                      className="flex-1 py-3 text-sm font-medium text-blue-600 flex items-center justify-center gap-1.5"
                    >
                      <Edit className="w-4 h-4" />
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="flex-1 py-3 text-sm font-medium text-red-600 flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      ลบ
                    </button>
                  </div>
                </div>
              );
            })}

            {reviewsData && reviewsData.data.length === 0 && (
              <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
                ยังไม่มีรีวิว กดปุ่ม "เพิ่ม" เพื่อสร้างรีวิวแรก
              </div>
            )}
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:flex md:items-center md:justify-center md:p-4" onClick={() => setShowModal(false)}>
          {/* Desktop Modal */}
          <div className="hidden md:block bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">
              {editingReview ? 'แก้ไขรีวิว' : 'เพิ่มรีวิวใหม่'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อลูกค้า *
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="ชื่อลูกค้า"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    คะแนน *
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: num })}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            num <= formData.rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300 hover:text-yellow-200'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-gray-600">({formData.rating})</span>
                  </div>
                </div>
              </div>

              {/* Customer Avatar Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รูปโปรไฟล์ลูกค้า
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-400 transition cursor-pointer"
                  onClick={() => document.getElementById('review-image-upload')?.click()}
                >
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-20 h-20 rounded-full object-cover mx-auto"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageFile(null);
                          setImagePreview(null);
                          setFormData({ ...formData, customerImage: '' });
                        }}
                        className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-2">
                      <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                      <p className="text-xs text-gray-500">คลิกเพื่ออัปโหลดรูปโปรไฟล์</p>
                    </div>
                  )}
                </div>
                <input
                  id="review-image-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              {/* Multiple Review Images Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center gap-2">
                    <Images className="w-4 h-4" />
                    รูปภาพรีวิว (สูงสุด 10 รูป)
                  </div>
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary-400 transition cursor-pointer"
                  onClick={() => document.getElementById('review-images-upload')?.click()}
                >
                  {reviewImagePreviews.length > 0 ? (
                    <div className="grid grid-cols-5 gap-2">
                      {reviewImagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={preview.isNew ? preview.url : getImageSrc(preview.url) || ''}
                            alt=""
                            className="w-full aspect-square rounded-lg object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeReviewImage(idx);
                            }}
                            className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {reviewImagePreviews.length < 10 && (
                        <div className="w-full aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-primary-400 hover:text-primary-500 transition">
                          <Plus className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <Images className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">คลิกเพื่อเพิ่มรูปภาพรีวิว</p>
                      <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP (สูงสุด 10 รูป)</p>
                    </div>
                  )}
                </div>
                <input
                  id="review-images-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={handleReviewImagesChange}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ความคิดเห็น
                </label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="เขียนรีวิว..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer ID (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="UUID ของลูกค้า"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order ID (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    value={formData.orderId}
                    onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="UUID ของคำสั่งซื้อ"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isApproved}
                    onChange={(e) => setFormData({ ...formData, isApproved: e.target.checked })}
                    className="mr-2 w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-sm">อนุมัติแสดง</span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="mr-2 w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-sm">รีวิวแนะนำ</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingReview(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={createReview.isPending || updateReview.isPending}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {(createReview.isPending || updateReview.isPending) && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {editingReview ? 'บันทึก' : 'เพิ่มรีวิว'}
                </button>
              </div>
            </form>
          </div>

          {/* Mobile Bottom Sheet */}
          <div
            ref={formSheetRef}
            className="md:hidden fixed inset-x-0 bottom-0 bg-white rounded-t-3xl max-h-[95vh] overflow-hidden flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-4 pb-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editingReview ? 'แก้ไขรีวิว' : 'เพิ่มรีวิวใหม่'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingReview(null);
                  resetForm();
                }}
                className="p-2 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อลูกค้า *
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="ชื่อลูกค้า"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  คะแนน *
                </label>
                <div className="flex items-center justify-center gap-3 py-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: num })}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-10 h-10 transition-colors ${
                          num <= formData.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Avatar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รูปโปรไฟล์ลูกค้า
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center"
                  onClick={() => document.getElementById('review-image-upload-mobile')?.click()}
                >
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-20 h-20 rounded-full object-cover mx-auto"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageFile(null);
                          setImagePreview(null);
                          setFormData({ ...formData, customerImage: '' });
                        }}
                        className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-2">
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-1" />
                      <p className="text-sm text-gray-500">แตะเพื่ออัปโหลดรูปโปรไฟล์</p>
                    </div>
                  )}
                </div>
                <input
                  id="review-image-upload-mobile"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              {/* Review Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รูปภาพรีวิว (สูงสุด 10 รูป)
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-xl p-4"
                  onClick={() => document.getElementById('review-images-upload-mobile')?.click()}
                >
                  {reviewImagePreviews.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {reviewImagePreviews.map((preview, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={preview.isNew ? preview.url : getImageSrc(preview.url) || ''}
                            alt=""
                            className="w-full aspect-square rounded-lg object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeReviewImage(idx);
                            }}
                            className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {reviewImagePreviews.length < 10 && (
                        <div className="w-full aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                          <Plus className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <Images className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">แตะเพื่อเพิ่มรูปภาพรีวิว</p>
                    </div>
                  )}
                </div>
                <input
                  id="review-images-upload-mobile"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={handleReviewImagesChange}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ความคิดเห็น
                </label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="เขียนรีวิว..."
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isApproved}
                    onChange={(e) => setFormData({ ...formData, isApproved: e.target.checked })}
                    className="mr-2 w-5 h-5 text-primary-600 rounded"
                  />
                  <span className="text-sm">อนุมัติแสดง</span>
                </label>

                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="mr-2 w-5 h-5 text-purple-600 rounded"
                  />
                  <span className="text-sm">รีวิวแนะนำ</span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-4 pb-8">
                <button
                  type="submit"
                  disabled={createReview.isPending || updateReview.isPending}
                  className="w-full py-4 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {(createReview.isPending || updateReview.isPending) && (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {editingReview ? 'บันทึกการแก้ไข' : 'เพิ่มรีวิว'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviewsPage;
