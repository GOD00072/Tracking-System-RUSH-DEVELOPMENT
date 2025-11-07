import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Save, Trash2, Plus, Edit, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAdminOrders, useAdminUpdateOrder, useAdminDeleteOrder } from '../../hooks/useAdminOrders';
import { useCustomers } from '../../hooks/useCustomers';
import { useOrderItems, useCreateOrderItem, useUpdateOrderItem, useDeleteOrderItem } from '../../hooks/useOrderItems';
import LoadingSpinner from '../../components/LoadingSpinner';
import { buttonTap } from '../../lib/animations';

const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: ordersData } = useAdminOrders(1, 1000);
  const { data: customersData } = useCustomers(1, 1000);
  const { data: itemsData, isLoading: itemsLoading } = useOrderItems(id);
  const updateOrder = useAdminUpdateOrder();
  const deleteOrder = useAdminDeleteOrder();
  const createItem = useCreateOrderItem();
  const updateItem = useUpdateOrderItem();
  const deleteItem = useDeleteOrderItem();

  const order = ordersData?.data.find((o) => o.id === id);
  const items = itemsData?.data || [];

  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Order form state
  const [orderForm, setOrderForm] = useState({
    orderNumber: '',
    customerId: '',
    shippingMethod: 'sea',
    status: 'pending',
    origin: '',
    destination: '',
    totalWeight: '',
    totalVolume: '',
    estimatedCost: '',
    actualCost: '',
    estimatedDelivery: '',
    notes: '',
  });

  // Item form state
  const [itemForm, setItemForm] = useState({
    sequenceNumber: '',
    clickDate: '',
    clickChannel: '',
    clickerName: '',
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

  // Load order data into form
  useEffect(() => {
    if (order) {
      setOrderForm({
        orderNumber: order.orderNumber,
        customerId: order.customerId || '',
        shippingMethod: order.shippingMethod,
        status: order.status,
        origin: order.origin || '',
        destination: order.destination || '',
        totalWeight: order.totalWeight?.toString() || '',
        totalVolume: order.totalVolume?.toString() || '',
        estimatedCost: order.estimatedCost?.toString() || '',
        actualCost: order.actualCost?.toString() || '',
        estimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery).toISOString().split('T')[0] : '',
        notes: order.notes || '',
      });
    }
  }, [order]);

  const handleUpdateOrder = () => {
    if (!id) return;

    const orderData = {
      orderNumber: orderForm.orderNumber,
      customerId: orderForm.customerId || undefined,
      shippingMethod: orderForm.shippingMethod,
      status: orderForm.status,
      origin: orderForm.origin || undefined,
      destination: orderForm.destination || undefined,
      totalWeight: orderForm.totalWeight ? parseFloat(orderForm.totalWeight) : undefined,
      totalVolume: orderForm.totalVolume ? parseFloat(orderForm.totalVolume) : undefined,
      estimatedCost: orderForm.estimatedCost ? parseFloat(orderForm.estimatedCost) : undefined,
      actualCost: orderForm.actualCost ? parseFloat(orderForm.actualCost) : undefined,
      estimatedDelivery: orderForm.estimatedDelivery || undefined,
      notes: orderForm.notes || undefined,
    };

    updateOrder.mutate({ id, data: orderData });
  };

  const handleDeleteOrder = () => {
    if (!id) return;
    if (window.confirm('คุณต้องการลบ Order นี้? (รายการสินค้าทั้งหมดจะถูกลบด้วย)')) {
      deleteOrder.mutate(id, {
        onSuccess: () => {
          navigate('/admin/orders');
        },
      });
    }
  };

  const handleSubmitItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    // Get customer name and company name from order
    const customerName = order?.customer?.companyName || order?.customer?.contactPerson || '';
    const companyName = order?.customer?.companyName || '';

    const itemData = {
      orderId: id,
      sequenceNumber: itemForm.sequenceNumber ? parseInt(itemForm.sequenceNumber) : undefined,
      clickDate: itemForm.clickDate || undefined,
      clickChannel: itemForm.clickChannel || undefined,
      clickerName: itemForm.clickerName || undefined,
      customerName: customerName, // Locked to order's customer
      productCode: itemForm.productCode || undefined,
      productUrl: itemForm.productUrl || undefined,
      priceYen: itemForm.priceYen ? parseFloat(itemForm.priceYen) : undefined,
      priceBaht: itemForm.priceBaht ? parseFloat(itemForm.priceBaht) : undefined,
      itemStatus: itemForm.itemStatus || undefined,
      paymentStatus: itemForm.paymentStatus || undefined,
      shippingRound: itemForm.shippingRound || undefined,
      trackingNumber: itemForm.trackingNumber || undefined,
      storePage: companyName, // Locked to order's company name
      remarks: itemForm.remarks || undefined,
    };

    if (editingItem) {
      updateItem.mutate(
        { id: editingItem.id, data: itemData },
        {
          onSuccess: () => {
            setShowItemForm(false);
            setEditingItem(null);
            resetItemForm();
          },
        }
      );
    } else {
      createItem.mutate(itemData, {
        onSuccess: () => {
          setShowItemForm(false);
          resetItemForm();
        },
      });
    }
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setItemForm({
      sequenceNumber: item.sequenceNumber?.toString() || '',
      clickDate: item.clickDate ? new Date(item.clickDate).toISOString().split('T')[0] : '',
      clickChannel: item.clickChannel || '',
      clickerName: item.clickerName || '',
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
    setShowItemForm(true);
  };

  const handleDeleteItem = (itemId: string) => {
    if (window.confirm('คุณต้องการลบรายการสินค้านี้?')) {
      deleteItem.mutate(itemId);
    }
  };

  const resetItemForm = () => {
    setItemForm({
      sequenceNumber: '',
      clickDate: '',
      clickChannel: '',
      clickerName: '',
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

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: 'รอดำเนินการ',
      processing: 'กำลังดำเนินการ',
      shipped: 'จัดส่งแล้ว',
      delivered: 'ส่งถึงแล้ว',
      cancelled: 'ยกเลิก',
    };
    return texts[status] || status;
  };

  const getItemStatusBadge = (status?: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-800',
      ordered: 'bg-blue-100 text-blue-800',
      received: 'bg-purple-100 text-purple-800',
      packing: 'bg-yellow-100 text-yellow-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const statusText: Record<string, string> = {
      pending: 'รอดำเนินการ',
      ordered: 'สั่งซื้อแล้ว',
      received: 'รับสินค้าแล้ว',
      packing: 'กำลังแพ็ค',
      shipped: 'จัดส่งแล้ว',
      delivered: 'ส่งถึงแล้ว',
      cancelled: 'ยกเลิก',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${statusColors[status || 'pending']}`}>
        {statusText[status || 'pending']}
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
    const statusText: Record<string, string> = {
      pending: 'รอชำระ',
      partial: 'ชำระบางส่วน',
      paid: 'ชำระครบ',
      refunded: 'คืนเงิน',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${statusColors[status || 'pending']}`}>
        {statusText[status || 'pending']}
      </span>
    );
  };

  if (!order) {
    return (
      <div className="p-6">
        <LoadingSpinner />
      </div>
    );
  }

  const customerName = order.customer?.companyName || order.customer?.contactPerson || 'ไม่ระบุ';
  const companyName = order.customer?.companyName || 'ไม่ระบุ';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/orders')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            ย้อนกลับ
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">รายละเอียด Order</h1>
              <p className="text-gray-600 mt-1">Order Number: {order.orderNumber}</p>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                onClick={handleUpdateOrder}
                disabled={updateOrder.isPending}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2 disabled:opacity-50"
                whileTap={buttonTap}
              >
                <Save className="w-5 h-5" />
                บันทึกการแก้ไข
              </motion.button>
              <motion.button
                onClick={handleDeleteOrder}
                disabled={deleteOrder.isPending}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
                whileTap={buttonTap}
              >
                <Trash2 className="w-5 h-5" />
                ลบ Order
              </motion.button>
            </div>
          </div>
        </div>

        {/* Order Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Package className="w-6 h-6 text-primary-600" />
            ข้อมูล Order
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Number</label>
              <input
                type="text"
                value={orderForm.orderNumber}
                onChange={(e) => setOrderForm({ ...orderForm, orderNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ลูกค้า</label>
              <select
                value={orderForm.customerId}
                onChange={(e) => setOrderForm({ ...orderForm, customerId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- เลือกลูกค้า --</option>
                {customersData?.data.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.companyName || customer.contactPerson || customer.phone || 'ไม่มีชื่อ'}
                    {customer.phone && ` (${customer.phone})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
              <select
                value={orderForm.status}
                onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="pending">รอดำเนินการ</option>
                <option value="processing">กำลังดำเนินการ</option>
                <option value="shipped">จัดส่งแล้ว</option>
                <option value="delivered">ส่งถึงแล้ว</option>
                <option value="cancelled">ยกเลิก</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วิธีการจัดส่ง</label>
              <select
                value={orderForm.shippingMethod}
                onChange={(e) => setOrderForm({ ...orderForm, shippingMethod: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="sea">🚢 ทางเรือ</option>
                <option value="air">✈️ ทางอากาศ</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ต้นทาง</label>
              <input
                type="text"
                value={orderForm.origin}
                onChange={(e) => setOrderForm({ ...orderForm, origin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="เช่น กรุงเทพ"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ปลายทาง</label>
              <input
                type="text"
                value={orderForm.destination}
                onChange={(e) => setOrderForm({ ...orderForm, destination: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="เช่น โตเกียว"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">น้ำหนัก (kg)</label>
              <input
                type="number"
                step="0.01"
                value={orderForm.totalWeight}
                onChange={(e) => setOrderForm({ ...orderForm, totalWeight: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ปริมาตร (m³)</label>
              <input
                type="number"
                step="0.01"
                value={orderForm.totalVolume}
                onChange={(e) => setOrderForm({ ...orderForm, totalVolume: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ค่าใช้จ่ายโดยประมาณ</label>
              <input
                type="number"
                step="0.01"
                value={orderForm.estimatedCost}
                onChange={(e) => setOrderForm({ ...orderForm, estimatedCost: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ค่าใช้จ่ายจริง</label>
              <input
                type="number"
                step="0.01"
                value={orderForm.actualCost}
                onChange={(e) => setOrderForm({ ...orderForm, actualCost: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่จัดส่งโดยประมาณ</label>
              <input
                type="date"
                value={orderForm.estimatedDelivery}
                onChange={(e) => setOrderForm({ ...orderForm, estimatedDelivery: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
            <textarea
              value={orderForm.notes}
              onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="หมายเหตุเพิ่มเติม..."
            />
          </div>
        </div>

        {/* Order Items Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Package className="w-6 h-6 text-primary-600" />
                รายการสินค้า
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                ชื่อลูกค้า: <span className="font-semibold">{customerName}</span> •
                ชื่อเพจ/ร้าน: <span className="font-semibold">{companyName}</span>
                <span className="text-xs text-gray-500 ml-1">(ล็อคอัตโนมัติ)</span>
              </p>
            </div>
            <motion.button
              onClick={() => {
                setEditingItem(null);
                resetItemForm();
                setShowItemForm(!showItemForm);
              }}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
              whileTap={buttonTap}
            >
              <Plus className="w-5 h-5" />
              เพิ่มสินค้า
            </motion.button>
          </div>

          {/* Item Form */}
          {showItemForm && (
            <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold mb-4 text-lg">
                {editingItem ? 'แก้ไขรายการสินค้า' : 'เพิ่มรายการสินค้าใหม่'}
              </h3>
              <form onSubmit={handleSubmitItem} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ลำดับที่</label>
                    <input
                      type="number"
                      value={itemForm.sequenceNumber}
                      onChange={(e) => setItemForm({ ...itemForm, sequenceNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">วันที่กด</label>
                    <input
                      type="date"
                      value={itemForm.clickDate}
                      onChange={(e) => setItemForm({ ...itemForm, clickDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ช่องทางการกด</label>
                    <select
                      value={itemForm.clickChannel}
                      onChange={(e) => setItemForm({ ...itemForm, clickChannel: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">เลือก</option>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อคนกด</label>
                    <input
                      type="text"
                      value={itemForm.clickerName}
                      onChange={(e) => setItemForm({ ...itemForm, clickerName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="ชื่อผู้กด"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ชื่อลูกค้า
                      <span className="ml-2 text-xs text-gray-500">(ล็อคอัตโนมัติ)</span>
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">รหัสสินค้า</label>
                    <input
                      type="text"
                      value={itemForm.productCode}
                      onChange={(e) => setItemForm({ ...itemForm, productCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="PROD-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ลิ้งค์สินค้า</label>
                    <input
                      type="url"
                      value={itemForm.productUrl}
                      onChange={(e) => setItemForm({ ...itemForm, productUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ราคาเยน (¥)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={itemForm.priceYen}
                      onChange={(e) => setItemForm({ ...itemForm, priceYen: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ราคาบาท (฿)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={itemForm.priceBaht}
                      onChange={(e) => setItemForm({ ...itemForm, priceBaht: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">สถานะสินค้า</label>
                    <select
                      value={itemForm.itemStatus}
                      onChange={(e) => setItemForm({ ...itemForm, itemStatus: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">สถานะการจ่าย</label>
                    <select
                      value={itemForm.paymentStatus}
                      onChange={(e) => setItemForm({ ...itemForm, paymentStatus: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="pending">รอชำระ</option>
                      <option value="partial">ชำระบางส่วน</option>
                      <option value="paid">ชำระครบ</option>
                      <option value="refunded">คืนเงิน</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">รอบส่งกลับ</label>
                    <input
                      type="text"
                      value={itemForm.shippingRound}
                      onChange={(e) => setItemForm({ ...itemForm, shippingRound: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Round 1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                    <input
                      type="text"
                      value={itemForm.trackingNumber}
                      onChange={(e) => setItemForm({ ...itemForm, trackingNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="TH123456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      เพจ/ร้าน
                      <span className="ml-2 text-xs text-gray-500">(ล็อคอัตโนมัติ)</span>
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
                  <textarea
                    value={itemForm.remarks}
                    onChange={(e) => setItemForm({ ...itemForm, remarks: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="หมายเหตุเพิ่มเติม..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <motion.button
                    type="submit"
                    disabled={createItem.isPending || updateItem.isPending}
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    whileTap={buttonTap}
                  >
                    {createItem.isPending || updateItem.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => {
                      setShowItemForm(false);
                      setEditingItem(null);
                      resetItemForm();
                    }}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
                    whileTap={buttonTap}
                  >
                    ยกเลิก
                  </motion.button>
                </div>
              </form>
            </div>
          )}

          {/* Items Table */}
          {itemsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-3 opacity-30" />
              <p className="text-lg">ยังไม่มีรายการสินค้า</p>
              <p className="text-sm mt-1">คลิกปุ่ม "เพิ่มสินค้า" เพื่อเริ่มต้น</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ลำดับ</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">รหัสสินค้า</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ลิ้งค์</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ราคา</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">สถานะสินค้า</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">การชำระ</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tracking</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item: any) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{item.sequenceNumber || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{item.productCode || '-'}</code>
                        </td>
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
                          {item.priceYen && <div className="font-medium">¥{item.priceYen.toLocaleString()}</div>}
                          {item.priceBaht && <div className="text-gray-600 text-xs">฿{item.priceBaht.toLocaleString()}</div>}
                          {!item.priceYen && !item.priceBaht && '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">{getItemStatusBadge(item.itemStatus)}</td>
                        <td className="px-4 py-3 text-sm">{getPaymentBadge(item.paymentStatus)}</td>
                        <td className="px-4 py-3 text-sm">
                          {item.trackingNumber ? (
                            <code className="text-xs text-gray-600">{item.trackingNumber}</code>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex items-center justify-end gap-2">
                            <motion.button
                              onClick={() => handleEditItem(item)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              whileTap={buttonTap}
                              title="แก้ไข"
                            >
                              <Edit className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                              whileTap={buttonTap}
                              title="ลบ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-gray-600 flex items-center justify-between">
                <span>รวม {items.length} รายการ</span>
                {items.reduce((sum, item) => sum + (item.priceBaht || 0), 0) > 0 && (
                  <span className="font-semibold">
                    ยอดรวม: ฿{items.reduce((sum, item) => sum + (item.priceBaht || 0), 0).toLocaleString()}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
