import { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle,
  Clock,
  Plus,
  Upload,
  X,
  Check,
  AlertCircle,
  Loader2,
  Receipt,
  Calendar,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import { BACKEND_URL } from '../../utils/apiConfig';
import { toast } from 'sonner';

interface PendingPaymentOperation {
  type: 'create' | 'update' | 'delete';
  tempId?: string;
  paymentId?: string;
  data?: any;
}

interface PaymentTabProps {
  orderId: string;
  orderNumber: string;
  onPendingChangesUpdate?: (hasPending: boolean, pendingOps: PendingPaymentOperation[]) => void;
  onPaymentSummaryUpdate?: (summary: { grandTotal: number; paidBaht: number; remainingBaht: number; percentPaid: number }) => void;
  saveVersion?: number; // Changes when parent saves - triggers clear and refetch
}

interface Payment {
  id: string;
  orderItemId: string;
  installmentNumber: number;
  installmentName: string | null;
  amountYen: number | null;
  amountBaht: number | null;
  exchangeRate: number | null;
  status: string;
  paymentMethod: string | null;
  proofImageUrl: string | null;
  dueDate: string | null;
  paidAt: string | null;
  notes: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  productCode?: string;
  productName?: string;
}

interface ItemSummary {
  itemTotal: number;
  paidBaht: number;
  remainingBaht: number;
  percentPaid: number;
  totalPayments: number;
  paidPayments: number;
  pendingPayments: number;
}

interface OrderItem {
  id: string;
  productCode: string | null;
  productName: string | null;
  priceYen: number | null;
  priceBaht: number | null;
  shippingCost: number | null;
  paymentStatus: string | null;
  payments: Payment[];
  itemSummary: ItemSummary;
}

interface PaymentData {
  order: {
    id: string;
    orderNumber: string;
    customer: {
      id: string;
      companyName: string | null;
      contactPerson: string | null;
      lineId: string | null;
    } | null;
  };
  items: OrderItem[];
  summary: {
    totalYen: number;
    totalBaht: number;
    totalShipping: number;
    grandTotal: number;
    paidYen: number;
    paidBaht: number;
    remainingBaht: number;
    percentPaid: number;
    totalPayments: number;
    paidPayments: number;
    pendingPayments: number;
  };
  pendingPayments: Payment[];
  allPayments: Payment[];
}

// Default installment templates for proxy buying business
const DEFAULT_INSTALLMENTS = [
  { number: 1, name: 'มัดจำสินค้า', percentOfTotal: 50, description: 'ชำระก่อนสั่งซื้อจากญี่ปุ่น' },
  { number: 2, name: 'ค่าขนส่งญี่ปุ่น-ไทย', percentOfTotal: 0, description: 'ชำระเมื่อสินค้าถึงโกดังญี่ปุ่น' },
  { number: 3, name: 'ชำระส่วนที่เหลือ', percentOfTotal: 50, description: 'ชำระเมื่อได้รับสินค้า' },
  { number: 4, name: 'อื่นๆ', percentOfTotal: 0, description: 'ระบุยอดเงินเอง' },
];

const PaymentTab = ({ orderId, orderNumber, onPendingChangesUpdate, onPaymentSummaryUpdate, saveVersion }: PaymentTabProps) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PaymentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Pending operations state
  const [pendingOperations, setPendingOperations] = useState<PendingPaymentOperation[]>([]);
  const [lastSaveVersion, setLastSaveVersion] = useState(saveVersion || 0);

  // Modal states
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // Notify parent of pending changes
  useEffect(() => {
    if (onPendingChangesUpdate) {
      onPendingChangesUpdate(pendingOperations.length > 0, pendingOperations);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingOperations]);

  // Notify parent of payment summary
  useEffect(() => {
    if (onPaymentSummaryUpdate && data?.summary) {
      onPaymentSummaryUpdate({
        grandTotal: data.summary.grandTotal,
        paidBaht: data.summary.paidBaht,
        remainingBaht: data.summary.remainingBaht,
        percentPaid: data.summary.percentPaid,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.summary]);

  // Watch for saveVersion changes to clear pending state and refetch
  useEffect(() => {
    if (saveVersion !== undefined && saveVersion !== lastSaveVersion) {
      setLastSaveVersion(saveVersion);
      // Clear pending operations
      setPendingOperations([]);
      // Refetch data
      fetchPayments();
    }
  }, [saveVersion, lastSaveVersion]);

  // Payment method options
  const PAYMENT_METHODS = [
    { value: 'transfer', label: 'โอนเงิน' },
    { value: 'promptpay', label: 'PromptPay' },
    { value: 'credit_card', label: 'บัตรเครดิต' },
    { value: 'cash', label: 'เงินสด' },
    { value: 'line_pay', label: 'LINE Pay' },
  ];

  // Form state for adding payment installment
  const [paymentForm, setPaymentForm] = useState({
    installmentNumber: 1,
    installmentName: 'งวดที่ 1',
    amountBaht: '',
    discount: '',
    fee: '',
    dueDate: '',
    notes: '',
  });

  // Form state for confirming payment (when marking as paid)
  const [confirmPaymentModal, setConfirmPaymentModal] = useState<{
    show: boolean;
    paymentId: string | null;
    paymentMethod: string;
    proofFile: File | null;
    proofPreview: string | null;
  }>({
    show: false,
    paymentId: null,
    paymentMethod: 'transfer',
    proofFile: null,
    proofPreview: null,
  });

  // View payment detail modal
  const [viewPaymentDetail, setViewPaymentDetail] = useState<Payment | null>(null);

  // Fetch payment data
  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/payments/order/${orderId}`);
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [orderId]);

  // Toggle item expansion
  const toggleExpand = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // Create payment installment - saves immediately
  const handleCreatePayment = async () => {
    if (!selectedItem || !data) return;

    // Calculate final amount after discount and fee
    const baseAmount = paymentForm.amountBaht ? parseFloat(paymentForm.amountBaht) : 0;
    const discount = paymentForm.discount ? parseFloat(paymentForm.discount) : 0;
    const fee = paymentForm.fee ? parseFloat(paymentForm.fee) : 0;
    const finalAmount = baseAmount - discount + fee;

    // Validate: Check if total payments would exceed item total (per-item validation)
    const itemTotal = selectedItem.itemSummary?.itemTotal ||
      ((Number(selectedItem.priceBaht) || 0) + (Number(selectedItem.shippingCost) || 0));
    const existingPaymentsTotal = selectedItem.payments.reduce(
      (sum, p) => sum + (Number(p.amountBaht) || 0),
      0
    );
    const newTotal = existingPaymentsTotal + finalAmount;

    if (newTotal > itemTotal) {
      const remaining = itemTotal - existingPaymentsTotal;
      toast.error(`ยอดรวมงวดชำระเกินยอดสินค้า! คงเหลือที่สร้างได้: ฿${remaining.toLocaleString()}`);
      return;
    }

    const payload = {
      orderItemId: selectedItem.id,
      installmentNumber: paymentForm.installmentNumber,
      installmentName: paymentForm.installmentName,
      amountBaht: finalAmount > 0 ? finalAmount : undefined,
      dueDate: paymentForm.dueDate || undefined,
      notes: paymentForm.notes || undefined,
      status: 'pending',
    };

    try {
      await api.post('/payments', payload);
      toast.success('เพิ่มงวดชำระเงินสำเร็จ');
      setShowAddPayment(false);
      resetForm();
      fetchPayments(); // Refresh data
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'เกิดข้อผิดพลาดในการสร้างงวดชำระ');
    }
  };

  // Open confirm payment modal
  const openConfirmPayment = (paymentId: string) => {
    setConfirmPaymentModal({
      show: true,
      paymentId,
      paymentMethod: 'transfer',
      proofFile: null,
      proofPreview: null,
    });
  };

  // Handle confirm payment with proof - saves immediately
  const handleConfirmPayment = async () => {
    if (!confirmPaymentModal.paymentId) return;

    try {
      let proofImageUrl: string | undefined;

      // Upload proof image if provided
      if (confirmPaymentModal.proofFile) {
        const formData = new FormData();
        formData.append('file', confirmPaymentModal.proofFile);

        const uploadResponse = await api.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (uploadResponse.data.success && uploadResponse.data.data.url) {
          proofImageUrl = uploadResponse.data.data.url.startsWith('http')
            ? uploadResponse.data.data.url
            : `${BACKEND_URL}${uploadResponse.data.data.url}`;
        }
      }

      // Save immediately via API
      await api.patch(`/payments/${confirmPaymentModal.paymentId}`, {
        status: 'paid',
        paidAt: new Date().toISOString(),
        paymentMethod: confirmPaymentModal.paymentMethod,
        proofImageUrl,
      });

      toast.success('บันทึกการชำระเงินสำเร็จ');
      setConfirmPaymentModal({ show: false, paymentId: null, paymentMethod: 'transfer', proofFile: null, proofPreview: null });
      fetchPayments(); // Refresh data
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'เกิดข้อผิดพลาด');
    }
  };

  // Verify payment - saves immediately
  const handleVerifyPayment = async (paymentId: string) => {
    try {
      await api.patch(`/payments/${paymentId}`, {
        status: 'verified',
        verified: true,
      });
      toast.success('ยืนยันการชำระเงินสำเร็จ');
      fetchPayments(); // Refresh data
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'เกิดข้อผิดพลาด');
    }
  };

  // Delete payment - saves immediately
  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('ต้องการลบรายการชำระเงินนี้?')) return;

    try {
      await api.delete(`/payments/${paymentId}`);
      toast.success('ลบรายการสำเร็จ');
      fetchPayments(); // Refresh data
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'เกิดข้อผิดพลาด');
    }
  };

  // Remove pending operation (cancel pending change)
  const handleRemovePendingOperation = (index: number) => {
    setPendingOperations(prev => prev.filter((_, i) => i !== index));
  };

  // Check if a payment has pending operations
  const getPaymentPendingStatus = (paymentId: string): PendingPaymentOperation | undefined => {
    return pendingOperations.find(op => op.paymentId === paymentId);
  };

  // Upload proof image
  const handleUploadProof = async (paymentId: string, file: File) => {
    setUploadingProof(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (uploadResponse.data.success && uploadResponse.data.data.url) {
        const imageUrl = uploadResponse.data.data.url.startsWith('http')
          ? uploadResponse.data.data.url
          : `${BACKEND_URL}${uploadResponse.data.data.url}`;

        await api.patch(`/payments/${paymentId}`, {
          proofImageUrl: imageUrl,
        });

        toast.success('อัปโหลดหลักฐานสำเร็จ');
        fetchPayments();
      }
    } catch (err: any) {
      toast.error('เกิดข้อผิดพลาดในการอัปโหลด');
    } finally {
      setUploadingProof(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setPaymentForm({
      installmentNumber: 1,
      installmentName: 'งวดที่ 1',
      amountBaht: '',
      discount: '',
      fee: '',
      dueDate: '',
      notes: '',
    });
    setSelectedItem(null);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <Clock className="w-3 h-3" /> },
      paid: { bg: 'bg-blue-100', text: 'text-blue-800', icon: <Check className="w-3 h-3" /> },
      verified: { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
      overdue: { bg: 'bg-red-100', text: 'text-red-800', icon: <AlertCircle className="w-3 h-3" /> },
    };
    const badge = badges[status] || badges.pending;
    const labels: Record<string, string> = {
      pending: 'รอชำระ',
      paid: 'ชำระแล้ว',
      verified: 'ยืนยันแล้ว',
      overdue: 'เลยกำหนด',
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.icon}
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-500" />
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Payment Summary Card */}
      <div className="rounded-xl p-6 text-white" style={{ backgroundColor: '#1C212D' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CreditCard className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold">สรุปการชำระเงิน</h2>
              <p className="text-gray-400 text-sm">{orderNumber}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">ชำระแล้ว</p>
            <p className="text-2xl font-bold">{data.summary.percentPaid}%</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/20 rounded-full h-3 mb-4">
          <div
            className="bg-green-400 h-3 rounded-full transition-all duration-500"
            style={{ width: `${data.summary.percentPaid}%` }}
          />
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-xs text-gray-400">ยอดรวมทั้งหมด</p>
            <p className="text-lg font-bold">฿{data.summary.grandTotal.toLocaleString()}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-xs text-gray-400">ชำระแล้ว</p>
            <p className="text-lg font-bold text-green-400">฿{data.summary.paidBaht.toLocaleString()}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-xs text-gray-400">ค้างชำระ</p>
            <p className="text-lg font-bold text-yellow-400">฿{data.summary.remainingBaht.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Per-Item Payments */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">งวดชำระเงินแยกตามสินค้า</h3>

        {data.items.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-white border border-gray-200 rounded-xl">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>ไม่มีสินค้าในออเดอร์นี้</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.items.map((item) => {
              const isExpanded = expandedItems.has(item.id);
              const defaultItemTotal = (Number(item.priceBaht) || 0) + (Number(item.shippingCost) || 0);
              const itemSummary = item.itemSummary || {
                itemTotal: defaultItemTotal,
                paidBaht: 0,
                remainingBaht: defaultItemTotal,
                percentPaid: 0,
                totalPayments: 0,
                paidPayments: 0,
                pendingPayments: 0,
              };

              return (
                <div key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  {/* Item Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                    onClick={() => toggleExpand(item.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-800">
                          {item.productName || item.productCode || 'สินค้า'}
                        </span>
                        {item.productCode && item.productName && (
                          <span className="text-xs text-gray-400">({item.productCode})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600">
                          ยอดสินค้า: <span className="font-semibold">฿{itemSummary.itemTotal.toLocaleString()}</span>
                        </span>
                        <span className="text-green-600">
                          ชำระแล้ว: <span className="font-semibold">฿{itemSummary.paidBaht.toLocaleString()}</span>
                        </span>
                        <span className="text-orange-600">
                          ค้างชำระ: <span className="font-semibold">฿{itemSummary.remainingBaht.toLocaleString()}</span>
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2 max-w-md">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${itemSummary.percentPaid}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">
                        {itemSummary.paidPayments}/{itemSummary.totalPayments} งวด
                      </span>
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(item);
                          setPaymentForm({
                            ...paymentForm,
                            installmentNumber: item.payments.length + 1,
                            installmentName: `งวดที่ ${item.payments.length + 1}`,
                          });
                          setShowAddPayment(true);
                        }}
                        className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-primary-700 flex items-center gap-1"
                        whileTap={{ scale: 0.95 }}
                      >
                        <Plus className="w-4 h-4" />
                        เพิ่มงวด
                      </motion.button>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Item Payments (Expandable) */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-100"
                      >
                        {item.payments.length === 0 ? (
                          <div className="p-6 text-center text-gray-400">
                            <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">ยังไม่มีงวดชำระเงินสำหรับสินค้านี้</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {/* Payments for this item */}
                            {item.payments.map((payment) => (
                              <div key={payment.id} className="p-4 hover:bg-gray-50">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-gray-800">
                                        {payment.installmentName || `งวดที่ ${payment.installmentNumber}`}
                                      </span>
                                      {getStatusBadge(payment.status)}
                                    </div>
                                    <div className="text-sm text-gray-600 flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold text-primary-600">
                                        ฿{(Number(payment.amountBaht) || 0).toLocaleString()}
                                      </span>
                                      {payment.paymentMethod && (
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                          {PAYMENT_METHODS.find(m => m.value === payment.paymentMethod)?.label || payment.paymentMethod}
                                        </span>
                                      )}
                                    </div>
                                    {payment.dueDate && (
                                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                        <Calendar className="w-3 h-3" />
                                        กำหนดชำระ: {new Date(payment.dueDate).toLocaleDateString('th-TH')}
                                      </div>
                                    )}
                                    {payment.paidAt && (
                                      <div className="text-xs text-green-600 mt-1">
                                        ชำระเมื่อ: {new Date(payment.paidAt).toLocaleDateString('th-TH')}
                                      </div>
                                    )}
                                    {payment.notes && (
                                      <p className="text-xs text-gray-400 mt-1">{payment.notes}</p>
                                    )}
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-2">
                                    <motion.button
                                      onClick={() => setViewPaymentDetail(payment)}
                                      className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                                      whileTap={{ scale: 0.95 }}
                                      title="ดูรายละเอียด"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </motion.button>

                                    {payment.proofImageUrl && (
                                      <button
                                        onClick={() => setViewingImage(payment.proofImageUrl)}
                                        className="w-10 h-10 rounded-lg overflow-hidden border-2 border-green-300 hover:border-green-500 transition-colors"
                                        title="ดูหลักฐานการชำระเงิน"
                                      >
                                        <img
                                          src={payment.proofImageUrl}
                                          alt="หลักฐาน"
                                          className="w-full h-full object-cover"
                                        />
                                      </button>
                                    )}

                                    {payment.status === 'pending' && (
                                      <motion.button
                                        onClick={() => openConfirmPayment(payment.id)}
                                        className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600"
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        ชำระแล้ว
                                      </motion.button>
                                    )}
                                    {payment.status === 'paid' && (
                                      <motion.button
                                        onClick={() => handleVerifyPayment(payment.id)}
                                        className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600"
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        ยืนยัน
                                      </motion.button>
                                    )}
                                    <motion.button
                                      onClick={() => handleDeletePayment(payment.id)}
                                      className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                      whileTap={{ scale: 0.95 }}
                                      title="ลบ"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </motion.button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Payment Modal */}
      <AnimatePresence>
        {showAddPayment && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddPayment(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-lg font-bold">เพิ่มงวดชำระเงิน</h3>
                  <p className="text-sm text-gray-500">{orderNumber}</p>
                </div>
                <button onClick={() => setShowAddPayment(false)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
              {/* Item Balance Info (Per-Item) */}
              {(() => {
                const itemTotal = selectedItem?.itemSummary?.itemTotal ||
                  ((Number(selectedItem?.priceBaht) || 0) + (Number(selectedItem?.shippingCost) || 0));
                const existingPaymentsTotal = selectedItem?.payments.reduce(
                  (sum, p) => sum + (Number(p.amountBaht) || 0), 0
                ) || 0;
                const remainingBalance = itemTotal - existingPaymentsTotal;
                return (
                  <div className="mx-6 mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="mb-2 text-center">
                      <p className="text-xs text-gray-500">สินค้า</p>
                      <p className="font-medium text-gray-800 text-sm">
                        {selectedItem?.productName || selectedItem?.productCode || 'สินค้า'}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center">
                        <p className="text-gray-500">ยอดสินค้า</p>
                        <p className="font-bold text-gray-800">฿{itemTotal.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500">สร้างงวดแล้ว</p>
                        <p className="font-bold text-orange-600">฿{existingPaymentsTotal.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500">คงเหลือ</p>
                        <p className={`font-bold ${remainingBalance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ฿{remainingBalance.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {remainingBalance <= 0 && (
                      <p className="text-xs text-red-600 text-center mt-2">
                        ไม่สามารถสร้างงวดเพิ่มได้ เนื่องจากสร้างครบยอดสินค้านี้แล้ว
                      </p>
                    )}
                  </div>
                );
              })()}

              <div className="p-6 space-y-4">
                {/* Quick templates */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เลือกประเภทงวด
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {DEFAULT_INSTALLMENTS.map((inst) => (
                      <button
                        key={inst.number}
                        onClick={() => {
                          // Use item total instead of order total
                          const itemTotal = selectedItem?.itemSummary?.itemTotal ||
                            ((Number(selectedItem?.priceBaht) || 0) + (Number(selectedItem?.shippingCost) || 0));
                          setPaymentForm({
                            ...paymentForm,
                            installmentName: inst.name,
                            amountBaht: inst.percentOfTotal > 0
                              ? Math.round(itemTotal * inst.percentOfTotal / 100).toString()
                              : '',
                          });
                        }}
                        className={`text-left p-3 border rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors ${
                          paymentForm.installmentName === inst.name ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="font-medium text-gray-800">{inst.name}</div>
                        <div className="text-xs text-gray-500">{inst.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount and Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ยอดเงิน (บาท)
                    </label>
                    <input
                      type="number"
                      value={paymentForm.amountBaht}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amountBaht: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      กำหนดชำระ
                    </label>
                    <input
                      type="date"
                      value={paymentForm.dueDate}
                      onChange={(e) => setPaymentForm({ ...paymentForm, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Discount and Fee */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ส่วนลด (บาท)
                    </label>
                    <input
                      type="number"
                      value={paymentForm.discount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, discount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ค่าธรรมเนียม (บาท)
                    </label>
                    <input
                      type="number"
                      value={paymentForm.fee}
                      onChange={(e) => setPaymentForm({ ...paymentForm, fee: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Final Amount Preview */}
                {(paymentForm.amountBaht || paymentForm.discount || paymentForm.fee) && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600 space-y-1">
                      {paymentForm.amountBaht && (
                        <div className="flex justify-between">
                          <span>ยอดเงิน:</span>
                          <span>฿{parseFloat(paymentForm.amountBaht || '0').toLocaleString()}</span>
                        </div>
                      )}
                      {paymentForm.discount && parseFloat(paymentForm.discount) > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>ส่วนลด:</span>
                          <span>-฿{parseFloat(paymentForm.discount).toLocaleString()}</span>
                        </div>
                      )}
                      {paymentForm.fee && parseFloat(paymentForm.fee) > 0 && (
                        <div className="flex justify-between text-orange-600">
                          <span>ค่าธรรมเนียม:</span>
                          <span>+฿{parseFloat(paymentForm.fee).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-gray-800 pt-2 border-t">
                        <span>ยอดสุทธิ:</span>
                        <span>฿{(
                          parseFloat(paymentForm.amountBaht || '0') -
                          parseFloat(paymentForm.discount || '0') +
                          parseFloat(paymentForm.fee || '0')
                        ).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    หมายเหตุ
                  </label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={2}
                    placeholder="หมายเหตุเพิ่มเติม..."
                  />
                </div>
              </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 flex-shrink-0">
                <button
                  onClick={() => {
                    setShowAddPayment(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  ยกเลิก
                </button>
                <motion.button
                  onClick={handleCreatePayment}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  whileTap={{ scale: 0.95 }}
                >
                  สร้างงวดชำระ
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Payment Modal */}
      <AnimatePresence>
        {confirmPaymentModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmPaymentModal({ show: false, paymentId: null, paymentMethod: 'transfer', proofFile: null, proofPreview: null })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">ยืนยันการชำระเงิน</h3>
                  <p className="text-sm text-gray-500">เลือกวิธีการชำระและแนบหลักฐาน</p>
                </div>
                <button onClick={() => setConfirmPaymentModal({ show: false, paymentId: null, paymentMethod: 'transfer', proofFile: null, proofPreview: null })}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วิธีชำระเงิน
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PAYMENT_METHODS.map((method) => (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setConfirmPaymentModal({ ...confirmPaymentModal, paymentMethod: method.value })}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                          confirmPaymentModal.paymentMethod === method.value
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                        }`}
                      >
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Proof Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    หลักฐานการชำระเงิน (ไม่บังคับ)
                  </label>
                  {confirmPaymentModal.proofPreview ? (
                    <div className="relative">
                      <img
                        src={confirmPaymentModal.proofPreview}
                        alt="หลักฐาน"
                        className="w-full h-48 object-contain bg-gray-100 rounded-lg"
                      />
                      <button
                        onClick={() => setConfirmPaymentModal({ ...confirmPaymentModal, proofFile: null, proofPreview: null })}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="block w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setConfirmPaymentModal({
                                ...confirmPaymentModal,
                                proofFile: file,
                                proofPreview: reader.result as string,
                              });
                            };
                            reader.readAsDataURL(file);
                          }
                          e.target.value = '';
                        }}
                      />
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">คลิกเพื่ออัปโหลดหลักฐาน</span>
                    </label>
                  )}
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setConfirmPaymentModal({ show: false, paymentId: null, paymentMethod: 'transfer', proofFile: null, proofPreview: null })}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  ยกเลิก
                </button>
                <motion.button
                  onClick={handleConfirmPayment}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  whileTap={{ scale: 0.95 }}
                >
                  ยืนยันการชำระ
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Payment Detail Modal */}
      <AnimatePresence>
        {viewPaymentDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setViewPaymentDetail(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">รายละเอียดการชำระเงิน</h3>
                  <p className="text-sm text-gray-500">{viewPaymentDetail.installmentName || `งวดที่ ${viewPaymentDetail.installmentNumber}`}</p>
                </div>
                <button onClick={() => setViewPaymentDetail(null)}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">สถานะ:</span>
                  {getStatusBadge(viewPaymentDetail.status)}
                </div>

                {/* Amount */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">ยอดเงิน:</span>
                  <span className="font-bold text-lg text-primary-600">
                    ฿{(viewPaymentDetail.amountBaht || 0).toLocaleString()}
                  </span>
                </div>

                {/* Payment Method */}
                {viewPaymentDetail.paymentMethod && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">วิธีชำระเงิน:</span>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                      {PAYMENT_METHODS.find(m => m.value === viewPaymentDetail.paymentMethod)?.label || viewPaymentDetail.paymentMethod}
                    </span>
                  </div>
                )}

                {/* Due Date */}
                {viewPaymentDetail.dueDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">กำหนดชำระ:</span>
                    <span>{new Date(viewPaymentDetail.dueDate).toLocaleDateString('th-TH')}</span>
                  </div>
                )}

                {/* Paid At */}
                {viewPaymentDetail.paidAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">ชำระเมื่อ:</span>
                    <span className="text-green-600">{new Date(viewPaymentDetail.paidAt).toLocaleDateString('th-TH')}</span>
                  </div>
                )}

                {/* Verified At */}
                {viewPaymentDetail.verifiedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">ยืนยันเมื่อ:</span>
                    <span className="text-green-600">{new Date(viewPaymentDetail.verifiedAt).toLocaleDateString('th-TH')}</span>
                  </div>
                )}

                {/* Notes */}
                {viewPaymentDetail.notes && (
                  <div>
                    <span className="text-gray-600 block mb-1">หมายเหตุ:</span>
                    <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{viewPaymentDetail.notes}</p>
                  </div>
                )}

                {/* Proof Image */}
                {viewPaymentDetail.proofImageUrl && (
                  <div>
                    <span className="text-gray-600 block mb-2">หลักฐานการชำระเงิน:</span>
                    <button
                      onClick={() => {
                        setViewPaymentDetail(null);
                        setViewingImage(viewPaymentDetail.proofImageUrl);
                      }}
                      className="w-full"
                    >
                      <img
                        src={viewPaymentDetail.proofImageUrl}
                        alt="หลักฐานการชำระเงิน"
                        className="w-full h-48 object-contain bg-gray-100 rounded-lg hover:opacity-80 transition-opacity"
                      />
                    </button>
                    <p className="text-xs text-center text-gray-400 mt-1">คลิกเพื่อดูรูปเต็ม</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end">
                <button
                  onClick={() => setViewPaymentDetail(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  ปิด
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

export default PaymentTab;
