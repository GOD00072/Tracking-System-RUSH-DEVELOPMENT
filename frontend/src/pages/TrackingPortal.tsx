import { useState } from 'react';
import { Search, Package, MapPin, Truck, CheckCircle, Clock, CreditCard, ExternalLink, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

const TrackingPortal = () => {
  const [searchType, setSearchType] = useState<'phone' | 'order'>('phone');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ orders: Order[]; customerName?: string } | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      setError('กรุณากรอกข้อมูลเพื่อค้นหา');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response;
      if (searchType === 'phone') {
        response = await api.get('/tracking/lookup', {
          params: { phone: searchValue },
        });
      } else {
        response = await api.get(`/tracking/${searchValue}`);
      }

      if (response.data.success) {
        if (searchType === 'order') {
          setResult({
            orders: [response.data.data],
            customerName: response.data.data.customerName,
          });
          setExpandedOrder(response.data.data.orderNumber);
        } else {
          setResult(response.data.data);
          if (response.data.data.orders.length === 1) {
            setExpandedOrder(response.data.data.orders[0].orderNumber);
          }
        }
      } else {
        setError(response.data.error?.message || 'ไม่พบข้อมูล');
        setResult(null);
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
                ? 'bg-blue-500 text-white ring-4 ring-blue-200'
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Package className="w-10 h-10 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">ติดตามสินค้า</h1>
              <p className="text-gray-500 text-sm">ตรวจสอบสถานะการจัดส่งสินค้าของคุณ</p>
            </div>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">ค้นหาออเดอร์</h2>

          {/* Search Type Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSearchType('phone')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                searchType === 'phone'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Phone className="w-4 h-4 inline mr-2" />
              ค้นหาด้วยเบอร์โทร
            </button>
            <button
              onClick={() => setSearchType('order')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                searchType === 'order'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              ค้นหาด้วยเลขออเดอร์
            </button>
          </div>

          {/* Search Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={searchType === 'phone' ? 'กรอกเบอร์โทรศัพท์...' : 'กรอกหมายเลขออเดอร์...'}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <motion.button
              onClick={handleSearch}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
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
              className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
            >
              {error}
            </motion.div>
          )}
        </div>
      </div>

      {/* Results Section */}
      <AnimatePresence>
        {result && result.orders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-6xl mx-auto px-4 pb-12"
          >
            {/* Customer Info */}
            {result.customerName && (
              <div className="mb-6 text-center">
                <p className="text-gray-600">
                  ลูกค้า: <span className="font-semibold text-gray-800">{result.customerName}</span>
                </p>
                <p className="text-gray-500 text-sm">พบ {result.orders.length} ออเดอร์</p>
              </div>
            )}

            {/* Orders List */}
            <div className="space-y-6">
              {result.orders.map((order) => (
                <div key={order.orderNumber} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  {/* Order Header */}
                  <button
                    onClick={() =>
                      setExpandedOrder(expandedOrder === order.orderNumber ? null : order.orderNumber)
                    }
                    className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        {order.shippingMethod === 'ทางอากาศ' ? (
                          <span className="text-2xl">✈️</span>
                        ) : (
                          <span className="text-2xl">🚢</span>
                        )}
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-gray-800">{order.orderNumber}</h3>
                        <p className="text-gray-500 text-sm">
                          {order.shippingMethod} • {order.summary.totalItems} รายการ
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">฿{order.summary.totalBaht.toLocaleString()}</p>
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
                        <div className="p-6 bg-gray-50 overflow-x-auto">
                          <StatusTimeline currentStep={Math.max(...order.items.map((i) => i.statusStep || 1))} />
                        </div>

                        {/* Shipping Info */}
                        <div className="p-6 grid grid-cols-2 gap-4 border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">ต้นทาง</p>
                              <p className="font-medium">{order.origin || 'ญี่ปุ่น'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Truck className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">ปลายทาง</p>
                              <p className="font-medium">{order.destination || 'ไทย'}</p>
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
                                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
                              >
                                {/* Product Image */}
                                {item.productImage ? (
                                  <img
                                    src={item.productImage}
                                    alt={item.productCode || 'Product'}
                                    className="w-16 h-16 object-cover rounded-lg"
                                  />
                                ) : (
                                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                    <Package className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}

                                {/* Product Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">#{item.sequenceNumber}</span>
                                    <code className="text-sm bg-gray-200 px-2 py-0.5 rounded">
                                      {item.productCode || '-'}
                                    </code>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full ${
                                        item.statusStep === 8
                                          ? 'bg-green-100 text-green-700'
                                          : item.statusStep >= 5
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-yellow-100 text-yellow-700'
                                      }`}
                                    >
                                      {item.statusName}
                                    </span>
                                    <PaymentBadge status={item.paymentStatus} name={item.paymentStatusName} />
                                  </div>
                                  {item.trackingNumber && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Tracking: <code>{item.trackingNumber}</code>
                                    </p>
                                  )}
                                </div>

                                {/* Price */}
                                <div className="text-right">
                                  {item.priceYen > 0 && (
                                    <p className="text-sm text-gray-500">¥{item.priceYen.toLocaleString()}</p>
                                  )}
                                  {item.priceBaht > 0 && (
                                    <p className="font-semibold text-blue-600">฿{item.priceBaht.toLocaleString()}</p>
                                  )}
                                </div>

                                {/* Product Link */}
                                {item.productUrl && (
                                  <a
                                    href={item.productUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-gray-400 hover:text-blue-600"
                                  >
                                    <ExternalLink className="w-5 h-5" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Summary */}
                        <div className="p-6 bg-gray-50 border-t border-gray-100">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">ยอดรวม ({order.summary.totalItems} รายการ)</span>
                            <div className="text-right">
                              {order.summary.totalYen > 0 && (
                                <p className="text-sm text-gray-500">¥{order.summary.totalYen.toLocaleString()}</p>
                              )}
                              <p className="text-xl font-bold text-blue-600">
                                ฿{order.summary.totalBaht.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Results */}
      {result && result.orders.length === 0 && (
        <div className="max-w-2xl mx-auto px-4 text-center py-12">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">ไม่พบออเดอร์</h3>
          <p className="text-gray-400">กรุณาตรวจสอบข้อมูลและลองอีกครั้ง</p>
        </div>
      )}

      {/* Footer */}
      <footer className="py-8 text-center text-gray-500 text-sm">
        <p>หากมีข้อสงสัยกรุณาติดต่อ LINE: @your-line-id</p>
      </footer>
    </div>
  );
};

export default TrackingPortal;
