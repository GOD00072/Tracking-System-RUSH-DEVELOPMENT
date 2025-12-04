import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Package, Truck, CheckCircle, Sparkles, ClipboardList, CreditCard, ShoppingCart, Warehouse, Plane, CalendarCheck, PackageCheck, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { pageTransition } from '../lib/animations';
import api from '../lib/api';

// 9-step status timeline with Lucide icons and descriptions
const STATUS_STEPS = [
  { step: 1, name: 'รับออเดอร์', Icon: ClipboardList, description: 'รอยืนยันรายละเอียดและราคา' },
  { step: 2, name: 'ชำระเงินงวดแรก', Icon: CreditCard, description: 'ชำระมัดจำเรียบร้อย' },
  { step: 3, name: 'สั่งซื้อจากญี่ปุ่น', Icon: ShoppingCart, description: 'กดสั่งซื้อจากร้านค้าแล้ว' },
  { step: 4, name: 'ของถึงโกดังญี่ปุ่น', Icon: Warehouse, description: 'ตรวจสอบและรวมพัสดุ' },
  { step: 5, name: 'จัดรอบส่งกลับ', Icon: CalendarCheck, description: 'กำหนดรอบเรือ/เครื่องบิน' },
  { step: 6, name: 'ส่งออกจากญี่ปุ่น', Icon: Plane, description: 'กำลังเดินทางมาไทย' },
  { step: 7, name: 'ของถึงไทย', Icon: Package, description: 'ผ่านพิธีการศุลกากร' },
  { step: 8, name: 'กำลังจัดส่ง', Icon: Truck, description: 'จัดส่งผ่านขนส่งเอกชน' },
  { step: 9, name: 'ส่งมอบสำเร็จ', Icon: PackageCheck, description: 'ลูกค้ารับสินค้าแล้ว' },
];

// Item details
interface ItemData {
  trackingCode: string | null;
  productCode: string | null;
  productName: string | null;
  productImage: string | null;
  productImages: string[];
  statusStep: number;
  statusName: string;
  trackingNumber: string | null;
  shippingRound: string | null;
  statusDetails?: {
    jpOrderNumber: string | null;
    jpOrderDate: string | null;
    warehouseDate: string | null;
    shipmentBatch: string | null;
    exportDate: string | null;
    arrivalDate: string | null;
    courierName: string | null;
    deliveryDate: string | null;
    remarks: Record<string, string>;
  };
  statusHistory: Array<{
    statusStep: number;
    statusName: string;
    timestamp: string;
  }>;
}

// Result when searching - can be 'order' (multiple items) or 'item' (single item)
interface TrackingResult {
  type: 'order' | 'item';
  trackingCode: string;
  // For type === 'order'
  orderNumber?: string;
  statusStep: number;
  statusName: string;
  shippingMethod: string;
  origin?: string;
  destination?: string;
  customerName: string;
  createdAt: string;
  items?: ItemData[];
  totalItems?: number;
  // For type === 'item' (single item result)
  productCode?: string | null;
  productName?: string | null;
  productImage?: string | null;
  productImages?: string[];
  trackingNumber?: string | null;
  shippingRound?: string | null;
  statusDetails?: ItemData['statusDetails'];
  statusHistory?: ItemData['statusHistory'];
  order?: {
    orderNumber: string;
    trackingCode?: string;
    shippingMethod: string;
    createdAt: string;
    customerName: string;
  };
}

