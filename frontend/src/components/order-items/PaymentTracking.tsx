import { useState } from 'react';
import {
  CreditCard,
  Plus,
  Check,
  Clock,
  X,
  Upload,
  Eye,
  Edit2,
  Trash2,
  Receipt,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api';

interface Payment {
  id: string;
  installmentNumber: number;
  installmentName?: string;
  amountYen?: number;
  amountBaht?: number;
  exchangeRate?: number;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  paymentMethod?: string;
  proofImageUrl?: string;
  dueDate?: string;
  paidAt?: string;
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

interface PaymentTrackingProps {
  orderItemId: string;
  payments: Payment[];
  totalAmountYen?: number;
  totalAmountBaht?: number;
  onPaymentsChange?: () => void;
  readonly?: boolean;
}

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'โอนเงินผ่านธนาคาร' },
  { value: 'promptpay', label: 'พร้อมเพย์' },
  { value: 'cash', label: 'เงินสด' },
  { value: 'credit_card', label: 'บัตรเครดิต' },
  { value: 'other', label: 'อื่นๆ' },
];

const STATUS_CONFIG = {
  pending: {
    label: 'รอชำระ',
    icon: Clock,
    color: 'text-yellow-600 bg-yellow-100',
  },
  paid: {
    label: 'ชำระแล้ว',
    icon: CheckCircle,
    color: 'text-green-600 bg-green-100',
  },
  cancelled: {
    label: 'ยกเลิก',
    icon: X,
    color: 'text-red-600 bg-red-100',
  },
  refunded: {
    label: 'คืนเงิน',
    icon: AlertCircle,
    color: 'text-purple-600 bg-purple-100',
  },
};

