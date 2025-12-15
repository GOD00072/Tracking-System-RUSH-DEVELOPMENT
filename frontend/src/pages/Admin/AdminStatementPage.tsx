import { useState, useEffect } from 'react';
import {
  Receipt,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  User,
  Package,
  FileText,
  Eye,
  X,
  TrendingUp,
  Banknote,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import { toast } from 'sonner';

interface VerifiedPayment {
  id: string;
  orderNumber: string;
  orderId: string;
  customerName: string;
  customerId: string;
  productCode: string | null;
  productName: string | null;
  installmentName: string;
  amountBaht: number;
  slipAmount: number;
  paymentMethod: string | null;
  paidAt: string;
  verifiedAt: string;
  proofImageUrl: string | null;
}

interface PendingPayment {
  id: string;
  orderNumber: string;
  orderId: string;
  customerName: string;
  customerId: string;
  productCode: string | null;
  productName: string | null;
  installmentName: string;
  amountBaht: number;
  status: string;
  dueDate: string | null;
  createdAt: string;
}

interface CustomerOrder {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  itemsWithoutPayments: number;
}

interface CustomerAccumulated {
  customerId: string;
  customerName: string;
  lineId: string | null;
  totalPaid: number;
  totalPending: number;
  pendingItems: number;
  orders: CustomerOrder[];
}

interface StatementData {
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalVerified: number;
    totalVerifiedCount: number;
    totalPending: number;
    totalPendingCount: number;
  };
  verifiedPayments: VerifiedPayment[];
  pendingPayments: PendingPayment[];
  customerAccumulated: CustomerAccumulated[];
}

const PAYMENT_METHODS: Record<string, string> = {
  transfer: 'โอนเงิน',
  promptpay: 'PromptPay',
  credit_card: 'บัตรเครดิต',
  cash: 'เงินสด',
  line_pay: 'LINE Pay',
};

