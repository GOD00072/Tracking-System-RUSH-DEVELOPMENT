import { useState, useEffect } from 'react';
import { X, Send, Bell, Package, User, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../lib/api';

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

const NotifyStatusModal = ({ isOpen, onClose, orderId, orderNumber }: NotifyStatusModalProps) => {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
    }
  }, [isOpen, orderId]);

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

  const handleSendNow = async () => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-500 to-blue-600">
          <div className="flex items-center gap-3 text-white">
            <Bell className="w-5 h-5" />
            <div>
              <h2 className="font-semibold">แจ้งเตือนสถานะ</h2>
              <p className="text-sm text-blue-100">{orderNumber}</p>
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
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
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
              onClick={handleSendNow}
              disabled={sending || !preview.hasLineId}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังส่ง...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  ส่งแจ้งเตือนทันที
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
