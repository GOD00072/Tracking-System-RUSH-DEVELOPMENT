import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Package } from 'lucide-react';
import { useAdminOrders, useAdminCreateOrder, useAdminUpdateOrder, useAdminDeleteOrder } from '../../hooks/useAdminOrders';
import { useCustomers } from '../../hooks/useCustomers';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminOrdersPage = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [formData, setFormData] = useState({
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

  const { data: ordersData, isLoading } = useAdminOrders(1, 50);
  const { data: customersData } = useCustomers(1, 100);
  const createOrder = useAdminCreateOrder();
  const updateOrder = useAdminUpdateOrder();
  const deleteOrder = useAdminDeleteOrder();

  // Generate order number: YYYYMMDD-ORD-XXX
  const generateOrderNumber = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;

    // Find today's orders
    const todayOrders = ordersData?.data.filter((order) =>
      order.orderNumber.startsWith(datePrefix)
    ) || [];

    // Get next number
    const nextNumber = todayOrders.length + 1;
    const orderSuffix = String(nextNumber).padStart(3, '0');

    return `${datePrefix}-ORD-${orderSuffix}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const orderData = {
      orderNumber: formData.orderNumber,
      customerId: formData.customerId || undefined,
      shippingMethod: formData.shippingMethod,
      status: formData.status,
      origin: formData.origin || undefined,
      destination: formData.destination || undefined,
      totalWeight: formData.totalWeight ? parseFloat(formData.totalWeight) : undefined,
      totalVolume: formData.totalVolume ? parseFloat(formData.totalVolume) : undefined,
      estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined,
      actualCost: formData.actualCost ? parseFloat(formData.actualCost) : undefined,
      estimatedDelivery: formData.estimatedDelivery || undefined,
      notes: formData.notes || undefined,
    };

    if (editingOrder) {
      updateOrder.mutate(
        {
          id: editingOrder.id,
          data: orderData,
        },
        {
          onSuccess: () => {
            setShowModal(false);
            setEditingOrder(null);
            resetForm();
          },
        }
      );
    } else {
      createOrder.mutate(orderData, {
        onSuccess: () => {
          setShowModal(false);
          resetForm();
        },
      });
    }
  };

  const resetForm = () => {
    setFormData({
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
  };

  const handleEdit = (order: any) => {
    setEditingOrder(order);
    setFormData({
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
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this order?')) {
      deleteOrder.mutate(id);
    }
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order Management</h1>
        <button
          onClick={() => {
            setEditingOrder(null);
            resetForm();
            // Generate order number automatically
            const newOrderNumber = generateOrderNumber();
            setFormData((prev) => ({ ...prev, orderNumber: newOrderNumber }));
            setShowModal(true);
          }}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Order
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ordersData?.data.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="w-5 h-5 text-gray-400 mr-2" />
                      <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.customer?.companyName || order.customer?.contactPerson || 'N/A'}
                    </div>
                    {order.customer?.phone && (
                      <div className="text-xs text-gray-500">{order.customer.phone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.origin || '-'} → {order.destination || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {order.shippingMethod === 'sea' ? '🚢 ทางเรือ' : '✈️ ทางอากาศ'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                        className="text-green-600 hover:text-green-900"
                        title="ดูรายละเอียดและรายการสินค้า"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(order)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {ordersData && ordersData.data.length === 0 && (
            <div className="text-center py-12 text-gray-500">No orders found. Create your first order!</div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingOrder ? 'Edit Order' : 'Add New Order'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Number *</label>
                  <input
                    type="text"
                    value={formData.orderNumber}
                    onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="ORD-2024-001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer (Optional)</label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Method *</label>
                  <select
                    value={formData.shippingMethod}
                    onChange={(e) => setFormData({ ...formData, shippingMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="sea">🚢 ทางเรือ (Sea)</option>
                    <option value="air">✈️ ทางอากาศ (Air)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="pending">รอดำเนินการ</option>
                    <option value="processing">กำลังดำเนินการ</option>
                    <option value="shipped">จัดส่งแล้ว</option>
                    <option value="delivered">ส่งถึงแล้ว</option>
                    <option value="cancelled">ยกเลิก</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
                  <input
                    type="text"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Bangkok, Thailand"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Shanghai, China"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.totalWeight}
                    onChange={(e) => setFormData({ ...formData, totalWeight: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="1000.50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Volume (m³)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.totalVolume}
                    onChange={(e) => setFormData({ ...formData, totalVolume: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="50.25"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.estimatedCost}
                    onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="50000.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Actual Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.actualCost}
                    onChange={(e) => setFormData({ ...formData, actualCost: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="48000.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Delivery</label>
                  <input
                    type="date"
                    value={formData.estimatedDelivery}
                    onChange={(e) => setFormData({ ...formData, estimatedDelivery: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingOrder(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createOrder.isPending || updateOrder.isPending}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {createOrder.isPending || updateOrder.isPending
                    ? 'Saving...'
                    : editingOrder
                    ? 'Update'
                    : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
