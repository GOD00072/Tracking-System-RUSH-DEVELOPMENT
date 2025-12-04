import { useState } from 'react';
import { Plus, Edit, Trash2, Star, X, Upload, Image as ImageIcon, GripVertical } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import LoadingSpinner from '../../components/LoadingSpinner';
import api from '../../lib/api';
import useSwipeToDismiss from '../../hooks/useSwipeToDismiss';

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

const AdminPortfolioPage = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    isFeatured: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Swipe to dismiss for mobile modal
  const formSheetRef = useSwipeToDismiss({
    onDismiss: () => {
      setShowModal(false);
      setEditingItem(null);
      resetForm();
    },
    enabled: showModal,
  });

  // Fetch portfolio items
  const { data: portfolioData, isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const res = await api.get('/portfolio');
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

  // Upload image mutation
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/upload/cloudinary?folder=portfolio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data.url;
  };

  // Create portfolio item mutation
  const createItem = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/portfolio', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('เพิ่มผลงานสำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-categories'] });
      setShowModal(false);
      resetForm();
    },
    onError: () => {
      toast.error('เกิดข้อผิดพลาดในการเพิ่มผลงาน');
    },
  });

  // Update portfolio item mutation
  const updateItem = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.patch(`/portfolio/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('อัปเดตผลงานสำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-categories'] });
      setShowModal(false);
      setEditingItem(null);
      resetForm();
    },
    onError: () => {
      toast.error('เกิดข้อผิดพลาดในการอัปเดตผลงาน');
    },
  });

  // Delete portfolio item mutation
  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/portfolio/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('ลบผลงานสำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-categories'] });
    },
    onError: () => {
      toast.error('เกิดข้อผิดพลาดในการลบผลงาน');
    },
  });

  // Toggle featured mutation
  const toggleFeatured = useMutation({
    mutationFn: async ({ id, isFeatured }: { id: string; isFeatured: boolean }) => {
      const res = await api.patch(`/portfolio/${id}`, { isFeatured });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let imageUrl = editingItem?.imageUrl || null;

      // Upload new image if selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const data = {
        title: formData.title,
        description: formData.description || null,
        category: formData.category || null,
        isFeatured: formData.isFeatured,
        imageUrl,
      };

      if (editingItem) {
        updateItem.mutate({ id: editingItem.id, data });
      } else {
        createItem.mutate(data);
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      isFeatured: false,
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleEdit = (item: PortfolioItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      category: item.category || '',
      isFeatured: item.isFeatured,
    });
    setImagePreview(item.imageUrl);
    setImageFile(null);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('ต้องการลบผลงานนี้?')) {
      deleteItem.mutate(id);
    }
  };

  const handleFeature = (item: PortfolioItem) => {
    toggleFeatured.mutate({ id: item.id, isFeatured: !item.isFeatured });
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
    }
  };

  const categories = categoriesData?.data || [];
  const items: PortfolioItem[] = portfolioData?.data || [];

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold">จัดการผลงาน</h1>
        <button
          onClick={() => {
            setEditingItem(null);
            resetForm();
            setShowModal(true);
          }}
          className="bg-primary-600 text-white px-3 py-2 md:px-4 rounded-lg hover:bg-primary-700 flex items-center gap-2 text-sm md:text-base"
        >
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden md:inline">เพิ่มผลงาน</span>
          <span className="md:hidden">เพิ่ม</span>
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Gallery Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group relative"
              >
                {/* Image */}
                <div className="aspect-square relative bg-gray-100">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-300" />
                    </div>
                  )}

                  {/* Featured Badge */}
                  {item.isFeatured && (
                    <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      แนะนำ
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleFeature(item)}
                      className={`p-2 rounded-full transition-colors ${
                        item.isFeatured
                          ? 'bg-yellow-400 text-yellow-900'
                          : 'bg-white/20 text-white hover:bg-yellow-400 hover:text-yellow-900'
                      }`}
                      title={item.isFeatured ? 'ยกเลิกแนะนำ' : 'แนะนำ'}
                    >
                      <Star className={`w-5 h-5 ${item.isFeatured ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 bg-white/20 text-white rounded-full hover:bg-blue-500 transition-colors"
                      title="แก้ไข"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 bg-white/20 text-white rounded-full hover:bg-red-500 transition-colors"
                      title="ลบ"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 truncate">{item.title}</h3>
                  {item.category && (
                    <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {item.category}
                    </span>
                  )}
                </div>

                {/* Mobile Actions */}
                <div className="md:hidden flex border-t border-gray-100 divide-x divide-gray-100">
                  <button
                    onClick={() => handleFeature(item)}
                    className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 ${
                      item.isFeatured ? 'text-yellow-600' : 'text-gray-600'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${item.isFeatured ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex-1 py-2 text-xs font-medium text-blue-600 flex items-center justify-center gap-1"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 py-2 text-xs font-medium text-red-600 flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {items.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
              ยังไม่มีผลงาน กดปุ่ม "เพิ่มผลงาน" เพื่อเริ่มต้น
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 md:flex md:items-center md:justify-center md:p-4"
          onClick={() => setShowModal(false)}
        >
          {/* Desktop Modal */}
          <div
            className="hidden md:block bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">
              {editingItem ? 'แก้ไขผลงาน' : 'เพิ่มผลงานใหม่'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รูปภาพผลงาน *
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-400 transition cursor-pointer"
                  onClick={() => document.getElementById('portfolio-image-upload')?.click()}
                >
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-48 rounded-lg object-contain mx-auto"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-6">
                      <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">คลิกเพื่ออัปโหลดรูปภาพ</p>
                      <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP</p>
                    </div>
                  )}
                </div>
                <input
                  id="portfolio-image-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อผลงาน *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="ชื่อผลงาน"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รายละเอียด
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="รายละเอียดผลงาน..."
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  หมวดหมู่
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="เช่น สินค้าทั่วไป, อาหาร, อิเล็กทรอนิกส์"
                  list="category-list"
                />
                <datalist id="category-list">
                  {categories.map((cat: string) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              {/* Featured */}
              <div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="mr-2 w-4 h-4 text-primary-600 rounded"
                  />
                  <span className="text-sm">แสดงเป็นผลงานแนะนำ</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isUploading || createItem.isPending || updateItem.isPending}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {(isUploading || createItem.isPending || updateItem.isPending) && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {editingItem ? 'บันทึก' : 'เพิ่มผลงาน'}
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
                {editingItem ? 'แก้ไขผลงาน' : 'เพิ่มผลงานใหม่'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingItem(null);
                  resetForm();
                }}
                className="p-2 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รูปภาพผลงาน
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center"
                  onClick={() => document.getElementById('portfolio-image-upload-mobile')?.click()}
                >
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-40 rounded-lg object-contain mx-auto"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-4">
                      <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">แตะเพื่ออัปโหลดรูปภาพ</p>
                    </div>
                  )}
                </div>
                <input
                  id="portfolio-image-upload-mobile"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อผลงาน *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="ชื่อผลงาน"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รายละเอียด
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="รายละเอียดผลงาน..."
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  หมวดหมู่
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="เช่น สินค้าทั่วไป, อาหาร"
                />
              </div>

              {/* Featured */}
              <div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="mr-2 w-5 h-5 text-primary-600 rounded"
                  />
                  <span className="text-sm">แสดงเป็นผลงานแนะนำ</span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-4 pb-8">
                <button
                  type="submit"
                  disabled={isUploading || createItem.isPending || updateItem.isPending}
                  className="w-full py-4 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {(isUploading || createItem.isPending || updateItem.isPending) && (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มผลงาน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortfolioPage;
