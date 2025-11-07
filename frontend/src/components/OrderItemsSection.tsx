import { useState } from 'react';
import { Plus, Edit, Trash2, ExternalLink, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrderItems, useCreateOrderItem, useUpdateOrderItem, useDeleteOrderItem } from '../hooks/useOrderItems';
import LoadingSpinner from './LoadingSpinner';
import { buttonTap } from '../lib/animations';

type OrderItemsSectionProps = {
  orderId: string;
  orderNumber: string;
  canEdit?: boolean;
};

const OrderItemsSection = ({ orderId, orderNumber, canEdit = true }: OrderItemsSectionProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    sequenceNumber: '',
    clickDate: '',
    clickChannel: '',
    clickerName: '',
    customerName: '',
    productCode: '',
    productUrl: '',
    priceYen: '',
    priceBaht: '',
    itemStatus: 'ordered',
    paymentStatus: 'pending',
    shippingRound: '',
    trackingNumber: '',
    storePage: '',
    remarks: '',
  });

  const { data: itemsData, isLoading } = useOrderItems(orderId);
  const createItem = useCreateOrderItem();
  const updateItem = useUpdateOrderItem();
  const deleteItem = useDeleteOrderItem();

  const items = itemsData?.data || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const itemData = {
      orderId,
      sequenceNumber: formData.sequenceNumber ? parseInt(formData.sequenceNumber) : undefined,
      clickDate: formData.clickDate || undefined,
      clickChannel: formData.clickChannel || undefined,
      clickerName: formData.clickerName || undefined,
      customerName: formData.customerName || undefined,
      productCode: formData.productCode || undefined,
      productUrl: formData.productUrl || undefined,
      priceYen: formData.priceYen ? parseFloat(formData.priceYen) : undefined,
      priceBaht: formData.priceBaht ? parseFloat(formData.priceBaht) : undefined,
      itemStatus: formData.itemStatus || undefined,
      paymentStatus: formData.paymentStatus || undefined,
      shippingRound: formData.shippingRound || undefined,
      trackingNumber: formData.trackingNumber || undefined,
      storePage: formData.storePage || undefined,
      remarks: formData.remarks || undefined,
    };

    if (editingItem) {
      updateItem.mutate(
        { id: editingItem.id, data: itemData },
        {
          onSuccess: () => {
            setShowForm(false);
            setEditingItem(null);
            resetForm();
          },
        }
      );
    } else {
      createItem.mutate(itemData, {
        onSuccess: () => {
          setShowForm(false);
          resetForm();
        },
      });
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      sequenceNumber: item.sequenceNumber?.toString() || '',
      clickDate: item.clickDate ? new Date(item.clickDate).toISOString().split('T')[0] : '',
      clickChannel: item.clickChannel || '',
      clickerName: item.clickerName || '',
      customerName: item.customerName || '',
      productCode: item.productCode || '',
      productUrl: item.productUrl || '',
      priceYen: item.priceYen?.toString() || '',
      priceBaht: item.priceBaht?.toString() || '',
      itemStatus: item.itemStatus || 'ordered',
      paymentStatus: item.paymentStatus || 'pending',
      shippingRound: item.shippingRound || '',
      trackingNumber: item.trackingNumber || '',
      storePage: item.storePage || '',
      remarks: item.remarks || '',
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('คุณต้องการลบรายการสินค้านี้?')) {
      deleteItem.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData({
      sequenceNumber: '',
      clickDate: '',
      clickChannel: '',
      clickerName: '',
      customerName: '',
      productCode: '',
      productUrl: '',
      priceYen: '',
      priceBaht: '',
      itemStatus: 'ordered',
      paymentStatus: 'pending',
      shippingRound: '',
      trackingNumber: '',
      storePage: '',
      remarks: '',
    });
  };

  const getStatusBadge = (status?: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-800',
      ordered: 'bg-blue-100 text-blue-800',
      received: 'bg-purple-100 text-purple-800',
      packing: 'bg-yellow-100 text-yellow-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${statusColors[status || 'pending'] || 'bg-gray-100 text-gray-800'}`}>
        {status || 'pending'}
      </span>
    );
  };

  const getPaymentBadge = (status?: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-red-100 text-red-800',
      partial: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      refunded: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${statusColors[status || 'pending'] || 'bg-gray-100 text-gray-800'}`}>
        {status || 'pending'}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size={100} />
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-primary-600" />
          <div>
            <h2 className="text-xl font-bold">รายการสินค้า</h2>
            <p className="text-sm text-gray-600">Order: {orderNumber}</p>
          </div>
        </div>
        {canEdit && (
          <motion.button
            onClick={() => {
              setEditingItem(null);
              resetForm();
              setShowForm(!showForm);
            }}
            className="btn-primary flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={buttonTap}
          >
            <Plus className="w-4 h-4" />
            เพิ่มสินค้า
          </motion.button>
        )}
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-gray-50 rounded-lg"
          >
            <h3 className="font-semibold mb-4">{editingItem ? 'แก้ไขรายการสินค้า' : 'เพิ่มรายการสินค้า'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ลำดับที่</label>
                  <input
                    type="number"
                    value={formData.sequenceNumber}
                    onChange={(e) => setFormData({ ...formData, sequenceNumber: e.target.value })}
                    className="input-field"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">วันที่กด</label>
                  <input
                    type="date"
                    value={formData.clickDate}
                    onChange={(e) => setFormData({ ...formData, clickDate: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ช่องทางการกด</label>
                  <select
                    value={formData.clickChannel}
                    onChange={(e) => setFormData({ ...formData, clickChannel: e.target.value })}
                    className="input-field"
                  >
                    <option value="">เลือกช่องทาง</option>
                    <option value="LINE">LINE</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Website">Website</option>
                    <option value="Email">Email</option>
                    <option value="Phone">โทรศัพท์</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ชื่อคนกด</label>
                  <input
                    type="text"
                    value={formData.clickerName}
                    onChange={(e) => setFormData({ ...formData, clickerName: e.target.value })}
                    className="input-field"
                    placeholder="ชื่อผู้กด"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ชื่อลูกค้า</label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="input-field"
                    placeholder="ชื่อลูกค้า"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">รหัสสินค้า</label>
                  <input
                    type="text"
                    value={formData.productCode}
                    onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                    className="input-field"
                    placeholder="PROD-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ลิ้งค์สินค้า</label>
                  <input
                    type="url"
                    value={formData.productUrl}
                    onChange={(e) => setFormData({ ...formData, productUrl: e.target.value })}
                    className="input-field"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ราคาเยน</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.priceYen}
                    onChange={(e) => setFormData({ ...formData, priceYen: e.target.value })}
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ราคาบาท</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.priceBaht}
                    onChange={(e) => setFormData({ ...formData, priceBaht: e.target.value })}
                    className="input-field"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">สถานะสินค้า</label>
                  <select
                    value={formData.itemStatus}
                    onChange={(e) => setFormData({ ...formData, itemStatus: e.target.value })}
                    className="input-field"
                  >
                    <option value="pending">รอดำเนินการ</option>
                    <option value="ordered">สั่งซื้อแล้ว</option>
                    <option value="received">รับสินค้าแล้ว</option>
                    <option value="packing">กำลังแพ็ค</option>
                    <option value="shipped">จัดส่งแล้ว</option>
                    <option value="delivered">ส่งถึงแล้ว</option>
                    <option value="cancelled">ยกเลิก</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">สถานะการจ่ายเงิน</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                    className="input-field"
                  >
                    <option value="pending">รอชำระ</option>
                    <option value="partial">ชำระบางส่วน</option>
                    <option value="paid">ชำระครบ</option>
                    <option value="refunded">คืนเงิน</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">รอบส่งกลับ</label>
                  <input
                    type="text"
                    value={formData.shippingRound}
                    onChange={(e) => setFormData({ ...formData, shippingRound: e.target.value })}
                    className="input-field"
                    placeholder="Round 1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tracking Number</label>
                  <input
                    type="text"
                    value={formData.trackingNumber}
                    onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                    className="input-field"
                    placeholder="TH123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">เพจ/ร้าน</label>
                  <input
                    type="text"
                    value={formData.storePage}
                    onChange={(e) => setFormData({ ...formData, storePage: e.target.value })}
                    className="input-field"
                    placeholder="ชื่อร้าน"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">หมายเหตุ</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="หมายเหตุเพิ่มเติม..."
                />
              </div>

              <div className="flex gap-2">
                <motion.button
                  type="submit"
                  className="btn-primary"
                  whileTap={buttonTap}
                  disabled={createItem.isPending || updateItem.isPending}
                >
                  {createItem.isPending || updateItem.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                    resetForm();
                  }}
                  className="btn-secondary"
                  whileTap={buttonTap}
                >
                  ยกเลิก
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>ยังไม่มีรายการสินค้า</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ลำดับ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">รหัสสินค้า</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ลิ้งค์สินค้า</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ราคา (¥/฿)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">การชำระ</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracking</th>
                {canEdit && <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">จัดการ</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{item.sequenceNumber || '-'}</td>
                  <td className="px-4 py-3 text-sm font-mono">{item.productCode || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    {item.productUrl ? (
                      <a
                        href={item.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline flex items-center gap-1"
                      >
                        ดูสินค้า
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {item.priceYen && <div>¥{item.priceYen.toLocaleString()}</div>}
                    {item.priceBaht && <div className="text-gray-600">฿{item.priceBaht.toLocaleString()}</div>}
                    {!item.priceYen && !item.priceBaht && '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">{getStatusBadge(item.itemStatus)}</td>
                  <td className="px-4 py-3 text-sm">{getPaymentBadge(item.paymentStatus)}</td>
                  <td className="px-4 py-3 text-sm font-mono text-xs">{item.trackingNumber || '-'}</td>
                  {canEdit && (
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        <motion.button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-800"
                          whileTap={buttonTap}
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800"
                          whileTap={buttonTap}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          รวม {items.length} รายการ
        </div>
      )}
    </div>
  );
};

export default OrderItemsSection;
