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

interface OrderItem {
  id: string;
  productCode: string | null;
  productName: string | null;
  priceYen: number | null;
  priceBaht: number | null;
  shippingCost: number | null;
  paymentStatus: string | null;
  payments: Payment[];
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
  }, [pendingOperations, onPendingChangesUpdate]);

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
  }, [data?.summary, onPaymentSummaryUpdate]);

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

  // Create payment installment - stores in pending state
  const handleCreatePayment = () => {
    if (!selectedItem || !data) return;

    // Calculate final amount after discount and fee
    const baseAmount = paymentForm.amountBaht ? parseFloat(paymentForm.amountBaht) : 0;
    const discount = paymentForm.discount ? parseFloat(paymentForm.discount) : 0;
    const fee = paymentForm.fee ? parseFloat(paymentForm.fee) : 0;
    const finalAmount = baseAmount - discount + fee;

    // Validate: Check if total payments would exceed order total
    const orderTotal = data.summary.grandTotal;
    const existingPaymentsTotal = data.allPayments.reduce(
      (sum, p) => sum + (p.amountBaht || 0),
      0
    );
    // Include pending creates in total
    const pendingCreatesTotal = pendingOperations
      .filter(op => op.type === 'create')
      .reduce((sum, op) => sum + (op.data?.amountBaht || 0), 0);
    const newTotal = existingPaymentsTotal + pendingCreatesTotal + finalAmount;

    if (newTotal > orderTotal) {
      const remaining = orderTotal - existingPaymentsTotal - pendingCreatesTotal;
      toast.error(`ยอดรวมงวดชำระเกินยอดออเดอร์! คงเหลือที่สร้างได้: ฿${remaining.toLocaleString()}`);
      return;
    }

    const tempId = `pending_payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const payload = {
      orderItemId: selectedItem.id,
      installmentNumber: paymentForm.installmentNumber,
      installmentName: paymentForm.installmentName,
      amountBaht: finalAmount > 0 ? finalAmount : undefined,
      dueDate: paymentForm.dueDate || undefined,
      notes: paymentForm.notes || undefined,
      status: 'pending',
    };

    // Add to pending operations instead of API call
    setPendingOperations(prev => [...prev, {
      type: 'create',
      tempId,
      data: payload,
    }]);

    toast.success('เพิ่มงวดชำระเงินแล้ว (รอบันทึก)');
    setShowAddPayment(false);
    resetForm();
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

  // Handle confirm payment with proof - stores in pending state
  const handleConfirmPayment = async () => {
    if (!confirmPaymentModal.paymentId) return;

    try {
      let proofImageUrl: string | undefined;

      // Upload proof image if provided (image upload still happens immediately)
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

      // Add to pending operations instead of API call
      setPendingOperations(prev => [...prev, {
        type: 'update',
        paymentId: confirmPaymentModal.paymentId!,
        data: {
          status: 'paid',
          paidAt: new Date().toISOString(),
          paymentMethod: confirmPaymentModal.paymentMethod,
          proofImageUrl,
        },
      }]);

      toast.success('บันทึกการชำระเงินแล้ว (รอบันทึก)');
      setConfirmPaymentModal({ show: false, paymentId: null, paymentMethod: 'transfer', proofFile: null, proofPreview: null });
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'เกิดข้อผิดพลาด');
    }
  };

  // Verify payment - stores in pending state
  const handleVerifyPayment = (paymentId: string) => {
    // Add to pending operations instead of API call
    setPendingOperations(prev => [...prev, {
      type: 'update',
      paymentId,
      data: {
        status: 'verified',
        verified: true,
      },
    }]);
    toast.success('ยืนยันการชำระเงินแล้ว (รอบันทึก)');
  };

  // Delete payment - stores in pending state
  const handleDeletePayment = (paymentId: string) => {
    if (!confirm('ต้องการลบรายการชำระเงินนี้?')) return;

    // Add to pending operations instead of API call
    setPendingOperations(prev => [...prev, {
      type: 'delete',
      paymentId,
    }]);
    toast.success('ลบรายการแล้ว (รอบันทึก)');
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

      {/* Order Payments */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">งวดชำระเงิน</h3>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">
              {data.summary.paidPayments}/{data.summary.totalPayments} งวด
            </div>
            <motion.button
              onClick={() => {
                // Select first item by default for adding payment
                if (data.items.length > 0) {
                  const firstItem = data.items[0];
                  setSelectedItem(firstItem);
                  setPaymentForm({
                    ...paymentForm,
                    installmentNumber: data.allPayments.length + 1,
                    installmentName: `งวดที่ ${data.allPayments.length + 1}`,
                  });
                  setShowAddPayment(true);
                }
              }}
              className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-primary-700 flex items-center gap-1"
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-4 h-4" />
              เพิ่มงวด
            </motion.button>
          </div>
        </div>

        {data.allPayments.length === 0 && pendingOperations.filter(op => op.type === 'create').length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-white border border-gray-200 rounded-xl">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>ยังไม่มีงวดชำระเงิน</p>
            <p className="text-sm mt-1">คลิก "เพิ่มงวด" เพื่อสร้างงวดชำระเงินใหม่</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
            {/* Pending new payments */}
            {pendingOperations
              .filter(op => op.type === 'create')
              .map((op, index) => (
              <div key={op.tempId} className="p-4 bg-green-50 border-l-4 border-green-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800">
                        {op.data?.installmentName || `งวดที่ ${op.data?.installmentNumber}`}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 animate-pulse">
                        <Plus className="w-3 h-3" />
                        ใหม่ (รอบันทึก)
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold text-primary-600">
                        ฿{(op.data?.amountBaht || 0).toLocaleString()}
                      </span>
                    </div>
                    {op.data?.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Calendar className="w-3 h-3" />
                        กำหนดชำระ: {new Date(op.data.dueDate).toLocaleDateString('th-TH')}
                      </div>
                    )}
                    {op.data?.notes && (
                      <p className="text-xs text-gray-400 mt-1">{op.data.notes}</p>
                    )}
                  </div>
                  <motion.button
                    onClick={() => handleRemovePendingOperation(pendingOperations.indexOf(op))}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                    whileTap={{ scale: 0.95 }}
                    title="ยกเลิก"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            ))}
            {/* Existing payments */}
            {data.allPayments.map((payment) => {
              const pendingOp = getPaymentPendingStatus(payment.id);
              const isPendingDelete = pendingOp?.type === 'delete';
              const isPendingUpdate = pendingOp?.type === 'update';
              return (
              <div key={payment.id} className={`p-4 hover:bg-gray-50 ${isPendingDelete ? 'bg-red-50 border-l-4 border-red-500 opacity-60' : ''} ${isPendingUpdate ? 'bg-yellow-50 border-l-4 border-yellow-500' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium ${isPendingDelete ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        {payment.installmentName || `งวดที่ ${payment.installmentNumber}`}
                      </span>
                      {isPendingDelete ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                          <Trash2 className="w-3 h-3" />
                          รอลบ
                        </span>
                      ) : isPendingUpdate ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 animate-pulse">
                          <Clock className="w-3 h-3" />
                          {pendingOp?.data?.status === 'paid' ? 'รอยืนยันชำระ' : pendingOp?.data?.status === 'verified' ? 'รอยืนยัน' : 'รอแก้ไข'}
                        </span>
                      ) : (
                        getStatusBadge(payment.status)
                      )}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-primary-600">
                        ฿{(payment.amountBaht || 0).toLocaleString()}
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
                    {/* If has pending operation, show cancel button */}
                    {(isPendingDelete || isPendingUpdate) ? (
                      <motion.button
                        onClick={() => handleRemovePendingOperation(pendingOperations.indexOf(pendingOp!))}
                        className="px-3 py-1.5 bg-gray-500 text-white rounded-lg text-xs font-medium hover:bg-gray-600"
                        whileTap={{ scale: 0.95 }}
                      >
                        ยกเลิก
                      </motion.button>
                    ) : (
                      <>
                        {/* View Detail Button */}
                        <motion.button
                          onClick={() => setViewPaymentDetail(payment)}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                          whileTap={{ scale: 0.95 }}
                          title="ดูรายละเอียด"
                        >
                          <Eye className="w-4 h-4" />
                        </motion.button>

                        {/* Proof image thumbnail */}
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

                        {/* Action buttons based on status */}
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
                      </>
                    )}
                  </div>
                </div>
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
              {/* Order Balance Info */}
              {(() => {
                const orderTotal = data?.summary.grandTotal || 0;
                const existingPaymentsTotal = data?.allPayments.reduce(
                  (sum, p) => sum + (p.amountBaht || 0), 0
                ) || 0;
                const remainingBalance = orderTotal - existingPaymentsTotal;
                return (
                  <div className="mx-6 mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center">
                        <p className="text-gray-500">ยอดรวมออเดอร์</p>
                        <p className="font-bold text-gray-800">฿{orderTotal.toLocaleString()}</p>
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
                        ⚠️ ไม่สามารถสร้างงวดเพิ่มได้ เนื่องจากสร้างครบยอดแล้ว
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
                          const orderTotal = data?.summary.grandTotal || 0;
                          setPaymentForm({
                            ...paymentForm,
                            installmentName: inst.name,
                            amountBaht: inst.percentOfTotal > 0
                              ? Math.round(orderTotal * inst.percentOfTotal / 100).toString()
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
