import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Package, Search, X, User, Phone, Bell, ChevronRight, Ship, Plane, Copy, Check } from 'lucide-react';
import { useAdminOrders, useAdminCreateOrder, useAdminUpdateOrder, useAdminDeleteOrder } from '../../hooks/useAdminOrders';
import { useCustomers } from '../../hooks/useCustomers';
import LoadingSpinner from '../../components/LoadingSpinner';
import NotifyStatusModal from '../../components/Admin/NotifyStatusModal';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

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

  // Search state for order list
  const [searchQuery, setSearchQuery] = useState('');

  // Copied tracking code state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Notification modal state
  const [notifyStatusOrder, setNotifyStatusOrder] = useState<{ id: string; orderNumber: string } | null>(null);

  // Copy tracking code to clipboard
  const handleCopyTrackingCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`คัดลอก ${code} แล้ว`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

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

  // Filter orders based on search query
  const filteredOrders = useMemo(() => {
    if (!ordersData?.data) return [];
    if (!searchQuery.trim()) return ordersData.data;

    const query = searchQuery.toLowerCase();
    return ordersData.data.filter((order) => {
      const orderNumber = (order.orderNumber || '').toLowerCase();
      if (orderNumber.includes(query)) return true;

      const companyName = (order.customer?.companyName || '').toLowerCase();
      const contactPerson = (order.customer?.contactPerson || '').toLowerCase();
      const phone = (order.customer?.phone || '').toLowerCase();
      if (companyName.includes(query) || contactPerson.includes(query) || phone.includes(query)) return true;

      if (order.items && Array.isArray(order.items)) {
        const hasMatchingItem = order.items.some((item: any) => {
          const productName = (item.productName || '').toLowerCase();
          const description = (item.description || '').toLowerCase();
          return productName.includes(query) || description.includes(query);
        });
        if (hasMatchingItem) return true;
      }

      return false;
    });
  }, [ordersData?.data, searchQuery]);

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

  const getSelectedCustomerName = () => {
    if (!formData.customerId || !customersData?.data) return null;
    const customer = customersData.data.find((c) => c.id === formData.customerId);
    if (!customer) return null;
    return customer.companyName || customer.contactPerson || customer.phone || 'ไม่มีชื่อ';
  };

  const generateOrderNumber = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;

    const todayOrders = ordersData?.data.filter((order) =>
      order.orderNumber.startsWith(datePrefix)
    ) || [];

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
        { id: editingOrder.id, data: orderData },
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
      shipped: 'กำลังจัดส่ง',
      delivered: 'ส่งถึงแล้ว',
      cancelled: 'ยกเลิก',
    };
    return texts[status] || status;
  };

  const getCountryFlag = (countryName: string) => {
    const country = COUNTRIES.find(c => c.name === countryName);
    return country?.nameLocal?.split(' ')[0] || '🌍';
  };

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold">จัดการออเดอร์</h1>
        <button
          onClick={() => {
            setEditingOrder(null);
            resetForm();
            const newOrderNumber = generateOrderNumber();
            setFormData((prev) => ({ ...prev, orderNumber: newOrderNumber }));
            setShowModal(true);
          }}
          className="bg-primary-600 text-white px-4 py-2.5 rounded-xl hover:bg-primary-700 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>เพิ่มออเดอร์</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหา Order, ชื่อลูกค้า, สินค้า..."
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-500 mt-2">
            พบ {filteredOrders.length} จาก {ordersData?.data.length || 0} รายการ
          </p>
        )}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.98] transition-transform"
              >
                {/* Card Header */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => navigate(`/admin/orders/${order.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                        {order.shippingMethod === 'sea' ? (
                          <Ship className="w-5 h-5 text-primary-600" />
                        ) : (
                          <Plane className="w-5 h-5 text-primary-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">
                          {order.shippingMethod === 'sea' ? 'ทางเรือ' : 'ทางอากาศ'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{order.customer?.companyName || order.customer?.contactPerson || 'ไม่ระบุลูกค้า'}</span>
                  </div>

                  {/* Route */}
                  <div className="flex items-center gap-2 text-sm">
                    <span>{getCountryFlag(order.origin)}</span>
                    <span className="text-gray-400">→</span>
                    <span>{getCountryFlag(order.destination)}</span>
                    <span className="text-gray-500 text-xs ml-1">
                      {order.origin || '-'} → {order.destination || '-'}
                    </span>
                  </div>

                  {/* Tracking Code */}
                  {order.trackingCode && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-2">Tracking Code</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyTrackingCode(order.trackingCode);
                        }}
                        className="inline-flex items-center gap-2 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg text-sm font-mono text-primary-700 active:scale-95 transition-all border border-primary-200"
                      >
                        {order.trackingCode}
                        {copiedCode === order.trackingCode ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-primary-400" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex border-t border-gray-100 divide-x divide-gray-100">
                  <button
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">ดู</span>
                  </button>
                  <button
                    onClick={() => handleEdit(order)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-sm">แก้ไข</span>
                  </button>
                  <button
                    onClick={() => setNotifyStatusOrder({ id: order.id, orderNumber: order.orderNumber })}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-purple-600 hover:bg-purple-50 active:bg-purple-100 transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    <span className="text-sm">แจ้ง</span>
                  </button>
                  <button
                    onClick={() => handleDelete(order.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm">ลบ</span>
                  </button>
                </div>
              </motion.div>
            ))}

            {filteredOrders.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                {searchQuery ? (
                  <div>
                    <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>ไม่พบออเดอร์ที่ตรงกับ "{searchQuery}"</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-2 text-primary-600 hover:text-primary-700"
                    >
                      ล้างการค้นหา
                    </button>
                  </div>
                ) : (
                  <div>
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>ยังไม่มีออเดอร์</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
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
                    Tracking
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
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
                        {getCountryFlag(order.origin)} {order.origin || '-'} → {getCountryFlag(order.destination)} {order.destination || '-'}
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
                    <td className="px-6 py-4">
                      {order.trackingCode ? (
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-primary-50 px-2 py-1 rounded-lg font-mono text-primary-700 border border-primary-200">
                            {order.trackingCode}
                          </code>
                          <button
                            onClick={() => handleCopyTrackingCode(order.trackingCode)}
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                            title="คัดลอก"
                          >
                            {copiedCode === order.trackingCode ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                          className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                          title="ดูรายละเอียด"
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
                          title="แจ้งเตือน LINE"
                        >
                          <Bell className="w-4 h-4" />
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

            {filteredOrders.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                {searchQuery ? (
                  <div>
                    <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>ไม่พบออเดอร์ที่ตรงกับ "{searchQuery}"</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-2 text-primary-600 hover:text-primary-700"
                    >
                      ล้างการค้นหา
                    </button>
                  </div>
                ) : (
                  'No orders found. Create your first order!'
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Add/Edit Modal - Full screen on mobile */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full md:rounded-xl md:max-w-2xl md:max-h-[90vh] max-h-[95vh] overflow-hidden flex flex-col rounded-t-3xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                <h2 className="text-lg font-bold">{editingOrder ? 'แก้ไขออเดอร์' : 'เพิ่มออเดอร์ใหม่'}</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingOrder(null);
                    resetForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Order Number *</label>
                      <input
                        type="text"
                        value={formData.orderNumber}
                        onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="ORD-2024-001"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ลูกค้า</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerSearchQuery('');
                            setShowCustomerSearch(true);
                          }}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 flex items-center gap-2"
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
                            className="px-3 py-3 border border-gray-300 rounded-xl hover:bg-red-50 hover:border-red-300 text-gray-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">วิธีการขนส่ง *</label>
                      <select
                        value={formData.shippingMethod}
                        onChange={(e) => setFormData({ ...formData, shippingMethod: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      >
                        <option value="sea">🚢 ทางเรือ (Sea)</option>
                        <option value="air">✈️ ทางอากาศ (Air)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ *</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                        required
                      >
                        <option value="pending">รอดำเนินการ</option>
                        <option value="processing">กำลังดำเนินการ</option>
                        <option value="shipped">กำลังจัดส่ง</option>
                        <option value="delivered">ส่งถึงแล้ว</option>
                        <option value="cancelled">ยกเลิก</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ต้นทาง</label>
                      <select
                        value={formData.origin}
                        onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">ปลายทาง</label>
                      <select
                        value={formData.destination}
                        onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">น้ำหนักรวม (kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.totalWeight}
                        onChange={(e) => setFormData({ ...formData, totalWeight: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="1000.50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ปริมาตรรวม (m³)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.totalVolume}
                        onChange={(e) => setFormData({ ...formData, totalVolume: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="50.25"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ราคาประเมิน</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.estimatedCost}
                        onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="50000.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ราคาจริง</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.actualCost}
                        onChange={(e) => setFormData({ ...formData, actualCost: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="48000.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">วันส่งถึงโดยประมาณ</label>
                      <input
                        type="date"
                        value={formData.estimatedDelivery}
                        onChange={(e) => setFormData({ ...formData, estimatedDelivery: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="รายละเอียดเพิ่มเติม..."
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingOrder(null);
                        resetForm();
                      }}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={createOrder.isPending || updateOrder.isPending}
                      className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 font-medium"
                    >
                      {createOrder.isPending || updateOrder.isPending
                        ? 'กำลังบันทึก...'
                        : editingOrder
                        ? 'อัพเดท'
                        : 'สร้าง'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customer Search Modal - Full screen on mobile */}
      <AnimatePresence>
        {showCustomerSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-[60]"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full md:max-w-lg max-h-[90vh] flex flex-col rounded-t-3xl md:rounded-xl shadow-xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="text-lg font-semibold">ค้นหาลูกค้า</h3>
                <button
                  onClick={() => setShowCustomerSearch(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600"
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
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  พบ {filteredCustomers.length} รายการ
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
                        className={`w-full p-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors ${
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
                              {customer.lineId && (
                                <span className="text-green-600">LINE: {customer.lineId}</span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-300" />
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
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300"
                >
                  ปิด
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Modal */}
      {notifyStatusOrder && (
        <NotifyStatusModal
          isOpen={!!notifyStatusOrder}
          onClose={() => setNotifyStatusOrder(null)}
          orderId={notifyStatusOrder.id}
          orderNumber={notifyStatusOrder.orderNumber}
        />
      )}
    </div>
  );
};

export default AdminOrdersPage;
