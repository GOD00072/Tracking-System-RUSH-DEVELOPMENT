import { useState, useEffect, useRef } from 'react';
import { X, Send, Bell, Package, User, Loader2, CheckCircle, AlertCircle, CreditCard, Calendar, Building2, QrCode, Upload, Trash2 } from 'lucide-react';
import api from '../../lib/api';
import { BACKEND_URL } from '../../utils/apiConfig';

interface NotifyStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
}

interface PreviewData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  hasLineId: boolean;
  lineId: string | null;
  currentStatus: string;
  currentStatusStep: number;
  itemCount: number;
  items: Array<{
    productCode: string;
    productName: string | null;
    statusStep: number;
    priceBaht: number;
  }>;
  totalBaht: number;
}

interface PaymentInstallment {
  id: string;
  installmentNumber: number;
  installmentName: string | null;
  amountBaht: number | null;
  status: string;
  dueDate: string | null;
  productCode?: string;
  productName?: string;
}

interface PaymentItem {
  id: string;
  productCode: string | null;
  productName: string | null;
  priceBaht: number | null;
  shippingCost: number | null;
  payments: PaymentInstallment[];
  itemSummary: {
    itemTotal: number;
    paidBaht: number;
    remainingBaht: number;
  };
}

interface PaymentSummary {
  grandTotal: number;
  paidBaht: number;
  remainingBaht: number;
}

type NotificationType = 'status' | 'payment';

