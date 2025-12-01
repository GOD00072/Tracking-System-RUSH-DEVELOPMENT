import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Ship,
  Plane,
  Upload,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  X,
  Image as ImageIcon,
  Bell,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import api, { SERVER_URL } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';

interface ScheduleImage {
  id: string;
  type: 'ship' | 'air';
  title: string;
  description: string | null;
  imageUrl: string;
  month: number;
  year: number;
  isActive: boolean;
  isNotified: boolean;
  notifiedAt: string | null;
  uploadedBy: string | null;
  createdAt: string;
}

const MONTHS = [
  { value: 1, label: 'มกราคม' },
  { value: 2, label: 'กุมภาพันธ์' },
  { value: 3, label: 'มีนาคม' },
  { value: 4, label: 'เมษายน' },
  { value: 5, label: 'พฤษภาคม' },
  { value: 6, label: 'มิถุนายน' },
  { value: 7, label: 'กรกฎาคม' },
  { value: 8, label: 'สิงหาคม' },
  { value: 9, label: 'กันยายน' },
  { value: 10, label: 'ตุลาคม' },
  { value: 11, label: 'พฤศจิกายน' },
  { value: 12, label: 'ธันวาคม' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear + i - 2);

// Helper function to get image URL (handles both Cloudinary and legacy local URLs)
const getImageUrl = (imageUrl: string) => {
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  return `${SERVER_URL}${imageUrl}`;
};

const AdminSchedulesPage = () => {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<'all' | 'ship' | 'air'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleImage | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    type: 'ship' as 'ship' | 'air',
    title: '',
    description: '',
    month: new Date().getMonth() + 1,
    year: currentYear,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch schedules
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['admin-schedules', filterType],
    queryFn: async () => {
      const params = filterType !== 'all' ? `?type=${filterType}` : '';
      const res = await api.get(`/schedules${params}`);
      return res.data.data as ScheduleImage[];
    },
  });

  // Create schedule mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await api.post('/schedules', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('เพิ่มตารางรอบใหม่สำเร็จ และส่งแจ้งเตือนแล้ว');
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      resetForm();
    },
    onError: () => {
      toast.error('เกิดข้อผิดพลาดในการเพิ่มตารางรอบ');
    },
  });

  // Update schedule mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      const res = await api.patch(`/schedules/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('อัปเดตตารางรอบสำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
      resetForm();
    },
    onError: () => {
      toast.error('เกิดข้อผิดพลาดในการอัปเดตตารางรอบ');
    },
  });

  // Delete schedule mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/schedules/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('ลบตารางรอบสำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
    },
    onError: () => {
      toast.error('เกิดข้อผิดพลาดในการลบตารางรอบ');
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const data = new FormData();
      data.append('isActive', String(isActive));
      const res = await api.patch(`/schedules/${id}`, data);
      return res.data;
    },
    onSuccess: (_, { isActive }) => {
      toast.success(isActive ? 'เปิดใช้งานตารางรอบแล้ว' : 'ปิดใช้งานตารางรอบแล้ว');
      queryClient.invalidateQueries({ queryKey: ['admin-schedules'] });
    },
    onError: () => {
      toast.error('เกิดข้อผิดพลาด');
    },
  });

  const resetForm = () => {
    setShowModal(false);
    setEditingSchedule(null);
    setFormData({
      type: 'ship',
      title: '',
      description: '',
      month: new Date().getMonth() + 1,
      year: currentYear,
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const openEditModal = (schedule: ScheduleImage) => {
    setEditingSchedule(schedule);
    setFormData({
      type: schedule.type,
      title: schedule.title,
      description: schedule.description || '',
      month: schedule.month,
      year: schedule.year,
    });
    setImagePreview(getImageUrl(schedule.imageUrl));
    setShowModal(true);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingSchedule && !imageFile) {
      toast.error('กรุณาเลือกรูปภาพ');
      return;
    }

    const data = new FormData();
    data.append('type', formData.type);
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('month', String(formData.month));
    data.append('year', String(formData.year));
    if (imageFile) {
      data.append('image', imageFile);
    }

    if (editingSchedule) {
      updateMutation.mutate({ id: editingSchedule.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getMonthName = (month: number) => {
    return MONTHS.find(m => m.value === month)?.label || '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size={200} text="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-7 h-7 text-primary-500" />
            จัดการตารางรอบเรือ/เครื่องบิน
          </h1>
          <p className="text-gray-500 text-sm mt-1">อัปโหลดรูปตารางประจำเดือน และแจ้งเตือนลูกค้า</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          เพิ่มตารางรอบใหม่
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filterType === 'all'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ทั้งหมด
        </button>
        <button
          onClick={() => setFilterType('ship')}
          className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
            filterType === 'ship'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Ship className="w-4 h-4" />
          ทางเรือ
        </button>
        <button
          onClick={() => setFilterType('air')}
          className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
            filterType === 'air'
              ? 'bg-sky-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Plane className="w-4 h-4" />
          ทางอากาศ
        </button>
      </div>

      {/* Schedules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {schedules?.map((schedule) => (
            <motion.div
              key={schedule.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`card overflow-hidden ${!schedule.isActive ? 'opacity-60' : ''}`}
            >
              {/* Image */}
              <div
                className="relative h-48 bg-gray-100 -mx-6 -mt-6 mb-4 cursor-pointer"
                onClick={() => setPreviewImage(getImageUrl(schedule.imageUrl))}
              >
                <img
                  src={getImageUrl(schedule.imageUrl)}
                  alt={schedule.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 flex gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold text-white ${
                      schedule.type === 'ship' ? 'bg-blue-500' : 'bg-sky-500'
                    }`}
                  >
                    {schedule.type === 'ship' ? (
                      <span className="flex items-center gap-1">
                        <Ship className="w-3 h-3" /> เรือ
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Plane className="w-3 h-3" /> เครื่องบิน
                      </span>
                    )}
                  </span>
                </div>
                {schedule.isNotified && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white p-1.5 rounded-full">
                    <Bell className="w-3 h-3" />
                  </div>
                )}
                {!schedule.isActive && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      ปิดใช้งาน
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="space-y-2">
                <h3 className="font-bold text-lg">{schedule.title}</h3>
                <p className="text-gray-500 text-sm">
                  {getMonthName(schedule.month)} {schedule.year}
                </p>
                {schedule.description && (
                  <p className="text-gray-600 text-sm">{schedule.description}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <button
                  onClick={() => toggleActiveMutation.mutate({ id: schedule.id, isActive: !schedule.isActive })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1 ${
                    schedule.isActive
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {schedule.isActive ? (
                    <>
                      <EyeOff className="w-4 h-4" /> ซ่อน
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" /> แสดง
                    </>
                  )}
                </button>
                <button
                  onClick={() => openEditModal(schedule)}
                  className="flex-1 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition flex items-center justify-center gap-1"
                >
                  <Edit2 className="w-4 h-4" /> แก้ไข
                </button>
                <button
                  onClick={() => {
                    if (confirm('ต้องการลบตารางรอบนี้?')) {
                      deleteMutation.mutate(schedule.id);
                    }
                  }}
                  className="py-2 px-3 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {schedules?.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p>ยังไม่มีตารางรอบ</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 text-primary-500 hover:underline"
          >
            เพิ่มตารางรอบใหม่
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => resetForm()}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">
                    {editingSchedule ? 'แก้ไขตารางรอบ' : 'เพิ่มตารางรอบใหม่'}
                  </h2>
                  <button
                    onClick={() => resetForm()}
                    className="p-2 hover:bg-gray-100 rounded-full transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Type Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">ประเภท</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'ship' })}
                        className={`p-4 rounded-xl border-2 transition flex items-center justify-center gap-2 ${
                          formData.type === 'ship'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Ship className="w-5 h-5" />
                        ทางเรือ
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'air' })}
                        className={`p-4 rounded-xl border-2 transition flex items-center justify-center gap-2 ${
                          formData.type === 'air'
                            ? 'border-sky-500 bg-sky-50 text-sky-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Plane className="w-5 h-5" />
                        ทางอากาศ
                      </button>
                    </div>
                  </div>

                  {/* Month/Year */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">เดือน</label>
                      <select
                        value={formData.month}
                        onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                        className="input-field"
                      >
                        {MONTHS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">ปี</label>
                      <select
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                        className="input-field"
                      >
                        {YEARS.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium mb-2">ชื่อตาราง</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder={`ตารางรอบ${formData.type === 'ship' ? 'เรือ' : 'เครื่องบิน'} ${getMonthName(formData.month)} ${formData.year}`}
                      className="input-field"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium mb-2">รายละเอียด (ไม่บังคับ)</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="รายละเอียดเพิ่มเติม..."
                      className="input-field"
                      rows={3}
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      รูปตาราง {!editingSchedule && <span className="text-red-500">*</span>}
                    </label>
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-primary-400 transition cursor-pointer"
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="max-h-48 mx-auto rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setImageFile(null);
                              setImagePreview(editingSchedule ? getImageUrl(editingSchedule.imageUrl) : null);
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="py-8">
                          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                          <p className="text-gray-500">คลิกเพื่ออัปโหลดรูปภาพ</p>
                          <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP (สูงสุด 10MB)</p>
                        </div>
                      )}
                    </div>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>

                  {/* Notification Info */}
                  {!editingSchedule && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                      <Bell className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800">แจ้งเตือนอัตโนมัติ</p>
                        <p className="text-sm text-green-600">
                          เมื่อเพิ่มตารางรอบใหม่ ระบบจะสร้างแจ้งเตือนให้ลูกค้าเห็นบนเว็บไซต์
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Submit */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => resetForm()}
                      className="flex-1 py-3 rounded-xl border border-gray-300 font-medium hover:bg-gray-50 transition"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="flex-1 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {(createMutation.isPending || updateMutation.isPending) ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          กำลังบันทึก...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          {editingSchedule ? 'บันทึกการแก้ไข' : 'เพิ่มตารางรอบ'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSchedulesPage;
