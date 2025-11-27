import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Package, MapPin, Truck, CheckCircle, Phone, ExternalLink, Sparkles, Shield, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { pageTransition, staggerContainer, staggerItem } from '../lib/animations';
import api from '../lib/api';

// 8-step status timeline
const STATUS_STEPS = [
  { step: 1, name: 'รับออเดอร์', icon: '📋' },
  { step: 2, name: 'ชำระเงินงวดแรก', icon: '💳' },
  { step: 3, name: 'สั่งซื้อจากญี่ปุ่น', icon: '🛒' },
  { step: 4, name: 'ของถึงโกดังญี่ปุ่น', icon: '📦' },
  { step: 5, name: 'ส่งออกจากญี่ปุ่น', icon: '✈️' },
  { step: 6, name: 'ของถึงไทย', icon: '🇹🇭' },
  { step: 7, name: 'กำลังจัดส่ง', icon: '🚚' },
  { step: 8, name: 'ส่งมอบสำเร็จ', icon: '✅' },
];

interface OrderItem {
  sequenceNumber: number;
  productCode: string;
  productName: string | null;
  productUrl: string;
  productImage: string | null;
  priceYen: number;
  priceBaht: number;
  statusStep: number;
  statusName: string;
  paymentStatus: string;
  paymentStatusName: string;
  trackingNumber: string | null;
  remarks: string;
}

interface Order {
  orderNumber: string;
  status: string;
  statusName?: string;
  shippingMethod: string;
  origin: string;
  destination: string;
  customerName: string;
  createdAt: string;
  items: OrderItem[];
  summary: {
    totalItems: number;
    totalYen: number;
    totalBaht: number;
  };
}

interface VerificationData {
  orderNumber: string;
  customerName: string;
  shippingMethod: string;
  createdAt: string;
  requiresVerification: boolean;
  maskedPhone: string;
}