const NotifyStatusModal = ({ isOpen, onClose, orderId, orderNumber }: NotifyStatusModalProps) => {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [notificationType, setNotificationType] = useState<NotificationType>('status');
  const [uploadingQr, setUploadingQr] = useState(false);
  const qrFileInputRef = useRef<HTMLInputElement>(null);

  // Payment installments
  const [paymentItems, setPaymentItems] = useState<PaymentItem[]>([]);
  const [installments, setInstallments] = useState<PaymentInstallment[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string | null>(null);

  // Payment form data
  const [paymentForm, setPaymentForm] = useState({
    totalAmount: 0,
    paidAmount: 0,
    dueDate: '',
    includeBankInfo: true,
    bankName: 'ธนาคารกสิกรไทย',
    accountName: 'บริษัท ปักกุเนโกะ จำกัด',
    accountNumber: '123-4-56789-0',
    includeQrCode: false,
    qrCodeUrl: '',
  });

  // Status labels
  const statusLabels: Record<number, string> = {
    1: 'รับออเดอร์แล้ว',
    2: 'ชำระเงินงวดแรก',
    3: 'สั่งซื้อจากญี่ปุ่นแล้ว',
    4: 'ถึงโกดังญี่ปุ่น',
    5: 'ส่งออกจากญี่ปุ่น',
    6: 'ถึงไทยแล้ว',
    7: 'กำลังจัดส่ง',
    8: 'จัดส่งสำเร็จ',
  };

  useEffect(() => {
    if (isOpen && orderId) {
      fetchPreview();
      fetchBankSettings();
      fetchPaymentInstallments();
      // Reset states when modal opens
      setNotificationType('status');
      setSuccess(false);
      setError(null);
      setSelectedInstallmentId(null);
    }
  }, [isOpen, orderId]);

  const fetchPaymentInstallments = async () => {
    try {
      const response = await api.get(`/payments/order/${orderId}`);
      if (response.data.success) {
        const data = response.data.data;

        // Store items with their payments
        setPaymentItems(data.items || []);

        // Filter only pending installments from all payments
        const pendingInstallments = data.allPayments.filter(
          (p: PaymentInstallment) => p.status === 'pending' && (Number(p.amountBaht) || 0) > 0
        );
        setInstallments(pendingInstallments);
        setPaymentSummary(data.summary);

        // Auto-select first pending installment
        if (pendingInstallments.length > 0) {
          setSelectedInstallmentId(pendingInstallments[0].id);
        }
      }
    } catch (err) {
      console.log('Failed to fetch payment installments');
    }
  };

  const fetchBankSettings = async () => {
    try {
      const response = await api.get('/settings/bank');
      if (response.data.success && response.data.data) {
        setPaymentForm((prev) => ({
          ...prev,
          bankName: response.data.data.bankName || prev.bankName,
          accountName: response.data.data.accountName || prev.accountName,
          accountNumber: response.data.data.accountNumber || prev.accountNumber,
          // QR Code ต้องอัปโหลดใหม่ทุกครั้ง (ยอดเงินต่างกัน)
          qrCodeUrl: '',
          includeQrCode: false,
        }));
      }
    } catch (err) {
      console.log('Using default bank settings');
    }
  };

  // Handle QR Code upload
  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingQr(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success && response.data.data.url) {
        const imageUrl = response.data.data.url.startsWith('http')
          ? response.data.data.url
          : `${BACKEND_URL}${response.data.data.url}`;
        setPaymentForm((prev) => ({
          ...prev,
          qrCodeUrl: imageUrl,
          includeQrCode: true,
        }));
      }
    } catch (err) {
      console.error('QR upload error:', err);
      setError('เกิดข้อผิดพลาดในการอัปโหลด QR Code');
    } finally {
      setUploadingQr(false);
      if (qrFileInputRef.current) {
        qrFileInputRef.current.value = '';
      }
    }
  };

  // Remove uploaded QR Code
  const handleRemoveQr = () => {
    setPaymentForm((prev) => ({
      ...prev,
      qrCodeUrl: '',
      includeQrCode: false,
    }));
  };

  useEffect(() => {
    if (preview) {
      setPaymentForm((prev) => ({
        ...prev,
        totalAmount: preview.totalBaht || 0,
      }));
    }
  }, [preview]);

  const fetchPreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/notifications/preview/${orderId}`);
      if (response.data.success) {
        setPreview(response.data.data);
      } else {
        setError(response.data.error?.message || 'Failed to load preview');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  const handleSendStatusNotification = async () => {
    setSending(true);
    setError(null);
    try {
      const response = await api.post('/notifications/status', { orderId });
      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      } else {
        setError(response.data.error?.message || 'Failed to send notification');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const handleSendPaymentNotification = async () => {
    if (!selectedInstallmentId) {
      setError('กรุณาเลือกงวดชำระเงิน');
      return;
    }

    // Find selected installment from paymentItems
    let selectedInstallment: PaymentInstallment | undefined;
    let selectedItemName: string | undefined;
    for (const item of paymentItems) {
      const found = item.payments.find(p => p.id === selectedInstallmentId);
      if (found) {
        selectedInstallment = found;
        selectedItemName = item.productName || item.productCode || 'สินค้า';
        break;
      }
    }

    if (!selectedInstallment) {
      setError('ไม่พบงวดชำระเงินที่เลือก');
      return;
    }

    setSending(true);
    setError(null);
    try {
      const payload: any = {
        orderId,
        totalAmount: paymentSummary?.grandTotal || 0,
        paidAmount: paymentSummary?.paidBaht || 0,
        installmentName: selectedInstallment.installmentName || `งวดที่ ${selectedInstallment.installmentNumber}`,
        installmentAmount: Number(selectedInstallment.amountBaht) || 0,
        itemName: selectedItemName, // Include item name for per-item payment
      };

      if (selectedInstallment.dueDate || paymentForm.dueDate) {
        payload.dueDate = paymentForm.dueDate || selectedInstallment.dueDate;
      }

      if (paymentForm.includeBankInfo) {
        payload.bankInfo = {
          bankName: paymentForm.bankName,
          accountName: paymentForm.accountName,
          accountNumber: paymentForm.accountNumber,
        };
      }

      if (paymentForm.includeQrCode && paymentForm.qrCodeUrl) {
        payload.qrCodeUrl = paymentForm.qrCodeUrl;
      }

      const response = await api.post('/notifications/payment', payload);
      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      } else {
        setError(response.data.error?.message || 'Failed to send notification');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    if (notificationType === 'status') {
      handleSendStatusNotification();
    } else {
      handleSendPaymentNotification();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r ${
          notificationType === 'status'
            ? 'from-blue-500 to-blue-600'
            : 'from-amber-500 to-orange-500'
        }`}>
          <div className="flex items-center gap-3 text-white">
            {notificationType === 'status' ? (
              <Bell className="w-5 h-5" />
            ) : (
              <CreditCard className="w-5 h-5" />
            )}
            <div>
              <h2 className="font-semibold">
                {notificationType === 'status' ? 'แจ้งเตือนสถานะ' : 'แจ้งเตือนชำระเงิน'}
              </h2>
              <p className={`text-sm ${notificationType === 'status' ? 'text-blue-100' : 'text-amber-100'}`}>
                {orderNumber}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        {!loading && !success && preview && (
          <div className="flex border-b">
            <button
              onClick={() => setNotificationType('status')}
              className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                notificationType === 'status'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Bell className="w-4 h-4" />
              แจ้งสถานะ
            </button>
            <button
              onClick={() => setNotificationType('payment')}
              className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                notificationType === 'payment'
                  ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              แจ้งชำระเงิน
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 font-medium">เกิดข้อผิดพลาด</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-lg font-semibold text-green-700">ส่งแจ้งเตือนสำเร็จ!</p>
              <p className="text-sm text-gray-500 mt-1">ลูกค้าจะได้รับข้อความทาง LINE</p>
            </div>
          ) : preview ? (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    notificationType === 'status' ? 'bg-blue-100' : 'bg-amber-100'
                  }`}>
                    <User className={`w-5 h-5 ${
                      notificationType === 'status' ? 'text-blue-600' : 'text-amber-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{preview.customerName}</p>
                    {preview.hasLineId ? (
                      <p className="text-sm text-green-600">LINE ID: {preview.lineId}</p>
                    ) : (
                      <p className="text-sm text-red-500">ไม่มี LINE ID</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Notification Content */}
              {notificationType === 'status' && (
                <>
                  {/* Status Preview */}
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-2">สถานะปัจจุบัน</p>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {preview.currentStatus}
                      </span>
                      <span className="text-gray-400 text-sm">
                        (Step {preview.currentStatusStep}/8)
                      </span>
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-3">รายการสินค้า ({preview.itemCount} รายการ)</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {preview.items.slice(0, 5).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="flex-1 truncate">{item.productCode}</span>
                          <span className="text-gray-500">
                            {statusLabels[item.statusStep] || 'ไม่ระบุ'}
                          </span>
                        </div>
                      ))}
                      {preview.items.length > 5 && (
                        <p className="text-sm text-gray-400">+{preview.items.length - 5} รายการอื่น</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Payment Notification Content */}
              {notificationType === 'payment' && (
                <div className="space-y-4">
                  {/* Payment Summary */}
                  {paymentSummary && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500">ยอดรวม</p>
                        <p className="text-sm font-bold text-gray-800">฿{paymentSummary.grandTotal.toLocaleString()}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-green-600">ชำระแล้ว</p>
                        <p className="text-sm font-bold text-green-700">฿{paymentSummary.paidBaht.toLocaleString()}</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-amber-600">ค้างชำระ</p>
                        <p className="text-sm font-bold text-amber-700">฿{Math.max(0, Math.ceil(paymentSummary.remainingBaht)).toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  {/* Installment Selection - Grouped by Item */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <CreditCard className="w-4 h-4 inline mr-1" />
                      เลือกงวดชำระเงินที่ต้องการแจ้งเตือน
                    </label>
                    {paymentItems.filter(item => item.payments.some(p => p.status === 'pending' && (Number(p.amountBaht) || 0) > 0)).length === 0 ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                        <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                        <p className="text-yellow-700 font-medium">ไม่มีงวดชำระเงินที่รอชำระ</p>
                        <p className="text-yellow-600 text-sm">กรุณาสร้างงวดชำระเงินในแท็บ "การชำระเงิน" ก่อน</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-60 overflow-y-auto">
                        {paymentItems.map((item) => {
                          const pendingPayments = item.payments.filter(
                            p => p.status === 'pending' && (Number(p.amountBaht) || 0) > 0
                          );
                          if (pendingPayments.length === 0) return null;

                          return (
                            <div key={item.id} className="border rounded-lg overflow-hidden">
                              {/* Item Header */}
                              <div className="bg-gray-50 px-3 py-2 border-b">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                                      {item.productName || item.productCode || 'สินค้า'}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    ค้าง ฿{(item.itemSummary?.remainingBaht || 0).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              {/* Installments for this item */}
                              <div className="divide-y divide-gray-100">
                                {pendingPayments.map((installment) => (
                                  <label
                                    key={installment.id}
                                    className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                                      selectedInstallmentId === installment.id
                                        ? 'bg-amber-50'
                                        : 'hover:bg-gray-50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="radio"
                                        name="installment"
                                        value={installment.id}
                                        checked={selectedInstallmentId === installment.id}
                                        onChange={(e) => setSelectedInstallmentId(e.target.value)}
                                        className="w-4 h-4 text-amber-500 focus:ring-amber-500"
                                      />
                                      <div>
                                        <p className="font-medium text-gray-800 text-sm">
                                          {installment.installmentName || `งวดที่ ${installment.installmentNumber}`}
                                        </p>
                                        {installment.dueDate && (
                                          <p className="text-xs text-gray-500">
                                            กำหนด: {new Date(installment.dueDate).toLocaleDateString('th-TH')}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <span className="font-bold text-amber-600">
                                      ฿{(Number(installment.amountBaht) || 0).toLocaleString()}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Due Date Override */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      กำหนดชำระ (ปรับแก้ได้)
                    </label>
                    <input
                      type="date"
                      value={paymentForm.dueDate || (selectedInstallmentId ? installments.find(i => i.id === selectedInstallmentId)?.dueDate?.split('T')[0] || '' : '')}
                      onChange={(e) => setPaymentForm({ ...paymentForm, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Bank Info Toggle */}
                  <div className="border rounded-lg p-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentForm.includeBankInfo}
                        onChange={(e) => setPaymentForm({ ...paymentForm, includeBankInfo: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                      />
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">แนบข้อมูลธนาคาร</span>
                    </label>

                    {paymentForm.includeBankInfo && (
                      <div className="mt-4 space-y-3 pl-6">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">ธนาคาร</label>
                          <input
                            type="text"
                            value={paymentForm.bankName}
                            onChange={(e) => setPaymentForm({ ...paymentForm, bankName: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">ชื่อบัญชี</label>
                          <input
                            type="text"
                            value={paymentForm.accountName}
                            onChange={(e) => setPaymentForm({ ...paymentForm, accountName: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">เลขบัญชี</label>
                          <input
                            type="text"
                            value={paymentForm.accountNumber}
                            onChange={(e) => setPaymentForm({ ...paymentForm, accountNumber: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* QR Code Upload */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <QrCode className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-gray-700">แนบ QR Code ชำระเงิน</span>
                      <span className="text-xs text-gray-400">(สร้างใหม่จากแอปธนาคาร)</span>
                    </div>

                    {paymentForm.qrCodeUrl ? (
                      <div className="flex items-center gap-4">
                        <div className="relative group">
                          <div className="w-28 h-28 rounded-lg overflow-hidden border-2 border-amber-200 bg-white">
                            <img
                              src={paymentForm.qrCodeUrl}
                              alt="QR Code ชำระเงิน"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveQr}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-green-600 font-medium">QR Code พร้อมส่ง</p>
                          <p className="text-xs text-gray-500 mt-1">
                            คลิกปุ่ม X เพื่อลบและอัปโหลดใหม่
                          </p>
                        </div>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors">
                        <input
                          ref={qrFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleQrUpload}
                          className="hidden"
                          disabled={uploadingQr}
                        />
                        {uploadingQr ? (
                          <>
                            <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                            <span className="text-sm text-gray-600">กำลังอัปโหลด...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-amber-500" />
                            <span className="text-sm text-gray-600">อัปโหลด QR Code</span>
                          </>
                        )}
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Warning if no LINE ID */}
              {!preview.hasLineId && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-700 font-medium">ไม่สามารถส่งแจ้งเตือนได้</p>
                    <p className="text-yellow-600 text-sm">ลูกค้าไม่ได้ผูก LINE กับบัญชี</p>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {!loading && !success && preview && (
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSend}
              disabled={
                sending ||
                !preview.hasLineId ||
                (notificationType === 'payment' && (!selectedInstallmentId || paymentItems.filter(item => item.payments.some(p => p.status === 'pending')).length === 0))
              }
              className={`px-6 py-2 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                notificationType === 'status'
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-amber-500 hover:bg-amber-600'
              }`}
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังส่ง...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {notificationType === 'status' ? 'ส่งแจ้งสถานะ' : 'ส่งแจ้งชำระเงิน'}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotifyStatusModal;