const AdminStatementPage = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StatementData | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<'verified' | 'pending' | 'customers'>('verified');
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // Set default dates (last 7 days)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);

    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  // Fetch data when dates change
  useEffect(() => {
    if (startDate && endDate) {
      fetchStatement();
    }
  }, [startDate, endDate]);

  const fetchStatement = async () => {
    setLoading(true);
    try {
      const response = await api.get('/payments/statement', {
        params: { startDate, endDate },
      });
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to load statement');
    } finally {
      setLoading(false);
    }
  };

  const toggleCustomerExpand = (customerId: string) => {
    const newExpanded = new Set(expandedCustomers);
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId);
    } else {
      newExpanded.add(customerId);
    }
    setExpandedCustomers(newExpanded);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Receipt className="w-7 h-7" />
          Statement รายการเงิน
        </h1>
        <p className="text-gray-500 mt-1">รายงานการรับเงินและยอดค้างชำระ</p>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">ช่วงเวลา:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            onClick={fetchStatement}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            ดูรายงาน
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <Banknote className="w-8 h-8 opacity-80" />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">ยืนยันแล้ว</span>
              </div>
              <p className="text-3xl font-bold">
                {Math.ceil(data.summary.totalVerified).toLocaleString()}
              </p>
              <p className="text-sm opacity-80 mt-1">ยอดรับรวม (บาท)</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <CheckCircle className="w-8 h-8 opacity-80" />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">รายการ</span>
              </div>
              <p className="text-3xl font-bold">{data.summary.totalVerifiedCount}</p>
              <p className="text-sm opacity-80 mt-1">รายการยืนยันแล้ว</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <Clock className="w-8 h-8 opacity-80" />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">รอชำระ</span>
              </div>
              <p className="text-3xl font-bold">
                {Math.ceil(data.summary.totalPending).toLocaleString()}
              </p>
              <p className="text-sm opacity-80 mt-1">ยอดรอชำระ (บาท)</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between mb-3">
                <TrendingUp className="w-8 h-8 opacity-80" />
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">รายการ</span>
              </div>
              <p className="text-3xl font-bold">{data.summary.totalPendingCount}</p>
              <p className="text-sm opacity-80 mt-1">รายการรอชำระ</p>
            </div>
          </div>

          {/* Period Display */}
          <div className="bg-gray-100 rounded-lg px-4 py-2 mb-6 text-sm text-gray-600">
            ช่วงเวลา: {formatDate(data.period.start)} - {formatDate(data.period.end)}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('verified')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'verified'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <CheckCircle className="w-4 h-4 inline mr-2" />
              ยืนยันแล้ว ({data.summary.totalVerifiedCount})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'pending'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              ยังไม่ยืนยัน ({data.summary.totalPendingCount})
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'customers'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              ยอดสะสมลูกค้า ({data.customerAccumulated.length})
            </button>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Verified Payments Tab */}
            {activeTab === 'verified' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ลูกค้า</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">งวด</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">วิธีชำระ</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">ยอดชำระ</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">ยอดในสลิป</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">วันที่ชำระ</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">สลิป</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.verifiedPayments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                          <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p>ไม่มีรายการในช่วงเวลานี้</p>
                        </td>
                      </tr>
                    ) : (
                      data.verifiedPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className="font-medium text-primary-600">{payment.orderNumber}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-gray-800">{payment.customerName}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600">{payment.installmentName}</span>
                            {payment.productName && (
                              <p className="text-xs text-gray-400">{payment.productName}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {PAYMENT_METHODS[payment.paymentMethod || ''] || payment.paymentMethod || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-semibold text-green-600">
                              {Math.ceil(payment.amountBaht).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={payment.slipAmount !== payment.amountBaht ? 'text-orange-600' : 'text-gray-600'}>
                              {Math.ceil(payment.slipAmount).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600">{formatDateTime(payment.paidAt)}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {payment.proofImageUrl ? (
                              <button
                                onClick={() => setViewingImage(payment.proofImageUrl)}
                                className="w-10 h-10 rounded-lg overflow-hidden border-2 border-green-300 hover:border-green-500 transition-colors mx-auto block"
                              >
                                <img
                                  src={payment.proofImageUrl}
                                  alt="สลิป"
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {data.verifiedPayments.length > 0 && (
                    <tfoot className="bg-green-50 border-t-2 border-green-200">
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-right font-semibold text-gray-700">
                          รวมทั้งหมด ({data.verifiedPayments.length} รายการ):
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-green-700 text-lg">
                          {Math.ceil(data.summary.totalVerified).toLocaleString()}
                        </td>
                        <td colSpan={3}></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {/* Pending Payments Tab */}
            {activeTab === 'pending' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ลูกค้า</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">งวด/สินค้า</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">ยอดค้างชำระ</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">กำหนดชำระ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.pendingPayments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                          <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p>ไม่มีรายการรอชำระ</p>
                        </td>
                      </tr>
                    ) : (
                      data.pendingPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className="font-medium text-primary-600">{payment.orderNumber}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-gray-800">{payment.customerName}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600">{payment.installmentName}</span>
                            {payment.productName && (
                              <p className="text-xs text-gray-400">{payment.productName}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-semibold text-orange-600">
                              {Math.ceil(payment.amountBaht).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              payment.status === 'paid'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {payment.status === 'paid' ? 'รอยืนยัน' : 'รอชำระ'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600">
                              {payment.dueDate ? formatDate(payment.dueDate) : '-'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {data.pendingPayments.length > 0 && (
                    <tfoot className="bg-yellow-50 border-t-2 border-yellow-200">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right font-semibold text-gray-700">
                          รวมทั้งหมด ({data.pendingPayments.length} รายการ):
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-orange-700 text-lg">
                          {Math.ceil(data.summary.totalPending).toLocaleString()}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {/* Customer Accumulated Tab */}
            {activeTab === 'customers' && (
              <div className="divide-y divide-gray-100">
                {data.customerAccumulated.length === 0 ? (
                  <div className="px-4 py-12 text-center text-gray-400">
                    <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>ไม่มีข้อมูลลูกค้า</p>
                  </div>
                ) : (
                  data.customerAccumulated.map((customer) => {
                    const isExpanded = expandedCustomers.has(customer.customerId);
                    const totalOutstanding = customer.orders.reduce((sum, o) => sum + o.pendingAmount, 0);

                    return (
                      <div key={customer.customerId}>
                        {/* Customer Header */}
                        <div
                          className="px-4 py-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                          onClick={() => toggleCustomerExpand(customer.customerId)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{customer.customerName}</p>
                              <p className="text-sm text-gray-500">
                                {customer.orders.length} ออเดอร์
                                {customer.pendingItems > 0 && (
                                  <span className="ml-2 text-red-500">
                                    ({customer.pendingItems} สินค้ายังไม่สร้างงวด)
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-sm text-gray-500">ชำระแล้ว</p>
                              <p className="font-semibold text-green-600">
                                {Math.ceil(customer.totalPaid).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">ค้างชำระ</p>
                              <p className="font-semibold text-orange-600">
                                {Math.ceil(totalOutstanding).toLocaleString()}
                              </p>
                            </div>
                            {customer.pendingItems > 0 && (
                              <div className="text-right">
                                <p className="text-sm text-gray-500">สินค้าไม่มีงวด</p>
                                <p className="font-semibold text-red-600">
                                  {customer.pendingItems} รายการ
                                </p>
                              </div>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>

                        {/* Expanded Orders */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="bg-gray-50 border-t"
                            >
                              <div className="p-4">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-gray-500">
                                      <th className="text-left py-2">Order</th>
                                      <th className="text-right py-2">ยอดรวม</th>
                                      <th className="text-right py-2">ชำระแล้ว</th>
                                      <th className="text-right py-2">ค้างชำระ</th>
                                      <th className="text-right py-2">สินค้าไม่มีงวด</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {customer.orders.map((order) => (
                                      <tr key={order.orderId} className="border-t border-gray-200">
                                        <td className="py-2">
                                          <span className="text-primary-600 font-medium">{order.orderNumber}</span>
                                        </td>
                                        <td className="py-2 text-right">
                                          {Math.ceil(order.totalAmount).toLocaleString()}
                                        </td>
                                        <td className="py-2 text-right text-green-600">
                                          {Math.ceil(order.paidAmount).toLocaleString()}
                                        </td>
                                        <td className="py-2 text-right text-orange-600 font-semibold">
                                          {Math.ceil(order.pendingAmount).toLocaleString()}
                                        </td>
                                        <td className="py-2 text-right">
                                          {order.itemsWithoutPayments > 0 ? (
                                            <span className="text-red-600 font-semibold">
                                              {order.itemsWithoutPayments}
                                            </span>
                                          ) : (
                                            <span className="text-gray-400">-</span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot className="border-t-2 border-gray-300">
                                    <tr className="font-semibold">
                                      <td className="py-2">รวม</td>
                                      <td className="py-2 text-right">
                                        {Math.ceil(customer.orders.reduce((s, o) => s + o.totalAmount, 0)).toLocaleString()}
                                      </td>
                                      <td className="py-2 text-right text-green-600">
                                        {Math.ceil(customer.totalPaid).toLocaleString()}
                                      </td>
                                      <td className="py-2 text-right text-orange-600">
                                        {Math.ceil(totalOutstanding).toLocaleString()}
                                      </td>
                                      <td className="py-2 text-right text-red-600">
                                        {customer.pendingItems > 0 ? customer.pendingItems : '-'}
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Image Viewer Modal */}
      <AnimatePresence>
        {viewingImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
            onClick={() => setViewingImage(null)}
          >
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={viewingImage}
              alt="หลักฐานการชำระเงิน"
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminStatementPage;