const TrackingPortal = () => {
  const { t } = useTranslation();
  const { productCode: urlTrackingCode } = useParams<{ productCode?: string }>();
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemData | null>(null); // For viewing item details in order result

  // Auto-search when trackingCode is in URL
  useEffect(() => {
    if (urlTrackingCode) {
      setSearchValue(urlTrackingCode);
      searchByTrackingCode(urlTrackingCode);
    }
  }, [urlTrackingCode]);

  const searchByTrackingCode = async (code: string) => {
    setLoading(true);
    setError(null);
    setTrackingResult(null);
    setSelectedImageIndex(0);
    setLightboxOpen(false);
    setSelectedItem(null);

    try {
      const response = await api.get(`/tracking/item/${code.trim()}`);

      if (response.data.success) {
        setTrackingResult(response.data.data);
      } else {
        setError(response.data.error?.message || 'ไม่พบรหัสติดตามนี้');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'ไม่พบรหัสติดตามนี้ในระบบ');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      setError('กรุณากรอกรหัสติดตามเพื่อค้นหา');
      return;
    }
    await searchByTrackingCode(searchValue);
  };

  const StatusTimeline = ({ currentStep }: { currentStep: number }) => (
    <div className="flex items-center justify-between w-full max-w-4xl mx-auto py-4">
      {STATUS_STEPS.map((step, index) => {
        const StepIcon = step.Icon;
        return (
          <div key={step.step} className="flex flex-col items-center relative flex-1">
            {/* Connector line */}
            {index > 0 && (
              <div
                className={`absolute top-5 right-1/2 w-full h-1 -z-10 ${
                  currentStep >= step.step ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
            {/* Step circle */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                currentStep > step.step
                  ? 'bg-green-500 text-white'
                  : currentStep === step.step
                  ? 'bg-primary-500 text-white ring-4 ring-primary-200'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {currentStep > step.step ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <StepIcon className="w-5 h-5" />
              )}
            </div>
            {/* Step label */}
            <span
              className={`mt-2 text-xs text-center ${
                currentStep >= step.step ? 'text-gray-800 font-medium' : 'text-gray-400'
              }`}
            >
              {step.name}
            </span>
          </div>
        );
      })}
    </div>
  );


  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
      className="min-h-screen"
    >
      {/* Hero Section */}
      <section className="relative py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm border border-primary-200 text-primary-600 text-sm font-medium mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="w-4 h-4" />
              {t('tracking.title')}
            </motion.div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {t('nav.tracking')}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              ตรวจสอบสถานะการจัดส่งสินค้าของคุณได้ทันที
            </p>
          </motion.div>

          {/* Search Card */}
          <motion.div
              className="max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/50 shadow-xl">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 mb-4 shadow-lg shadow-primary-500/25">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800">กรอกรหัสติดตาม</h2>
                  <p className="text-sm text-gray-500 mt-1">ตรวจสอบสถานะจากรหัสที่ได้รับจากร้าน</p>
                </div>

                {/* Search Input */}
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="PKN-ORD001-01-A3B"
                    className="flex-1 px-5 py-4 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 text-center font-mono text-lg tracking-wider"
                  />
                  <motion.button
                    onClick={handleSearch}
                    disabled={loading}
                    className="bg-gradient-to-br from-primary-500 to-primary-600 text-white px-6 py-4 rounded-xl hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary-500/25 transition-all duration-300"
                    whileTap={{ scale: 0.95 }}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Search className="w-5 h-5" />
                        <span className="hidden sm:inline">ค้นหา</span>
                      </>
                    )}
                  </motion.button>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl text-red-700"
                  >
                    {error}
                  </motion.div>
                )}
              </div>
            </motion.div>
        </div>
      </section>

      {/* Tracking Result */}
      <AnimatePresence>
        {trackingResult && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="py-8"
          >
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Order Result - แสดงรายการสินค้าทั้งหมด */}
              {trackingResult.type === 'order' && (
                <motion.div
                  className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl overflow-hidden"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  {/* Order Header */}
                  <div className="p-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                        <Package className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white/80 font-mono">รหัสติดตาม: {trackingResult.trackingCode}</p>
                        <h3 className="text-xl font-bold mt-1">
                          ออเดอร์ {trackingResult.orderNumber}
                        </h3>
                        <p className="text-sm text-white/80 mt-1">
                          {trackingResult.customerName} • {trackingResult.shippingMethod}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-white/80">สินค้า</p>
                        <p className="text-2xl font-bold">{trackingResult.totalItems || 0}</p>
                        <p className="text-xs text-white/60">รายการ</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Status Timeline */}
                  <div className="p-6 border-b border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-600 mb-4">สถานะออเดอร์</h4>
                    <StatusTimeline currentStep={trackingResult.statusStep} />
                  </div>

                  {/* Items List */}
                  <div className="p-6">
                    <h4 className="text-sm font-semibold text-gray-600 mb-4">รายการสินค้า ({trackingResult.items?.length || 0} รายการ)</h4>
                    <div className="space-y-3">
                      {trackingResult.items?.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedItem(item)}
                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName || 'สินค้า'}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {item.productName || 'สินค้า'}
                            </p>
                            {item.productCode && (
                              <p className="text-xs text-gray-500">SKU: {item.productCode}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {item.trackingCode && <span className="font-mono">{item.trackingCode}</span>}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              item.statusStep === 9 ? 'bg-green-100 text-green-700' :
                              item.statusStep >= 6 ? 'bg-indigo-100 text-indigo-700' :
                              item.statusStep >= 3 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {item.statusName}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {(!trackingResult.items || trackingResult.items.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>ยังไม่มีสินค้าในออเดอร์นี้</p>
                      </div>
                    )}
                  </div>

                  {/* Search Again */}
                  <div className="p-4 text-center border-t border-gray-100">
                    <button
                      onClick={() => {
                        setTrackingResult(null);
                        setSearchValue('');
                      }}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      ← ค้นหาใหม่
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Single Item Result */}
              {trackingResult.type === 'item' && (
                <motion.div
                  className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl overflow-hidden"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  {/* Item Header */}
                  <div className="p-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
                    <div className="flex items-start gap-4">
                      {/* Product Images Gallery */}
                      {(trackingResult.productImages && trackingResult.productImages.length > 0) || trackingResult.productImage ? (
                        <div className="flex flex-col gap-2">
                          {/* Main Image */}
                          <div
                            className="relative cursor-pointer group"
                            onClick={() => setLightboxOpen(true)}
                          >
                            <img
                              src={trackingResult.productImages?.[selectedImageIndex] || trackingResult.productImage || ''}
                              alt={trackingResult.productName || 'สินค้า'}
                              className="w-24 h-24 md:w-28 md:h-28 rounded-xl object-cover border-2 border-white/30 transition-transform group-hover:scale-105"
                            />
                            {trackingResult.productImages && trackingResult.productImages.length > 1 && (
                              <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                                {selectedImageIndex + 1}/{trackingResult.productImages.length}
                              </div>
                            )}
                          </div>
                          {/* Thumbnail Strip */}
                          {trackingResult.productImages && trackingResult.productImages.length > 1 && (
                            <div className="flex gap-1 overflow-x-auto max-w-28 md:max-w-32">
                              {trackingResult.productImages.map((img, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedImageIndex(idx)}
                                  className={`flex-shrink-0 w-6 h-6 rounded border-2 overflow-hidden transition-all ${
                                    idx === selectedImageIndex
                                      ? 'border-white scale-110'
                                      : 'border-white/30 opacity-70 hover:opacity-100'
                                  }`}
                                >
                                  <img
                                    src={img}
                                    alt={`รูปที่ ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl bg-white/20 flex items-center justify-center">
                          <Package className="w-10 h-10 text-white/70" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-white/80 font-mono">{trackingResult.trackingCode}</p>
                        <h3 className="text-xl font-bold mt-1">
                          {trackingResult.productName || 'สินค้า'}
                        </h3>
                        <p className="text-sm text-white/80 mt-1">
                          ออเดอร์: {trackingResult.order?.orderNumber} • {trackingResult.order?.customerName}
                        </p>
                        {trackingResult.productCode && (
                          <p className="text-xs text-white/60 mt-1">SKU: {trackingResult.productCode}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="p-6 border-b border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-600 mb-4">สถานะการจัดส่ง</h4>
                    <StatusTimeline currentStep={trackingResult.statusStep} />
                  </div>

                  {/* Status Details */}
                  <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">สถานะปัจจุบัน</p>
                      <p className={`font-bold ${
                        trackingResult.statusStep === 9 ? 'text-green-600' :
                        trackingResult.statusStep >= 6 ? 'text-indigo-600' :
                        trackingResult.statusStep >= 3 ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        {trackingResult.statusName}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">วิธีจัดส่ง</p>
                      <p className="font-bold text-gray-700">{trackingResult.order?.shippingMethod || trackingResult.shippingMethod}</p>
                    </div>
                    {trackingResult.shippingRound && (
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500 mb-1">รอบส่งกลับ</p>
                        <p className="font-bold text-gray-700">{trackingResult.shippingRound}</p>
                      </div>
                    )}
                    {trackingResult.trackingNumber && (
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-500 mb-1">เลข Tracking</p>
                        <p className="font-bold text-primary-600 font-mono text-sm">{trackingResult.trackingNumber}</p>
                      </div>
                    )}
                  </div>

                  {/* Status History */}
                  {trackingResult.statusHistory && trackingResult.statusHistory.length > 0 && (
                    <div className="p-6 bg-gray-50 border-t border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-600 mb-3">ประวัติสถานะ</h4>
                      <div className="space-y-2">
                        {trackingResult.statusHistory.map((h, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-sm">
                            <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-primary-500' : 'bg-gray-300'}`} />
                            <span className="text-gray-500 w-32">
                              {new Date(h.timestamp).toLocaleDateString('th-TH', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <span className={idx === 0 ? 'font-medium text-gray-800' : 'text-gray-600'}>
                              {h.statusName}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search Again */}
                  <div className="p-4 text-center border-t border-gray-100">
                    <button
                      onClick={() => {
                        setTrackingResult(null);
                        setSearchValue('');
                      }}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      ← ค้นหาใหม่
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Item Detail Modal - สำหรับดูรายละเอียดสินค้าแต่ละชิ้นในผลลัพธ์ Order */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Item Header */}
              <div className="p-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white relative">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-start gap-4">
                  {selectedItem.productImage ? (
                    <img
                      src={selectedItem.productImage}
                      alt={selectedItem.productName || 'สินค้า'}
                      className="w-20 h-20 rounded-xl object-cover border-2 border-white/30"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-white/20 flex items-center justify-center">
                      <Package className="w-8 h-8 text-white/70" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">
                      {selectedItem.productName || 'สินค้า'}
                    </h3>
                    {selectedItem.productCode && (
                      <p className="text-sm text-white/80">SKU: {selectedItem.productCode}</p>
                    )}
                    {selectedItem.trackingCode && (
                      <p className="text-xs text-white/60 font-mono mt-1">{selectedItem.trackingCode}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="p-4 border-b border-gray-100">
                <h4 className="text-sm font-semibold text-gray-600 mb-3">สถานะ</h4>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {STATUS_STEPS.map((step) => {
                    const StepIcon = step.Icon;
                    return (
                      <div key={step.step} className="flex flex-col items-center min-w-[50px]">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            selectedItem.statusStep > step.step
                              ? 'bg-green-500 text-white'
                              : selectedItem.statusStep === step.step
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          {selectedItem.statusStep > step.step ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <StepIcon className="w-4 h-4" />
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500 mt-1 text-center">{step.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Details */}
              <div className="p-4 grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500">สถานะ</p>
                  <p className={`font-bold ${
                    selectedItem.statusStep === 9 ? 'text-green-600' :
                    selectedItem.statusStep >= 6 ? 'text-indigo-600' :
                    'text-gray-700'
                  }`}>
                    {selectedItem.statusName}
                  </p>
                </div>
                {selectedItem.shippingRound && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500">รอบส่ง</p>
                    <p className="font-bold text-gray-700">{selectedItem.shippingRound}</p>
                  </div>
                )}
                {selectedItem.trackingNumber && (
                  <div className="p-3 bg-gray-50 rounded-xl col-span-2">
                    <p className="text-xs text-gray-500">เลข Tracking</p>
                    <p className="font-bold text-primary-600 font-mono">{selectedItem.trackingNumber}</p>
                  </div>
                )}
              </div>

              {/* Status History */}
              {selectedItem.statusHistory && selectedItem.statusHistory.length > 0 && (
                <div className="p-4 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">ประวัติ</h4>
                  <div className="space-y-2">
                    {selectedItem.statusHistory.map((h, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-primary-500' : 'bg-gray-300'}`} />
                        <span className="text-gray-500 text-xs">
                          {new Date(h.timestamp).toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        <span className="text-gray-700">{h.statusName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-full py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                  ปิด
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal - Outside of all containers for fullscreen */}
      {lightboxOpen && trackingResult?.productImages && trackingResult.productImages.length > 0 && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 p-2 bg-white rounded-full text-gray-800 hover:bg-gray-100"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation arrows */}
          {trackingResult.productImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) =>
                    prev === 0 ? trackingResult.productImages!.length - 1 : prev - 1
                  );
                }}
                className="absolute left-4 p-2 bg-white rounded-full text-gray-800 hover:bg-gray-100"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) =>
                    prev === trackingResult.productImages!.length - 1 ? 0 : prev + 1
                  );
                }}
                className="absolute right-4 p-2 bg-white rounded-full text-gray-800 hover:bg-gray-100"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Main image */}
          <img
            src={trackingResult.productImages[selectedImageIndex]}
            alt={`รูปสินค้า ${selectedImageIndex + 1}`}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Image counter */}
          {trackingResult.productImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {trackingResult.productImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex(idx);
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    idx === selectedImageIndex
                      ? 'bg-white scale-125'
                      : 'bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default TrackingPortal;
