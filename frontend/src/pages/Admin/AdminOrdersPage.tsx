import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Package, Search, X, User, Phone, Building2, Bell, CreditCard } from 'lucide-react';
import { useAdminOrders, useAdminCreateOrder, useAdminUpdateOrder, useAdminDeleteOrder } from '../../hooks/useAdminOrders';
import { useCustomers } from '../../hooks/useCustomers';
import LoadingSpinner from '../../components/LoadingSpinner';
import NotifyStatusModal from '../../components/Admin/NotifyStatusModal';
import NotifyPaymentModal from '../../components/Admin/NotifyPaymentModal';

// Country options for Origin/Destination
const COUNTRIES = [
  { code: 'JP', name: 'Japan', nameLocal: '🇯🇵 ญี่ปุ่น (Japan)' },
  { code: 'TH', name: 'Thailand', nameLocal: '🇹🇭 ไทย (Thailand)' },
  { code: 'CN', name: 'China', nameLocal: '🇨🇳 จีน (China)' },
  { code: 'KR', name: 'South Korea', nameLocal: '🇰🇷 เกาหลีใต้ (South Korea)' },
  { code: 'TW', name: 'Taiwan', nameLocal: '🇹🇼 ไต้หวัน (Taiwan)' },
  { code: 'HK', name: 'Hong Kong', nameLocal: '🇭🇰 ฮ่องกง (Hong Kong)' },
  { code: 'SG', name: 'Singapore', nameLocal: '🇸🇬 สิงคโปร์ (Singapore)' },
  { code: 'MY', name: 'Malaysia', nameLocal: '🇲🇾 มาเลเซีย (Malaysia)' },
  { code: 'VN', name: 'Vietnam', nameLocal: '🇻🇳 เวียดนาม (Vietnam)' },
  { code: 'ID', name: 'Indonesia', nameLocal: '🇮🇩 อินโดนีเซีย (Indonesia)' },
  { code: 'PH', name: 'Philippines', nameLocal: '🇵🇭 ฟิลิปปินส์ (Philippines)' },
  { code: 'US', name: 'United States', nameLocal: '🇺🇸 สหรัฐอเมริกา (USA)' },
  { code: 'UK', name: 'United Kingdom', nameLocal: '🇬🇧 สหราชอาณาจักร (UK)' },
  { code: 'DE', name: 'Germany', nameLocal: '🇩🇪 เยอรมนี (Germany)' },
  { code: 'FR', name: 'France', nameLocal: '🇫🇷 ฝรั่งเศส (France)' },
  { code: 'AU', name: 'Australia', nameLocal: '🇦🇺 ออสเตรเลีย (Australia)' },
];