const TrackingPortal = () => {
  const { t } = useTranslation();
  const { orderNumber: urlOrderNumber } = useParams<{ orderNumber?: string }>();
  const [searchType, setSearchType] = useState<'phone' | 'order'>('phone');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ orders: Order[]; customerName?: string } | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // Verification state
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [phoneLast4, setPhoneLast4] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Auto-check when orderNumber is in URL
  useEffect(() => {
    if (urlOrderNumber) {
      setSearchType('order');
      setSearchValue(urlOrderNumber);
      checkOrderVerification(urlOrderNumber);
    }
  }, [urlOrderNumber]);

  const checkOrderVerification = async (orderNum: string) => {
    setLoading(true);
    setError(null);
    setVerificationData(null);
    setResult(null);

    try {
      const response = await api.get(`/tracking/${orderNum}`);

      if (response.data.success) {
        const data = response.data.data;
        if (data.requiresVerification) {
          // Show verification form
          setVerificationData(data);
        } else {
          // No verification needed, fetch full details
          await fetchOrderDetails(orderNum);
        }
      } else {
        setError(response.data.error?.message || 'ไม่พบข้อมูล');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'ไม่พบออเดอร์นี้');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderNum: string) => {
    try {
      // For orders without verification, we need to verify with empty or skip
      const response = await api.post('/tracking/verify', {
        orderNumber: orderNum,
        phoneLast4: '0000', // Placeholder for orders without phone
      });

      if (response.data.success) {
        setResult({
          orders: [response.data.data],
          customerName: response.data.data.customerName,
        });
        setExpandedOrder(response.data.data.orderNumber);
      }
    } catch (err: any) {
      // If verification fails, still show error
      setError(err.response?.data?.error?.message || 'ไม่พบออเดอร์นี้');
    }
  };

  const handleVerification = async () => {
    if (!verificationData || phoneLast4.length !== 4) {
      setVerificationError('กรุณากรอกเบอร์โทร 4 ตัวหลัง');
      return;
    }

    setVerifying(true);
    setVerificationError(null);

    try {
      const response = await api.post('/tracking/verify', {
        orderNumber: verificationData.orderNumber,
        phoneLast4,
      });

      if (response.data.success) {
        setVerificationData(null);
        setResult({
          orders: [response.data.data],
          customerName: response.data.data.customerName,
        });
        setExpandedOrder(response.data.data.orderNumber);
      } else {
        setVerificationError(response.data.error?.message || 'ยืนยันไม่สำเร็จ');
      }
    } catch (err: any) {
      setVerificationError(err.response?.data?.error?.message || 'เบอร์โทร 4 ตัวหลังไม่ถูกต้อง');
    } finally {
      setVerifying(false);
    }
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      setError('กรุณากรอกข้อมูลเพื่อค้นหา');
      return;
    }

    setLoading(true);
    setError(null);
    setVerificationData(null);

    try {
      let response;
      if (searchType === 'phone') {
        response = await api.get('/tracking/lookup', {
          params: { phone: searchValue },
        });

        if (response.data.success) {
          setResult(response.data.data);
          if (response.data.data.orders.length === 1) {
            setExpandedOrder(response.data.data.orders[0].orderNumber);
          }
        } else {
          setError(response.data.error?.message || 'ไม่พบข้อมูล');
          setResult(null);
        }
      } else {
        // For order number search, check verification first
        await checkOrderVerification(searchValue);
        return;
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'เกิดข้อผิดพลาดในการค้นหา');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const StatusTimeline = ({ currentStep }: { currentStep: number }) => (
    <div className="flex items-center justify-between w-full max-w-4xl mx-auto py-4">
      {STATUS_STEPS.map((step, index) => (
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
            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
              currentStep > step.step
                ? 'bg-green-500 text-white'
                : currentStep === step.step
                ? 'bg-primary-500 text-white ring-4 ring-primary-200'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {currentStep > step.step ? <CheckCircle className="w-6 h-6" /> : step.icon}
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
      ))}
    </div>
  );

  const PaymentBadge = ({ status, name }: { status: string; name: string }) => {
    const colors: Record<string, string> = {
      pending: 'bg-red-100 text-red-700',
      partial: 'bg-yellow-100 text-yellow-700',
      paid: 'bg-green-100 text-green-700',
      refunded: 'bg-gray-100 text-gray-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.pending}`}>
        {name}
      </span>
    );
  };

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

          {/* Verification Form */}
          <AnimatePresence mode="wait">
            {verificationData && (
              <motion.div
                key="verification"
                className="max-w-md mx-auto mb-8"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/50 shadow-xl">
                  {/* Lock Icon */}
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-gray-800 text-center mb-2">ยืนยันตัวตน</h2>
                  <p className="text-gray-500 text-center mb-6 text-sm">
                    กรุณากรอกเบอร์โทร 4 ตัวหลังเพื่อดูรายละเอียดออเดอร์
                  </p>

                  {/* Order Preview */}
                  <div className="bg-gradient-to-r from-primary-50/50 to-orange-50/50 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{verificationData.orderNumber}</p>
                        <p className="text-sm text-gray-500">{verificationData.customerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-primary-500" />
                      <span>เบอร์โทร: {verificationData.maskedPhone}</span>
                    </div>
                  </div>

                  {/* Phone Input */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เบอร์โทร 4 ตัวหลัง
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        maxLength={4}
                        value={phoneLast4}
                        onChange={(e) => setPhoneLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        onKeyDown={(e) => e.key === 'Enter' && handleVerification()}
                        placeholder="XXXX"
                        className="w-full pl-12 pr-4 py-4 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-2xl font-bold tracking-[0.5em] transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Error */}
                  {verificationError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 bg-red-50/80 border border-red-200 rounded-xl text-red-700 text-sm text-center"
                    >
                      {verificationError}
                    </motion.div>
                  )}

                  {/* Verify Button */}
                  <motion.button
                    onClick={handleVerification}
                    disabled={verifying || phoneLast4.length !== 4}
                    className="w-full bg-gradient-to-br from-primary-500 to-primary-600 text-white py-4 rounded-xl hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25 transition-all duration-300 font-semibold"
                    whileTap={{ scale: 0.98 }}
                  >
                    {verifying ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Shield className="w-5 h-5" />
                        ยืนยันและดูออเดอร์
                      </>
                    )}
                  </motion.button>

                  {/* Back Button */}
                  <button
                    onClick={() => {
                      setVerificationData(null);
                      setPhoneLast4('');
                      setVerificationError(null);
                    }}
                    className="w-full mt-3 py-3 text-gray-500 hover:text-gray-700 text-sm transition-colors"
                  >
                    ← ค้นหาใหม่
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Card - Show only if no verification in progress */}
          {!verificationData && (
            <motion.div
              className="max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/50 shadow-xl">
                <h2 className="text-lg font-semibold text-gray-800 mb-6">ค้นหาออเดอร์</h2>

                {/* Search Type Toggle */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setSearchType('phone')}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                      searchType === 'phone'
                        ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                        : 'bg-white/80 text-gray-600 hover:bg-white border border-gray-200'
                    }`}
                  >
                    <Phone className="w-4 h-4 inline mr-2" />
                    ค้นหาด้วยเบอร์โทร
                  </button>
                  <button
                    onClick={() => setSearchType('order')}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                      searchType === 'order'
                        ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                        : 'bg-white/80 text-gray-600 hover:bg-white border border-gray-200'
                    }`}
                  >
                    <Package className="w-4 h-4 inline mr-2" />
                    ค้นหาด้วยเลขออเดอร์
                  </button>
                </div>

                {/* Search Input */}
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder={searchType === 'phone' ? 'กรอกเบอร์โทรศัพท์...' : 'กรอกหมายเลขออเดอร์...'}
                    className="flex-1 px-5 py-4 bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                  />
                  <motion.button
                    onClick={handleSearch}
                    disabled={loading}
                    className="bg-gradient-to-br from-primary-500 to-primary-600 text-white px-8 py-4 rounded-xl hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary-500/25 transition-all duration-300"
                    whileTap={{ scale: 0.95 }}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Search className="w-5 h-5" />
                        ค้นหา
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
          )}
        </div>
      </section>

      {/* Results Section */}
      <AnimatePresence>
        {result && result.orders.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="py-8"
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Customer Info */}
              {result.customerName && (
                <motion.div
                  className="mb-8 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-gray-500">ลูกค้า</p>
                      <p className="font-semibold text-gray-800">{result.customerName}</p>
                    </div>
                    <div className="h-8 w-px bg-gray-200 mx-2" />
                    <div className="text-left">
                      <p className="text-sm text-gray-500">พบ</p>
                      <p className="font-semibold text-primary-600">{result.orders.length} ออเดอร์</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Orders List */}
              <motion.div
                className="space-y-6"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {result.orders.map((order) => (
                  <motion.div
                    key={order.orderNumber}
                    className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300"
                    variants={staggerItem}
                  >
                    {/* Order Header */}
                    <button
                      onClick={() =>
                        setExpandedOrder(expandedOrder === order.orderNumber ? null : order.orderNumber)
                      }
                      className="w-full p-6 flex items-center justify-between hover:bg-white/50 transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
                          {order.shippingMethod === 'ทางอากาศ' ? (
                            <span className="text-2xl">✈️</span>
                          ) : (
                            <span className="text-2xl">🚢</span>
                          )}
                        </div>
                        <div className="text-left">
                          <h3 className="font-bold text-gray-800 text-lg">{order.orderNumber}</h3>
                          <p className="text-gray-500 text-sm">
                            {order.shippingMethod} • {order.summary.totalItems} รายการ
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary-600">฿{order.summary.totalBaht.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                    </button>

                    {/* Order Details (Expanded) */}
                    <AnimatePresence>
                      {expandedOrder === order.orderNumber && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-gray-100"
                        >
                          {/* Status Timeline */}
                          <div className="p-6 bg-gradient-to-r from-primary-50/50 to-orange-50/50 backdrop-blur-sm overflow-x-auto">
                            <StatusTimeline currentStep={Math.max(...order.items.map((i) => i.statusStep || 1))} />
                          </div>

                          {/* Shipping Info */}
                          <div className="p-6 grid grid-cols-2 gap-4 border-b border-gray-100">
                            <div className="group flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                                <MapPin className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">ต้นทาง</p>
                                <p className="font-medium text-gray-800">{order.origin || 'ญี่ปุ่น'}</p>
                              </div>
                            </div>
                            <div className="group flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                                <Truck className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">ปลายทาง</p>
                                <p className="font-medium text-gray-800">{order.destination || 'ไทย'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Items List */}
                          <div className="p-6">
                            <h4 className="font-semibold text-gray-800 mb-4">รายการสินค้า</h4>
                            <div className="space-y-4">
                              {order.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="group flex items-center gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 hover:bg-white/80 transition-all duration-300"
                                >
                                  {/* Product Image */}
                                  {item.productImage ? (
                                    <img
                                      src={item.productImage}
                                      alt={item.productCode || 'Product'}
                                      className="w-16 h-16 object-cover rounded-xl shadow-md"
                                    />
                                  ) : (
                                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                                      <Package className="w-6 h-6 text-gray-400" />
                                    </div>
                                  )}

                                  {/* Product Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm text-gray-500">#{item.sequenceNumber}</span>
                                      {item.productCode && (
                                        <code className="text-sm bg-gray-100 px-2 py-0.5 rounded-lg">
                                          {item.productCode}
                                        </code>
                                      )}
                                    </div>
                                    {item.productName && (
                                      <p className="text-sm font-medium text-gray-800 mt-1 line-clamp-2">
                                        {item.productName}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                      <span
                                        className={`text-xs px-2 py-0.5 rounded-full ${
                                          item.statusStep === 8
                                            ? 'bg-green-100 text-green-700'
                                            : item.statusStep >= 5
                                            ? 'bg-primary-100 text-primary-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                        }`}
                                      >
                                        {item.statusName}
                                      </span>
                                      <PaymentBadge status={item.paymentStatus} name={item.paymentStatusName} />
                                    </div>
                                    {item.trackingNumber && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        Tracking: <code className="bg-gray-100 px-1 rounded">{item.trackingNumber}</code>
                                      </p>
                                    )}
                                  </div>

                                  {/* Price */}
                                  <div className="text-right">
                                    {item.priceYen > 0 && (
                                      <p className="text-sm text-gray-500">¥{item.priceYen.toLocaleString()}</p>
                                    )}
                                    {item.priceBaht > 0 && (
                                      <p className="font-semibold text-primary-600">฿{item.priceBaht.toLocaleString()}</p>
                                    )}
                                  </div>

                                  {/* Product Link */}
                                  {item.productUrl && (
                                    <a
                                      href={item.productUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                                    >
                                      <ExternalLink className="w-5 h-5" />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Summary */}
                          <div className="p-6 bg-gradient-to-r from-primary-50/50 to-orange-50/50 backdrop-blur-sm border-t border-gray-100">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 font-medium">ยอดรวม ({order.summary.totalItems} รายการ)</span>
                              <div className="text-right">
                                {order.summary.totalYen > 0 && (
                                  <p className="text-sm text-gray-500">¥{order.summary.totalYen.toLocaleString()}</p>
                                )}
                                <p className="text-2xl font-bold text-primary-600">
                                  ฿{order.summary.totalBaht.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* No Results */}
      {result && result.orders.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto px-4 text-center py-12"
        >
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-12 border border-white/50 shadow-xl">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">ไม่พบออเดอร์</h3>
            <p className="text-gray-400">กรุณาตรวจสอบข้อมูลและลองอีกครั้ง</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TrackingPortal;
