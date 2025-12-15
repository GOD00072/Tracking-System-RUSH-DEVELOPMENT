import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Package, Search, X, User, Phone, Bell, ChevronRight, Ship, Plane, Copy, Check, Filter, Calendar, ChevronLeft, ChevronsLeft, ChevronsRight, ShoppingBag, FileText, ExternalLink } from 'lucide-react';
import { useAdminOrders, useAdminCreateOrder, useAdminUpdateOrder, useAdminDeleteOrder } from '../../hooks/useAdminOrders';
import { useOrderItemsList, useUpdateOrderItem } from '../../hooks/useOrderItems';
import { useCustomers } from '../../hooks/useCustomers';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import NotifyStatusModal from '../../components/Admin/NotifyStatusModal';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// Status step options for filtering items
const STATUS_STEP_OPTIONS = [
  { value: 0, label: 'ทุกสถานะ' },
  { value: 1, label: '1. รับออเดอร์' },
  { value: 2, label: '2. ชำระเงินงวดแรก' },
  { value: 3, label: '3. สั่งซื้อจากญี่ปุ่น' },
  { value: 4, label: '4. ของถึงโกดังญี่ปุ่น' },
  { value: 5, label: '5. จัดรอบส่งกลับ' },
  { value: 6, label: '6. ส่งออกจากญี่ปุ่น' },
  { value: 7, label: '7. ของถึงไทย' },
  { value: 8, label: '8. กำลังจัดส่ง' },
  { value: 9, label: '9. ส่งมอบสำเร็จ' },
];

const getStatusStepBadge = (step: number) => {
  const badges: Record<number, string> = {
    1: 'bg-gray-100 text-gray-700',
    2: 'bg-yellow-100 text-yellow-700',
    3: 'bg-blue-100 text-blue-700',
    4: 'bg-indigo-100 text-indigo-700',
    5: 'bg-purple-100 text-purple-700',
    6: 'bg-pink-100 text-pink-700',
    7: 'bg-orange-100 text-orange-700',
    8: 'bg-cyan-100 text-cyan-700',
    9: 'bg-green-100 text-green-700',
  };
  return badges[step] || 'bg-gray-100 text-gray-700';
};

const getStatusStepText = (step: number) => {
  const texts: Record<number, string> = {
    1: 'รับออเดอร์',
    2: 'ชำระเงินงวดแรก',
    3: 'สั่งซื้อจากญี่ปุ่น',
    4: 'ของถึงโกดังญี่ปุ่น',
    5: 'จัดรอบส่งกลับ',
    6: 'ส่งออกจากญี่ปุ่น',
    7: 'ของถึงไทย',
    8: 'กำลังจัดส่ง',
    9: 'ส่งมอบสำเร็จ',
  };
  return texts[step] || `สถานะ ${step}`;
};

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

// Status options for filtering
const STATUS_OPTIONS = [
  { value: '', label: 'ทุกสถานะ' },
  { value: 'pending', label: 'รอดำเนินการ' },
  { value: 'processing', label: 'กำลังดำเนินการ' },
  { value: 'shipped', label: 'กำลังจัดส่ง' },
  { value: 'delivered', label: 'ส่งถึงแล้ว' },
  { value: 'cancelled', label: 'ยกเลิก' },
];

const ITEMS_PER_PAGE = 50;

