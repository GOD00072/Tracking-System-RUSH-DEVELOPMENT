import { useState, useEffect } from 'react';
import { X, Send, CreditCard, User, Loader2, CheckCircle, AlertCircle, Calendar, Building2 } from 'lucide-react';
import api from '../../lib/api';

interface NotifyPaymentModalProps {
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
  totalBaht: number;
}

const NotifyPaymentModal = ({ isOpen, onClose, orderId, orderNumber }: NotifyPaymentModalProps) => {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Editable form data
  const [formData, setFormData] = useState({
    totalAmount: 0,
    paidAmount: 0,
    dueDate: '',
    includeBankInfo: true,
    bankName: 'ธนาคารกสิกรไทย',
    accountName: 'บริษัท ปักกุเนโกะ จำกัด',
    accountNumber: '123-4-56789-0',
  });

  useEffect(() => {
    if (isOpen && orderId) {
      fetchPreview();
    }
  }, [isOpen, orderId]);

  useEffect(() => {
    if (preview) {
      setFormData((prev) => ({
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

  const handleSend = async () => {
    setSending(true);
    setError(null);
    try {
      const payload: any = {
        orderId,
        totalAmount: formData.totalAmount,
        paidAmount: formData.paidAmount,
      };

      if (formData.dueDate) {
        payload.dueDate = formData.dueDate;
      }

      if (formData.includeBankInfo) {
        payload.bankInfo = {
          bankName: formData.bankName,
          accountName: formData.accountName,
          accountNumber: formData.accountNumber,
        };
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

  const remainingAmount = formData.totalAmount - formData.paidAmount;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-500">
          <div className="flex items-center gap-3 text-white">
            <CreditCard className="w-5 h-5" />
            <div>
              <h2 className="font-semibold">แจ้งเตือนชำระเงิน</h2>
              <p className="text-sm text-amber-100">{orderNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
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
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-amber-600" />
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

              {/* Payment Details Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ยอดรวมทั้งหมด (บาท)
                    </label>
                    <input
                      type="number"
                      value={formData.totalAmount}
                      onChange={(e) => setFormData({ ...formData, totalAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ชำระแล้ว (บาท)
                    </label>
                    <input
                      type="number"
                      value={formData.paidAmount}
                      onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Remaining Amount Display */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-600">ยอดค้างชำระ</p>
                  <p className="text-2xl font-bold text-amber-700">
                    ฿{remainingAmount.toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    กำหนดชำระ (ไม่บังคับ)
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Bank Info Toggle */}
                <div className="border rounded-lg p-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.includeBankInfo}
                      onChange={(e) => setFormData({ ...formData, includeBankInfo: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                    />
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">แนบข้อมูลธนาคาร</span>
                  </label>

                  {formData.includeBankInfo && (
                    <div className="mt-4 space-y-3 pl-6">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">ธนาคาร</label>
                        <input
                          type="text"
                          value={formData.bankName}
                          onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">ชื่อบัญชี</label>
                        <input
                          type="text"
                          value={formData.accountName}
                          onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">เลขบัญชี</label>
                        <input
                          type="text"
                          value={formData.accountNumber}
                          onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

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
              disabled={sending || !preview.hasLineId || remainingAmount <= 0}
              className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังส่ง...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  ส่งแจ้งเตือน
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotifyPaymentModal;