export function PaymentTracking({
  orderItemId,
  payments,
  totalAmountYen,
  totalAmountBaht,
  onPaymentsChange,
  readonly = false,
}: PaymentTrackingProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewProof, setPreviewProof] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    installmentNumber: payments.length + 1,
    installmentName: '',
    amountYen: '',
    amountBaht: '',
    exchangeRate: '',
    dueDate: '',
    paymentMethod: 'bank_transfer',
    notes: '',
  });

  // Calculate summary
  const summary = {
    total: payments.length,
    paid: payments.filter((p) => p.status === 'paid').length,
    pending: payments.filter((p) => p.status === 'pending').length,
    paidAmountYen: payments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + (p.amountYen || 0), 0),
    paidAmountBaht: payments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + (p.amountBaht || 0), 0),
  };

  const resetForm = () => {
    setFormData({
      installmentNumber: payments.length + 1,
      installmentName: '',
      amountYen: '',
      amountBaht: '',
      exchangeRate: '',
      dueDate: '',
      paymentMethod: 'bank_transfer',
      notes: '',
    });
    setShowAddForm(false);
    setEditingPayment(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        orderItemId,
        installmentNumber: formData.installmentNumber,
        installmentName: formData.installmentName || `งวดที่ ${formData.installmentNumber}`,
        amountYen: formData.amountYen ? parseFloat(formData.amountYen) : null,
        amountBaht: formData.amountBaht ? parseFloat(formData.amountBaht) : null,
        exchangeRate: formData.exchangeRate ? parseFloat(formData.exchangeRate) : null,
        dueDate: formData.dueDate || null,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
      };

      if (editingPayment) {
        await api.patch(`/api/v1/payments/${editingPayment.id}`, payload);
        toast.success('อัปเดตงวดชำระเงินสำเร็จ');
      } else {
        await api.post('/api/v1/payments', payload);
        toast.success('เพิ่มงวดชำระเงินสำเร็จ');
      }

      resetForm();
      onPaymentsChange?.();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.error?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (payment: Payment, newStatus: string) => {
    try {
      await api.patch(`/api/v1/payments/${payment.id}`, {
        status: newStatus,
      });
      toast.success('อัปเดตสถานะสำเร็จ');
      onPaymentsChange?.();
    } catch (error) {
      toast.error('อัปเดตสถานะไม่สำเร็จ');
    }
  };

  const handleDelete = async (paymentId: string) => {
    if (!confirm('ต้องการลบงวดชำระนี้?')) return;

    try {
      await api.delete(`/api/v1/payments/${paymentId}`);
      toast.success('ลบงวดชำระเงินสำเร็จ');
      onPaymentsChange?.();
    } catch (error) {
      toast.error('ลบงวดชำระเงินไม่สำเร็จ');
    }
  };

  const handleProofUpload = async (paymentId: string, file: File) => {
    const formData = new FormData();
    formData.append('proof', file);
    formData.append('paymentId', paymentId);

    try {
      await api.post('/api/v1/upload/payment-proof', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('อัปโหลดหลักฐานสำเร็จ');
      onPaymentsChange?.();
    } catch (error) {
      toast.error('อัปโหลดหลักฐานไม่สำเร็จ');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              การชำระเงิน
            </h3>
          </div>
          {!readonly && !showAddForm && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              <Plus className="w-4 h-4 mr-1" />
              เพิ่มงวด
            </button>
          )}
        </div>

        {/* Summary */}
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-500">งวดทั้งหมด</p>
            <p className="text-lg font-semibold">{summary.total}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2">
            <p className="text-xs text-green-600">ชำระแล้ว</p>
            <p className="text-lg font-semibold text-green-700">{summary.paid}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-2">
            <p className="text-xs text-yellow-600">รอชำระ</p>
            <p className="text-lg font-semibold text-yellow-700">{summary.pending}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2">
            <p className="text-xs text-blue-600">ยอดที่ชำระแล้ว</p>
            <p className="text-sm font-semibold text-blue-700">
              {summary.paidAmountBaht.toLocaleString()} ฿
            </p>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingPayment) && (
        <form onSubmit={handleSubmit} className="p-4 bg-blue-50 border-b border-blue-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                งวดที่
              </label>
              <input
                type="number"
                value={formData.installmentNumber}
                onChange={(e) =>
                  setFormData({ ...formData, installmentNumber: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่องวด
              </label>
              <input
                type="text"
                value={formData.installmentName}
                onChange={(e) =>
                  setFormData({ ...formData, installmentName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="เช่น งวดแรก, งวดสุดท้าย"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                จำนวนเงิน (เยน)
              </label>
              <input
                type="number"
                value={formData.amountYen}
                onChange={(e) =>
                  setFormData({ ...formData, amountYen: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="¥"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                จำนวนเงิน (บาท)
              </label>
              <input
                type="number"
                value={formData.amountBaht}
                onChange={(e) =>
                  setFormData({ ...formData, amountBaht: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="฿"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                วันครบกำหนด
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                วิธีชำระ
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData({ ...formData, paymentMethod: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                หมายเหตุ
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="หมายเหตุเพิ่มเติม"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              {editingPayment ? 'อัปเดต' : 'เพิ่ม'}งวดชำระ
            </button>
          </div>
        </form>
      )}

      {/* Payment List */}
      <div className="divide-y divide-gray-200">
        {payments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Receipt className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>ยังไม่มีงวดชำระเงิน</p>
          </div>
        ) : (
          payments.map((payment) => {
            const statusConfig = STATUS_CONFIG[payment.status];
            const StatusIcon = statusConfig.icon;

            return (
              <div key={payment.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {payment.installmentName || `งวดที่ ${payment.installmentNumber}`}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}
                      >
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      {payment.amountYen && (
                        <span>¥{payment.amountYen.toLocaleString()}</span>
                      )}
                      {payment.amountBaht && (
                        <span>฿{payment.amountBaht.toLocaleString()}</span>
                      )}
                      {payment.dueDate && (
                        <span>
                          ครบกำหนด:{' '}
                          {new Date(payment.dueDate).toLocaleDateString('th-TH')}
                        </span>
                      )}
                      {payment.paidAt && (
                        <span className="text-green-600">
                          ชำระเมื่อ:{' '}
                          {new Date(payment.paidAt).toLocaleDateString('th-TH')}
                        </span>
                      )}
                    </div>

                    {payment.notes && (
                      <p className="mt-1 text-xs text-gray-400">{payment.notes}</p>
                    )}
                  </div>

                  {/* Actions */}
                  {!readonly && (
                    <div className="flex items-center gap-1">
                      {/* Proof image */}
                      {payment.proofImageUrl ? (
                        <button
                          type="button"
                          onClick={() => setPreviewProof(payment.proofImageUrl!)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="ดูหลักฐาน"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      ) : (
                        <label className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg cursor-pointer">
                          <Upload className="w-4 h-4" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleProofUpload(payment.id, e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      )}

                      {/* Status toggle */}
                      {payment.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(payment, 'paid')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="ทำเครื่องหมายว่าชำระแล้ว"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPayment(payment);
                          setFormData({
                            installmentNumber: payment.installmentNumber,
                            installmentName: payment.installmentName || '',
                            amountYen: payment.amountYen?.toString() || '',
                            amountBaht: payment.amountBaht?.toString() || '',
                            exchangeRate: payment.exchangeRate?.toString() || '',
                            dueDate: payment.dueDate?.split('T')[0] || '',
                            paymentMethod: payment.paymentMethod || 'bank_transfer',
                            notes: payment.notes || '',
                          });
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="แก้ไข"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDelete(payment.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="ลบ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Preview proof modal */}
      {previewProof && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewProof(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white rounded-full text-gray-800 hover:bg-gray-100"
            onClick={() => setPreviewProof(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={previewProof}
            alt="หลักฐานการชำระเงิน"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

// Compact payment summary badge
export function PaymentBadge({
  payments,
}: {
  payments: { status: string }[];
}) {
  const paid = payments.filter((p) => p.status === 'paid').length;
  const total = payments.length;

  if (total === 0) {
    return (
      <span className="text-xs text-gray-400">-</span>
    );
  }

  const allPaid = paid === total;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        allPaid
          ? 'bg-green-100 text-green-700'
          : 'bg-yellow-100 text-yellow-700'
      }`}
    >
      <CreditCard className="w-3 h-3 mr-1" />
      {paid}/{total}
    </span>
  );
}

export default PaymentTracking;