const AdminOrdersPage = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [editingOrder, setEditingOrder] = useState<any>(null);

  // Tab state: 'orders' | 'products'
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states for Orders tab
  const [searchQuery, setSearchQuery] = useState('');
  const [trackingQuery, setTrackingQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [shippingMethodFilter, setShippingMethodFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter states for Products tab
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsSearchQuery, setItemsSearchQuery] = useState('');
  const [itemsStatusStep, setItemsStatusStep] = useState(0);
  const [itemsCustomerId, setItemsCustomerId] = useState('');
  const [itemsShippingMethod, setItemsShippingMethod] = useState('');

  // Copied tracking code state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Notification modal state
  const [notifyStatusOrder, setNotifyStatusOrder] = useState<{ id: string; orderNumber: string } | null>(null);

  // Item status update modal state
  const [statusUpdateModal, setStatusUpdateModal] = useState<{
    isOpen: boolean;
    item: any | null;
    newStatus: number;
  }>({ isOpen: false, item: null, newStatus: 1 });

  // Price edit modal state
  const [priceEditModal, setPriceEditModal] = useState<{
    isOpen: boolean;
    item: any | null;
    priceYen: string;
    priceBaht: string;
    customerTier: string;
  }>({ isOpen: false, item: null, priceYen: '', priceBaht: '', customerTier: 'member' });

  // Fetch tiers for exchange rates
  const { data: tiersData } = useQuery({
    queryKey: ['tiers'],
    queryFn: async () => {
      const res = await api.get('/tiers');
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Get exchange rate based on customer tier
  const getExchangeRate = (tierCode: string) => {
    if (!tiersData) return 0.26; // default
    const tier = tiersData.find((t: any) => t.tierCode === tierCode);
    return tier ? parseFloat(tier.exchangeRate) : 0.26;
  };

  // Get tier display name
  const getTierName = (tierCode: string) => {
    if (!tiersData) return tierCode;
    const tier = tiersData.find((t: any) => t.tierCode === tierCode);
    return tier ? tier.tierNameTh || tier.tierName : tierCode;
  };

  // Current exchange rate for modal
  const currentExchangeRate = getExchangeRate(priceEditModal.customerTier);

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

  // Fetch orders with filters
  const { data: ordersData, isLoading } = useAdminOrders({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    search: searchQuery || undefined,
    status: statusFilter || undefined,
    shippingMethod: shippingMethodFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    tracking: trackingQuery || undefined,
  });
  const { data: customersData } = useCustomers(1, 500);

  // Fetch all order items for Products tab
  const { data: itemsData, isLoading: isLoadingItems } = useOrderItemsList(
    itemsPage,
    ITEMS_PER_PAGE,
    {
      search: itemsSearchQuery || undefined,
      statusStep: itemsStatusStep || undefined,
      customerId: itemsCustomerId || undefined,
      shippingMethod: itemsShippingMethod || undefined,
    }
  );

  // Items pagination helpers
  const itemsTotalPages = itemsData?.pagination?.total_pages || 1;
  const itemsTotalItems = itemsData?.pagination?.total || 0;
  const allItems = itemsData?.data || [];

  // Update order item mutation
  const updateOrderItem = useUpdateOrderItem();

  // Open status update modal
  const openStatusUpdateModal = (item: any) => {
    setStatusUpdateModal({
      isOpen: true,
      item,
      newStatus: item.statusStep || 1,
    });
  };

  // Handle status step update confirmation
  const handleConfirmStatusUpdate = () => {
    if (!statusUpdateModal.item) return;

    updateOrderItem.mutate(
      { id: statusUpdateModal.item.id, data: { statusStep: statusUpdateModal.newStatus } },
      {
        onSuccess: () => {
          toast.success(`อัปเดตสถานะเป็น "${getStatusStepText(statusUpdateModal.newStatus)}" สำเร็จ`);
          setStatusUpdateModal({ isOpen: false, item: null, newStatus: 1 });
        },
      }
    );
  };

  // Open price edit modal
  const openPriceEditModal = (item: any) => {
    // Get customer tier from order -> customer
    const customerTier = item.order?.customer?.tier || 'member';
    const rate = getExchangeRate(customerTier);

    setPriceEditModal({
      isOpen: true,
      item,
      priceYen: item.priceYen?.toString() || '',
      priceBaht: item.priceBaht?.toString() || (item.priceYen ? (item.priceYen * rate).toFixed(0) : ''),
      customerTier,
    });
  };

  // Handle price update confirmation
  const handleConfirmPriceUpdate = () => {
    if (!priceEditModal.item) return;

    const priceYen = priceEditModal.priceYen ? parseFloat(priceEditModal.priceYen) : null;
    const priceBaht = priceEditModal.priceBaht ? parseFloat(priceEditModal.priceBaht) : null;

    updateOrderItem.mutate(
      { id: priceEditModal.item.id, data: { priceYen, priceBaht } },
      {
        onSuccess: () => {
          toast.success('อัปเดตราคาสำเร็จ');
          setPriceEditModal({ isOpen: false, item: null, priceYen: '', priceBaht: '', customerTier: 'member' });
        },
      }
    );
  };

  // Auto calculate THB from JPY using customer's tier rate
  const handlePriceYenChange = (value: string) => {
    setPriceEditModal(prev => ({
      ...prev,
      priceYen: value,
      priceBaht: value ? (parseFloat(value) * currentExchangeRate).toFixed(0) : '',
    }));
  };

  // Pagination helpers
  const totalPages = ordersData?.pagination?.total_pages || 1;
  const totalItems = ordersData?.pagination?.total || 0;

  // Reset to first page when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setTrackingQuery('');
    setStatusFilter('');
    setShippingMethodFilter('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  // Check if any filter is active
  const hasActiveFilters = searchQuery || trackingQuery || statusFilter || shippingMethodFilter || dateFrom || dateTo;
  const createOrder = useAdminCreateOrder();
  const updateOrder = useAdminUpdateOrder();
  const deleteOrder = useAdminDeleteOrder();

  // Get orders from server (already filtered)
  const orders = ordersData?.data || [];

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
        {activeTab === 'orders' && (
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
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'orders'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span>ออเดอร์</span>
          <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
            {totalItems}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'products'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span>สินค้า</span>
          <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
            {itemsTotalItems}
          </span>
        </button>
      </div>

      {/* Orders Tab Content */}
      {activeTab === 'orders' && (
        <>
      {/* Search and Filters */}
      <div className="mb-4 space-y-3">
        {/* Main Search Row */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* General Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleFilterChange();
              }}
              placeholder="ค้นหา Order, ชื่อลูกค้า..."
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  handleFilterChange();
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Tracking Search */}
          <div className="relative sm:w-48">
            <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={trackingQuery}
              onChange={(e) => {
                setTrackingQuery(e.target.value.toUpperCase());
                handleFilterChange();
              }}
              placeholder="Tracking Code"
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base font-mono"
            />
            {trackingQuery && (
              <button
                onClick={() => {
                  setTrackingQuery('');
                  handleFilterChange();
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 border rounded-xl flex items-center gap-2 transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-primary-50 border-primary-300 text-primary-700'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-5 h-5" />
            <span className="hidden sm:inline">ตัวกรอง</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
            )}
          </button>
        </div>

        {/* Expanded Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        handleFilterChange();
                      }}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Shipping Method Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">วิธีจัดส่ง</label>
                    <select
                      value={shippingMethodFilter}
                      onChange={(e) => {
                        setShippingMethodFilter(e.target.value);
                        handleFilterChange();
                      }}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    >
                      <option value="">ทั้งหมด</option>
                      <option value="sea">🚢 ทางเรือ</option>
                      <option value="air">✈️ ทางอากาศ</option>
                    </select>
                  </div>

                  {/* Date From */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">วันที่เริ่มต้น</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => {
                          setDateFrom(e.target.value);
                          handleFilterChange();
                        }}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  {/* Date To */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">วันที่สิ้นสุด</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => {
                          setDateTo(e.target.value);
                          handleFilterChange();
                        }}
                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      disabled={!hasActiveFilters}
                      className="w-full px-4 py-2.5 text-red-600 border border-red-200 rounded-xl hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ล้างตัวกรอง
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
          <div>
            แสดง {orders.length} จาก {totalItems} รายการ
            {hasActiveFilters && (
              <span className="ml-2 text-primary-600">(กำลังกรอง)</span>
            )}
          </div>
          {totalPages > 1 && (
            <div>หน้า {currentPage} / {totalPages}</div>
          )}
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {orders.map((order) => (
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

            {orders.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                {hasActiveFilters ? (
                  <div>
                    <Filter className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>ไม่พบออเดอร์ที่ตรงตามเงื่อนไข</p>
                    <button
                      onClick={clearFilters}
                      className="mt-2 text-primary-600 hover:text-primary-700"
                    >
                      ล้างตัวกรอง
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

            {/* Mobile Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 pb-4">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronsLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-4 py-2 text-sm font-medium">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronsRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
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
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="w-5 h-5 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }) : '-'}
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

            {orders.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                {hasActiveFilters ? (
                  <div>
                    <Filter className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>ไม่พบออเดอร์ที่ตรงตามเงื่อนไข</p>
                    <button
                      onClick={clearFilters}
                      className="mt-2 text-primary-600 hover:text-primary-700"
                    >
                      ล้างตัวกรอง
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

            {/* Desktop Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
                <div className="text-sm text-gray-500">
                  แสดง {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} จาก {totalItems} รายการ
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
                    title="หน้าแรก"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
                    title="หน้าก่อนหน้า"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === pageNum
                              ? 'bg-primary-600 text-white'
                              : 'border border-gray-300 hover:bg-white'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
                    title="หน้าถัดไป"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
                    title="หน้าสุดท้าย"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
        </>
      )}

      {/* Products Tab Content */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Search and Filter for Products */}
          <div className="flex flex-col gap-3">
            {/* First Row: Search and Customer Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={itemsSearchQuery}
                  onChange={(e) => {
                    setItemsSearchQuery(e.target.value);
                    setItemsPage(1);
                  }}
                  placeholder="ค้นหา รหัสสินค้า, Tracking, รหัสลูกค้า..."
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
                />
                {itemsSearchQuery && (
                  <button
                    onClick={() => {
                      setItemsSearchQuery('');
                      setItemsPage(1);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Customer Filter */}
              <select
                value={itemsCustomerId}
                onChange={(e) => {
                  setItemsCustomerId(e.target.value);
                  setItemsPage(1);
                }}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white sm:min-w-[220px]"
              >
                <option value="">ลูกค้าทั้งหมด</option>
                {customersData?.data?.map((customer: any) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.customerCode ? `[${customer.customerCode}] ` : ''}{customer.companyName || customer.contactPerson || 'ไม่มีชื่อ'}
                  </option>
                ))}
              </select>

              {/* Status Step Filter */}
              <select
                value={itemsStatusStep}
                onChange={(e) => {
                  setItemsStatusStep(parseInt(e.target.value));
                  setItemsPage(1);
                }}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white sm:min-w-[200px]"
              >
                {STATUS_STEP_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Shipping Method Filter */}
              <select
                value={itemsShippingMethod}
                onChange={(e) => {
                  setItemsShippingMethod(e.target.value);
                  setItemsPage(1);
                }}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">วิธีจัดส่งทั้งหมด</option>
                <option value="sea">🚢 ทางเรือ</option>
                <option value="air">✈️ ทางอากาศ</option>
              </select>
            </div>

            {/* Active Filters */}
            {(itemsSearchQuery || itemsCustomerId || itemsStatusStep > 0 || itemsShippingMethod) && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-500">กำลังกรอง:</span>
                {itemsSearchQuery && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs flex items-center gap-1">
                    🔍 "{itemsSearchQuery}"
                    <button onClick={() => { setItemsSearchQuery(''); setItemsPage(1); }} className="hover:text-green-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {itemsCustomerId && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1">
                    ลูกค้า: {customersData?.data?.find((c: any) => c.id === itemsCustomerId)?.customerCode || 'ไม่ระบุ'}
                    <button onClick={() => { setItemsCustomerId(''); setItemsPage(1); }} className="hover:text-blue-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {itemsStatusStep > 0 && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs flex items-center gap-1">
                    {getStatusStepText(itemsStatusStep)}
                    <button onClick={() => { setItemsStatusStep(0); setItemsPage(1); }} className="hover:text-purple-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {itemsShippingMethod && (
                  <span className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs flex items-center gap-1">
                    {itemsShippingMethod === 'sea' ? '🚢 ทางเรือ' : '✈️ ทางเครื่องบิน'}
                    <button onClick={() => { setItemsShippingMethod(''); setItemsPage(1); }} className="hover:text-cyan-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setItemsSearchQuery('');
                    setItemsCustomerId('');
                    setItemsStatusStep(0);
                    setItemsShippingMethod('');
                    setItemsPage(1);
                  }}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  ล้างทั้งหมด
                </button>
              </div>
            )}
          </div>

          {/* Results Summary */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
            <div>
              แสดง {allItems.length} จาก {itemsTotalItems} รายการ
              {(itemsSearchQuery || itemsStatusStep > 0 || itemsCustomerId || itemsShippingMethod) && (
                <span className="ml-2 text-primary-600">(กำลังกรอง)</span>
              )}
            </div>
            {itemsTotalPages > 1 && (
              <div>หน้า {itemsPage} / {itemsTotalPages}</div>
            )}
          </div>

          {/* Products List */}
          {isLoadingItems ? (
            <LoadingSpinner />
          ) : (
            <>
              {/* Mobile Card View for Products */}
              <div className="md:hidden space-y-3">
                {allItems.map((item: any) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">
                          {item.trackingCode || item.productCode || 'ไม่มีรหัส'}
                        </p>
                        {item.productName && (
                          <p className="text-xs text-gray-500 truncate">{item.productName}</p>
                        )}
                      </div>
                      {item.productImages && item.productImages[0] && (
                        <img
                          src={item.productImages[0]}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover ml-2"
                        />
                      )}
                    </div>

                    {/* Status Button - Opens Modal */}
                    <button
                      onClick={() => openStatusUpdateModal(item)}
                      className={`w-full mb-3 px-3 py-2 rounded-lg text-sm font-medium ${getStatusStepBadge(item.statusStep || 1)} hover:opacity-80 transition-opacity flex items-center justify-between`}
                    >
                      <span>{getStatusStepText(item.statusStep || 1)}</span>
                      <Edit className="w-4 h-4" />
                    </button>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">ลูกค้า:</span>
                        <button
                          onClick={() => {
                            if (item.order?.customer?.id) {
                              setItemsCustomerId(item.order.customer.id);
                              setItemsPage(1);
                            }
                          }}
                          className="text-gray-900 hover:text-primary-600 flex items-center gap-1"
                        >
                          {item.order?.customer?.customerCode && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              {item.order.customer.customerCode}
                            </span>
                          )}
                          <span>{item.customerName || item.order?.customer?.companyName || item.order?.customer?.contactPerson || '-'}</span>
                        </button>
                      </div>
                      {item.clickerName && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">คนกด:</span>
                          <span className="text-gray-900">{item.clickerName}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Order:</span>
                        <button
                          onClick={() => navigate(`/admin/orders/${item.orderId}`)}
                          className="text-primary-600 hover:underline flex items-center gap-1"
                        >
                          {item.order?.orderNumber || '-'}
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                      {item.priceYen && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">ราคา:</span>
                          <span className="text-gray-900">
                            ¥{item.priceYen?.toLocaleString()}
                            {item.priceBaht && ` (฿${Math.ceil(item.priceBaht).toLocaleString()})`}
                          </span>
                        </div>
                      )}
                      {item.trackingNumberJP && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Tracking JP:</span>
                          <span className="font-mono text-xs">{item.trackingNumberJP}</span>
                        </div>
                      )}
                      {item.trackingNumberTH && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Tracking TH:</span>
                          <span className="font-mono text-xs">{item.trackingNumberTH}</span>
                        </div>
                      )}
                    </div>

                    {item.productUrl && (
                      <a
                        href={item.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center justify-center gap-2 w-full py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        ดูสินค้า
                      </a>
                    )}
                  </motion.div>
                ))}

                {allItems.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>ไม่พบสินค้า</p>
                  </div>
                )}

                {/* Mobile Pagination for Products */}
                {itemsTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4 pb-4">
                    <button
                      onClick={() => setItemsPage(1)}
                      disabled={itemsPage === 1}
                      className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronsLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setItemsPage(itemsPage - 1)}
                      disabled={itemsPage === 1}
                      className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="px-4 py-2 text-sm font-medium">
                      {itemsPage} / {itemsTotalPages}
                    </span>
                    <button
                      onClick={() => setItemsPage(itemsPage + 1)}
                      disabled={itemsPage === itemsTotalPages}
                      className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setItemsPage(itemsTotalPages)}
                      disabled={itemsPage === itemsTotalPages}
                      className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronsRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Desktop Table View for Products */}
              <div className="hidden md:block bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        รูป
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        รหัส/Tracking
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ลูกค้า/คนกด
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Route
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        วิธีจัดส่ง
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ราคา
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">
                        สถานะ
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tracking JP/TH
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allItems.map((item: any) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {item.productImages && item.productImages[0] ? (
                            <img
                              src={item.productImages[0]}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <ShoppingBag className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {item.trackingCode || item.productCode || '-'}
                          </div>
                          {item.productName && (
                            <div className="text-xs text-gray-500 truncate max-w-[150px]">
                              {item.productName}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              if (item.order?.customer?.id) {
                                setItemsCustomerId(item.order.customer.id);
                                setItemsPage(1);
                              }
                            }}
                            className="text-left hover:text-primary-600"
                          >
                            {item.order?.customer?.customerCode && (
                              <span className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium mr-1">
                                {item.order.customer.customerCode}
                              </span>
                            )}
                            <span className="text-sm text-gray-900">
                              {item.customerName || item.order?.customer?.companyName || item.order?.customer?.contactPerson || '-'}
                            </span>
                          </button>
                          {item.clickerName && (
                            <div className="text-xs text-purple-600">
                              คนกด: {item.clickerName}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => navigate(`/admin/orders/${item.orderId}`)}
                            className="text-sm text-primary-600 hover:underline flex items-center gap-1"
                          >
                            {item.order?.orderNumber || '-'}
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {getCountryFlag(item.order?.origin)} {item.order?.origin || '-'} → {getCountryFlag(item.order?.destination)} {item.order?.destination || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {item.order?.shippingMethod === 'sea' ? '🚢 เรือ' : '✈️ อากาศ'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => openPriceEditModal(item)}
                            className="text-left hover:bg-green-50 px-2 py-1 rounded-lg transition-colors group"
                          >
                            <div className="text-sm text-gray-900 group-hover:text-green-700">
                              {item.priceYen ? `¥${item.priceYen.toLocaleString()}` : '-'}
                              <Edit className="w-3 h-3 inline ml-1 opacity-0 group-hover:opacity-100" />
                            </div>
                            {item.priceBaht && (
                              <div className="text-xs text-gray-500">
                                ฿{Math.ceil(item.priceBaht).toLocaleString()}
                              </div>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => openStatusUpdateModal(item)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${getStatusStepBadge(item.statusStep || 1)} hover:opacity-80 transition-opacity flex items-center gap-2`}
                          >
                            {getStatusStepText(item.statusStep || 1)}
                            <Edit className="w-3 h-3" />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs space-y-1">
                            {item.trackingNumberJP && (
                              <div className="font-mono">JP: {item.trackingNumberJP}</div>
                            )}
                            {item.trackingNumberTH && (
                              <div className="font-mono">TH: {item.trackingNumberTH}</div>
                            )}
                            {!item.trackingNumberJP && !item.trackingNumberTH && (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => navigate(`/admin/orders/${item.orderId}`)}
                              className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                              title="ดู Order"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {item.productUrl && (
                              <a
                                href={item.productUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                                title="ดูสินค้า"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {allItems.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>ไม่พบสินค้า</p>
                  </div>
                )}

                {/* Desktop Pagination for Products */}
                {itemsTotalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
                    <div className="text-sm text-gray-500">
                      แสดง {(itemsPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(itemsPage * ITEMS_PER_PAGE, itemsTotalItems)} จาก {itemsTotalItems} รายการ
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setItemsPage(1)}
                        disabled={itemsPage === 1}
                        className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
                        title="หน้าแรก"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setItemsPage(itemsPage - 1)}
                        disabled={itemsPage === 1}
                        className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
                        title="หน้าก่อนหน้า"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, itemsTotalPages) }, (_, i) => {
                          let pageNum;
                          if (itemsTotalPages <= 5) {
                            pageNum = i + 1;
                          } else if (itemsPage <= 3) {
                            pageNum = i + 1;
                          } else if (itemsPage >= itemsTotalPages - 2) {
                            pageNum = itemsTotalPages - 4 + i;
                          } else {
                            pageNum = itemsPage - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setItemsPage(pageNum)}
                              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                itemsPage === pageNum
                                  ? 'bg-primary-600 text-white'
                                  : 'border border-gray-300 hover:bg-white'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setItemsPage(itemsPage + 1)}
                        disabled={itemsPage === itemsTotalPages}
                        className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
                        title="หน้าถัดไป"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setItemsPage(itemsTotalPages)}
                        disabled={itemsPage === itemsTotalPages}
                        className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
                        title="หน้าสุดท้าย"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
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

      {/* Item Status Update Modal */}
      <AnimatePresence>
        {statusUpdateModal.isOpen && statusUpdateModal.item && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setStatusUpdateModal({ isOpen: false, item: null, newStatus: 1 })}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">อัปเดตสถานะ</h3>
                    <p className="text-primary-100 text-sm">
                      {statusUpdateModal.item.trackingCode || statusUpdateModal.item.productCode || 'สินค้า'}
                    </p>
                  </div>
                  <button
                    onClick={() => setStatusUpdateModal({ isOpen: false, item: null, newStatus: 1 })}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Item Info */}
              <div className="px-6 py-4 bg-gray-50 border-b">
                <div className="flex items-center gap-3">
                  {statusUpdateModal.item.productImages?.[0] ? (
                    <img
                      src={statusUpdateModal.item.productImages[0]}
                      alt=""
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gray-200 flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {statusUpdateModal.item.productName && (
                      <p className="font-medium text-gray-900 truncate">
                        {statusUpdateModal.item.productName}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      ลูกค้า: {statusUpdateModal.item.customerName || statusUpdateModal.item.order?.customer?.companyName || '-'}
                    </p>
                    {statusUpdateModal.item.clickerName && (
                      <p className="text-sm text-purple-600">
                        คนกด: {statusUpdateModal.item.clickerName}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Selection */}
              <div className="px-6 py-4 max-h-[300px] overflow-y-auto">
                <p className="text-sm font-medium text-gray-700 mb-3">เลือกสถานะใหม่</p>
                <div className="space-y-2">
                  {STATUS_STEP_OPTIONS.filter(opt => opt.value > 0).map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setStatusUpdateModal(prev => ({ ...prev, newStatus: option.value }))}
                      className={`w-full px-4 py-3 rounded-xl text-left flex items-center justify-between transition-all ${
                        statusUpdateModal.newStatus === option.value
                          ? `${getStatusStepBadge(option.value)} ring-2 ring-primary-500 ring-offset-2`
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span className="font-medium">{option.label}</span>
                      {statusUpdateModal.newStatus === option.value && (
                        <Check className="w-5 h-5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t bg-gray-50 flex gap-3">
                <button
                  onClick={() => setStatusUpdateModal({ isOpen: false, item: null, newStatus: 1 })}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-100 font-medium transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleConfirmStatusUpdate}
                  disabled={updateOrderItem.isPending || statusUpdateModal.newStatus === (statusUpdateModal.item?.statusStep || 1)}
                  className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {updateOrderItem.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      ยืนยัน
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Price Edit Modal */}
      <AnimatePresence>
        {priceEditModal.isOpen && priceEditModal.item && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setPriceEditModal({ isOpen: false, item: null, priceYen: '', priceBaht: '', customerTier: 'member' })}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">แก้ไขราคา</h3>
                    <p className="text-green-100 text-sm">
                      {priceEditModal.item.trackingCode || priceEditModal.item.productCode || 'สินค้า'}
                    </p>
                  </div>
                  <button
                    onClick={() => setPriceEditModal({ isOpen: false, item: null, priceYen: '', priceBaht: '', customerTier: 'member' })}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Item Info */}
              <div className="px-6 py-4 bg-gray-50 border-b">
                <div className="flex items-center gap-3">
                  {priceEditModal.item.productImages?.[0] ? (
                    <img
                      src={priceEditModal.item.productImages[0]}
                      alt=""
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gray-200 flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {priceEditModal.item.productName && (
                      <p className="font-medium text-gray-900 truncate">
                        {priceEditModal.item.productName}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      {priceEditModal.item.order?.orderNumber || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Exchange Rate Info */}
              <div className="px-6 py-3 bg-blue-50 border-b">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-700">
                    ระดับ: <span className="font-bold">{getTierName(priceEditModal.customerTier)}</span>
                  </span>
                  <span className="font-bold text-blue-900">¥1 = ฿{currentExchangeRate}</span>
                </div>
              </div>

              {/* Price Inputs */}
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ราคา (เยน)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                    <input
                      type="number"
                      value={priceEditModal.priceYen}
                      onChange={(e) => handlePriceYenChange(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ราคา (บาท)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">฿</span>
                    <input
                      type="number"
                      value={priceEditModal.priceBaht}
                      onChange={(e) => setPriceEditModal(prev => ({ ...prev, priceBaht: e.target.value }))}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="0"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    คำนวณอัตโนมัติจากเยน หรือแก้ไขได้เอง
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t bg-gray-50 flex gap-3">
                <button
                  onClick={() => setPriceEditModal({ isOpen: false, item: null, priceYen: '', priceBaht: '', customerTier: 'member' })}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-100 font-medium transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleConfirmPriceUpdate}
                  disabled={updateOrderItem.isPending}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {updateOrderItem.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      บันทึก
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminOrdersPage;
