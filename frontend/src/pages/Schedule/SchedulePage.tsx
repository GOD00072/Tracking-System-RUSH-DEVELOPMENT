import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Ship, Plane, X, ZoomIn, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import api, { SERVER_URL } from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { pageTransition, staggerContainer, staggerItem } from '../../lib/animations';

interface ScheduleImage {
  id: string;
  type: 'ship' | 'air';
  title: string;
  description: string | null;
  imageUrl: string;
  month: number;
  year: number;
  createdAt: string;
}

const MONTHS = [
  '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

// Helper function to get image URL (handles both Cloudinary and legacy local URLs)
const getImageUrl = (imageUrl: string) => {
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  return `${SERVER_URL}${imageUrl}`;
};

const SchedulePage = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'ship' | 'air'>('all');
  const [previewImage, setPreviewImage] = useState<ScheduleImage | null>(null);

  // Fetch schedules
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['public-schedules', activeTab],
    queryFn: async () => {
      const params = activeTab !== 'all' ? `?type=${activeTab}` : '';
      const res = await api.get(`/schedules/public${params}`);
      return res.data.data as ScheduleImage[];
    },
  });

  // Fetch latest schedules for hero section
  const { data: latestSchedules } = useQuery({
    queryKey: ['latest-schedules'],
    queryFn: async () => {
      const res = await api.get('/schedules/public/latest');
      return res.data.data as { ship: ScheduleImage | null; air: ScheduleImage | null };
    },
  });

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!previewImage || !schedules) return;

    const currentIndex = schedules.findIndex(s => s.id === previewImage.id);
    let newIndex: number;

    if (direction === 'prev') {
      newIndex = currentIndex === 0 ? schedules.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex === schedules.length - 1 ? 0 : currentIndex + 1;
    }

    setPreviewImage(schedules[newIndex]);
  };

  if (isLoading) {
    return (
      <div className="container-custom py-12 flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size={200} text="กำลังโหลดตารางรอบ..." />
      </div>
    );
  }

  return (
    <motion.div
      className="container-custom py-12"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
    >
      {/* Header */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        >
          <Calendar className="w-16 h-16 text-primary-500 mx-auto mb-4" />
        </motion.div>
        <h1 className="text-4xl font-bold mb-4">ตารางรอบเรือและเครื่องบิน</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          ดูตารางเรือและเครื่องบินสำหรับการจัดส่งสินค้าจากญี่ปุ่นมาไทยประจำเดือน
        </p>
      </motion.div>

      {/* Latest Schedule Cards */}
      {latestSchedules && (latestSchedules.ship || latestSchedules.air) && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Ship Schedule Card */}
          {latestSchedules.ship && (
            <motion.div
              variants={staggerItem}
              className="relative group cursor-pointer overflow-hidden rounded-2xl shadow-lg"
              onClick={() => setPreviewImage(latestSchedules.ship)}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/30 to-transparent z-10" />
              <img
                src={getImageUrl(latestSchedules.ship.imageUrl)}
                alt={latestSchedules.ship.title}
                className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                <div className="flex items-center gap-2 mb-2">
                  <Ship className="w-6 h-6 text-white" />
                  <span className="text-white/80 text-sm font-medium">ทางเรือ (SEA)</span>
                </div>
                <h3 className="text-2xl font-bold text-white">{latestSchedules.ship.title}</h3>
                <p className="text-white/70 mt-1">
                  {MONTHS[latestSchedules.ship.month]} {latestSchedules.ship.year}
                </p>
                <motion.div
                  className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm"
                  whileHover={{ scale: 1.05 }}
                >
                  <ZoomIn className="w-4 h-4" />
                  คลิกเพื่อดูเต็มจอ
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Air Schedule Card */}
          {latestSchedules.air && (
            <motion.div
              variants={staggerItem}
              className="relative group cursor-pointer overflow-hidden rounded-2xl shadow-lg"
              onClick={() => setPreviewImage(latestSchedules.air)}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-sky-900/90 via-sky-900/30 to-transparent z-10" />
              <img
                src={getImageUrl(latestSchedules.air.imageUrl)}
                alt={latestSchedules.air.title}
                className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                <div className="flex items-center gap-2 mb-2">
                  <Plane className="w-6 h-6 text-white" />
                  <span className="text-white/80 text-sm font-medium">ทางอากาศ (AIR)</span>
                </div>
                <h3 className="text-2xl font-bold text-white">{latestSchedules.air.title}</h3>
                <p className="text-white/70 mt-1">
                  {MONTHS[latestSchedules.air.month]} {latestSchedules.air.year}
                </p>
                <motion.div
                  className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm"
                  whileHover={{ scale: 1.05 }}
                >
                  <ZoomIn className="w-4 h-4" />
                  คลิกเพื่อดูเต็มจอ
                </motion.div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Tab Filter */}
      <div className="flex justify-center gap-2 mb-8">
        <motion.button
          onClick={() => setActiveTab('all')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`px-6 py-3 rounded-xl font-medium transition ${
            activeTab === 'all'
              ? 'bg-primary-500 text-white shadow-lg'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ทั้งหมด
        </motion.button>
        <motion.button
          onClick={() => setActiveTab('ship')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`px-6 py-3 rounded-xl font-medium transition flex items-center gap-2 ${
            activeTab === 'ship'
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Ship className="w-5 h-5" />
          ทางเรือ
        </motion.button>
        <motion.button
          onClick={() => setActiveTab('air')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`px-6 py-3 rounded-xl font-medium transition flex items-center gap-2 ${
            activeTab === 'air'
              ? 'bg-sky-500 text-white shadow-lg'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Plane className="w-5 h-5" />
          ทางอากาศ
        </motion.button>
      </div>

      {/* All Schedules Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <AnimatePresence mode="popLayout">
          {schedules?.map((schedule) => (
            <motion.div
              key={schedule.id}
              layout
              variants={staggerItem}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="card overflow-hidden group cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => setPreviewImage(schedule)}
            >
              <div className="relative -mx-6 -mt-6 mb-4 overflow-hidden">
                <img
                  src={getImageUrl(schedule.imageUrl)}
                  alt={schedule.title}
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white flex items-center gap-2">
                    <ZoomIn className="w-4 h-4" />
                    ดูเต็มจอ
                  </div>
                </div>
                <div className="absolute top-3 left-3">
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-1 ${
                      schedule.type === 'ship' ? 'bg-blue-500' : 'bg-sky-500'
                    }`}
                  >
                    {schedule.type === 'ship' ? (
                      <>
                        <Ship className="w-3 h-3" /> SEA
                      </>
                    ) : (
                      <>
                        <Plane className="w-3 h-3" /> AIR
                      </>
                    )}
                  </span>
                </div>
              </div>

              <h3 className="font-bold text-lg mb-1">{schedule.title}</h3>
              <p className="text-gray-500 text-sm mb-2">
                {MONTHS[schedule.month]} {schedule.year}
              </p>
              {schedule.description && (
                <p className="text-gray-600 text-sm">{schedule.description}</p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {schedules?.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Calendar className="w-20 h-20 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-500 mb-2">ยังไม่มีตารางรอบ</h3>
          <p className="text-gray-400">กรุณาติดตามตารางรอบใหม่เร็วๆ นี้</p>
        </motion.div>
      )}

      {/* Info Section */}
      <motion.div
        className="mt-12 bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-6 md:p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary-100 rounded-xl">
            <Info className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-primary-800 mb-2">ข้อมูลเพิ่มเติม</h3>
            <ul className="space-y-2 text-primary-700">
              <li className="flex items-center gap-2">
                <Ship className="w-4 h-4" />
                <span><strong>ทางเรือ (SEA):</strong> ใช้เวลาประมาณ 30-45 วัน</span>
              </li>
              <li className="flex items-center gap-2">
                <Plane className="w-4 h-4" />
                <span><strong>ทางอากาศ (AIR):</strong> ใช้เวลาประมาณ 7-14 วัน</span>
              </li>
            </ul>
            <p className="mt-3 text-sm text-primary-600">
              * ระยะเวลาจัดส่งอาจเปลี่ยนแปลงตามสถานการณ์และฤดูกาล
            </p>
          </div>
        </div>
      </motion.div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
            onClick={() => setPreviewImage(null)}
          >
            {/* Close Button */}
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition z-50"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Navigation */}
            {schedules && schedules.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage('prev');
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition z-50"
                >
                  <ChevronLeft className="w-8 h-8 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage('next');
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition z-50"
                >
                  <ChevronRight className="w-8 h-8 text-white" />
                </button>
              </>
            )}

            {/* Image */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-[95vw] max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={getImageUrl(previewImage.imageUrl)}
                alt={previewImage.title}
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              />
              <div className="mt-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1 ${
                      previewImage.type === 'ship' ? 'bg-blue-500' : 'bg-sky-500'
                    }`}
                  >
                    {previewImage.type === 'ship' ? (
                      <>
                        <Ship className="w-3 h-3" /> ทางเรือ
                      </>
                    ) : (
                      <>
                        <Plane className="w-3 h-3" /> ทางอากาศ
                      </>
                    )}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white">{previewImage.title}</h3>
                <p className="text-white/70">
                  {MONTHS[previewImage.month]} {previewImage.year}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SchedulePage;