const AdminOrdersPage = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [editingOrder, setEditingOrder] = useState<any>(null);

  // Notification modal states
  const [notifyStatusOrder, setNotifyStatusOrder] = useState<{ id: string; orderNumber: string } | null>(null);
  const [notifyPaymentOrder, setNotifyPaymentOrder] = useState<{ id: string; orderNumber: string } | null>(null);

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
  const { data: customersData } = useCustomers(1, 500);
  const createOrder = useAdminCreateOrder();
  const updateOrder = useAdminUpdateOrder();
  const deleteOrder = useAdminDeleteOrder();

  // Filter customers based on search query
  const filteredCustomers = useMemo(() => {
    if (!customersData?.data) return [];
    if (!customerSearchQuery.trim()) return customersData.data;

    const query = customerSearchQuery.toLowerCase();
    return customersData.data.filter((customer) => {
      const companyName = (customer.companyName || '').toLowerCase();
      const contactPerson = (customer.contactPerson || '').toLowerCase();
      const phone = (customer.phone || '').toLowerCase();
      const lineId = (customer.lineId || '').toLowerCase();

      return (
        companyName.includes(query) ||
        contactPerson.includes(query) ||
        phone.includes(query) ||
        lineId.includes(query)
      );
    });
  }, [customersData?.data, customerSearchQuery]);

  // Get selected customer display name
  const getSelectedCustomerName = () => {
    if (!formData.customerId || !customersData?.data) return null;
    const customer = customersData.data.find((c) => c.id === formData.customerId);
    if (!customer) return null;
    return customer.companyName || customer.contactPerson || customer.phone || 'ไม่มีชื่อ';
  };

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
                      {COUNTRIES.find(c => c.name === order.origin)?.nameLocal || order.origin || '-'} → {COUNTRIES.find(c => c.name === order.destination)?.nameLocal || order.destination || '-'}
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
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                        className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                        title="ดูรายละเอียดและรายการสินค้า"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(order)}
                        className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                        title="แก้ไข"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setNotifyStatusOrder({ id: order.id, orderNumber: order.orderNumber })}
                        className="p-1.5 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded"
                        title="แจ้งเตือนสถานะ"
                      >
                        <Bell className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setNotifyPaymentOrder({ id: order.id, orderNumber: order.orderNumber })}
                        className="p-1.5 text-amber-600 hover:text-amber-900 hover:bg-amber-50 rounded"
                        title="แจ้งเตือนชำระเงิน"
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                        title="ลบ"
                      >
                        <Trash2 className="w-4 h-4" />
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
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerSearchQuery('');
                        setShowCustomerSearch(true);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center gap-2"
                    >
                      <Search className="w-4 h-4 text-gray-400" />
                      <span className={formData.customerId ? 'text-gray-900' : 'text-gray-400'}>
                        {getSelectedCustomerName() || 'ค้นหาลูกค้า...'}
                      </span>
                    </button>
                    {formData.customerId && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, customerId: '' })}
                        className="px-2 py-2 border border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-300 text-gray-400 hover:text-red-500"
                        title="ล้างการเลือก"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Origin (ต้นทาง)</label>
                  <select
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">-- เลือกประเทศต้นทาง --</option>
                    {COUNTRIES.map((country) => (
                      <option key={country.code} value={country.name}>
                        {country.nameLocal}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destination (ปลายทาง)</label>
                  <select
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">-- เลือกประเทศปลายทาง --</option>
                    {COUNTRIES.map((country) => (
                      <option key={country.code} value={country.name}>
                        {country.nameLocal}
                      </option>
                    ))}
                  </select>
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

      {/* Customer Search Modal */}
      {showCustomerSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[80vh] flex flex-col shadow-xl">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">ค้นหาลูกค้า</h3>
              <button
                onClick={() => setShowCustomerSearch(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  placeholder="ค้นหาด้วยชื่อ, เบอร์โทร, LINE ID..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                พบ {filteredCustomers.length} รายการ {customerSearchQuery && `สำหรับ "${customerSearchQuery}"`}
              </p>
            </div>

            {/* Customer List */}
            <div className="flex-1 overflow-y-auto">
              {filteredCustomers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>ไม่พบลูกค้าที่ตรงกัน</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredCustomers.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, customerId: customer.id });
                        setShowCustomerSearch(false);
                      }}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        formData.customerId === customer.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {customer.companyName || customer.contactPerson || 'ไม่มีชื่อ'}
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                            {customer.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {customer.phone}
                              </span>
                            )}
                            {customer.companyName && customer.contactPerson && (
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {customer.contactPerson}
                              </span>
                            )}
                            {customer.lineId && (
                              <span className="text-green-600">LINE: {customer.lineId}</span>
                            )}
                          </div>
                          {customer.tier && customer.tier !== 'regular' && (
                            <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                              customer.tier === 'vip' ? 'bg-yellow-100 text-yellow-800' :
                              customer.tier === 'premium' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {customer.tier.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, customerId: '' });
                  setShowCustomerSearch(false);
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                ล้างการเลือก
              </button>
              <button
                type="button"
                onClick={() => setShowCustomerSearch(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notify Status Modal */}
      {notifyStatusOrder && (
        <NotifyStatusModal
          isOpen={!!notifyStatusOrder}
          onClose={() => setNotifyStatusOrder(null)}
          orderId={notifyStatusOrder.id}
          orderNumber={notifyStatusOrder.orderNumber}
        />
      )}

      {/* Notify Payment Modal */}
      {notifyPaymentOrder && (
        <NotifyPaymentModal
          isOpen={!!notifyPaymentOrder}
          onClose={() => setNotifyPaymentOrder(null)}
          orderId={notifyPaymentOrder.id}
          orderNumber={notifyPaymentOrder.orderNumber}
        />
      )}
    </div>
  );
};

export default AdminOrdersPage;
