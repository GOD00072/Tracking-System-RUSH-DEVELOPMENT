import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  Users,
  MessageCircle,
  Search,
  Crown,
  Star,
  Percent,
  Eye,
  Package,
  ShoppingCart,
  X,
  ChevronRight,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '../../hooks/useCustomers';
import LoadingSpinner from '../../components/LoadingSpinner';
import LineSearchModal from '../../components/LineSearchModal';
import api from '../../lib/api';
import { useTranslation } from 'react-i18next';

// Customer Tier Badge Component
const TIER_CONFIG = {
  regular: {
    label: 'ทั่วไป',
    labelEN: 'Regular',
    icon: Users,
    color: 'bg-gray-100 text-gray-700',
    borderColor: 'border-gray-200',
  },
  vip: {
    label: 'VIP',
    labelEN: 'VIP',
    icon: Star,
    color: 'bg-amber-100 text-amber-700',
    borderColor: 'border-amber-300',
  },
  premium: {
    label: 'Premium',
    labelEN: 'Premium',
    icon: Crown,
    color: 'bg-purple-100 text-purple-700',
    borderColor: 'border-purple-300',
  },
};

const CustomerTierBadge = ({ tier, discount }: { tier: string; discount?: number }) => {
  const config = TIER_CONFIG[tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.regular;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1">
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
      {discount && discount > 0 && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <Percent className="w-3 h-3 mr-0.5" />
          {discount}%
        </span>
      )}
    </div>
  );
};

const STATUS_BADGES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'รอดำเนินการ',
  processing: 'กำลังดำเนินการ',
  shipped: 'จัดส่งแล้ว',
  delivered: 'ส่งถึงแล้ว',
  cancelled: 'ยกเลิก',
};

const AdminCustomersPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [showLineSearchModal, setShowLineSearchModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerDetail, setCustomerDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    lineId: '',
    address: '',
    notes: '',
    userId: '',
    airtableId: '',
    tier: 'regular',
    discount: '',
    totalSpent: '',
  });

  const { data: customersData, isLoading } = useCustomers(1, 100);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  // Filter customers by search term
  const filteredCustomers = customersData?.data.filter((customer: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      customer.companyName?.toLowerCase().includes(term) ||
      customer.contactPerson?.toLowerCase().includes(term) ||
      customer.phone?.includes(term) ||
      customer.lineId?.toLowerCase().includes(term)
    );
  });

  const handleViewDetail = async (customer: any) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
    setLoadingDetail(true);

    try {
      const response = await api.get(`/customers/${customer.id}`);
      if (response.data.success) {
        setCustomerDetail(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching customer detail:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const customerData = {
      companyName: formData.companyName || undefined,
      contactPerson: formData.contactPerson || undefined,
      phone: formData.phone || undefined,
      lineId: formData.lineId || undefined,
      address: formData.address || undefined,
      notes: formData.notes || undefined,
      userId: formData.userId || undefined,
      airtableId: formData.airtableId || undefined,
      tier: formData.tier || 'regular',
      discount: formData.discount ? parseFloat(formData.discount) : undefined,
      totalSpent: formData.totalSpent ? parseFloat(formData.totalSpent) : undefined,
    };

    if (editingCustomer) {
      updateCustomer.mutate(
        { id: editingCustomer.id, data: customerData },
        {
          onSuccess: () => {
            setShowModal(false);
            setEditingCustomer(null);
            resetForm();
          },
        }
      );
    } else {
      createCustomer.mutate(customerData, {
        onSuccess: () => {
          setShowModal(false);
          resetForm();
        },
      });
    }
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      contactPerson: '',
      phone: '',
      lineId: '',
      address: '',
      notes: '',
      userId: '',
      airtableId: '',
      tier: 'regular',
      discount: '',
      totalSpent: '',
    });
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({
      companyName: customer.companyName || '',
      contactPerson: customer.contactPerson || '',
      phone: customer.phone || '',
      lineId: customer.lineId || '',
      address: customer.address || '',
      notes: customer.notes || '',
      userId: customer.userId || '',
      airtableId: customer.airtableId || '',
      tier: customer.tier || 'regular',
      discount: customer.discount?.toString() || '',
      totalSpent: customer.totalSpent?.toString() || '',
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('คุณต้องการลบลูกค้ารายนี้หรือไม่?')) {
      deleteCustomer.mutate(id);
    }
  };

  const handleSelectLineUser = (lineUser: any) => {
    setFormData({
      ...formData,
      lineId: lineUser.lineId,
      userId: lineUser.id,
      companyName: formData.companyName || lineUser.fullName || '',
      contactPerson: formData.contactPerson || lineUser.fullName || '',
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('customers.title')}</h1>
          <p className="text-gray-600 text-sm">จัดการข้อมูลลูกค้าและดูประวัติการสั่งซื้อ</p>
        </div>
        <button
          onClick={() => {
            setEditingCustomer(null);
            resetForm();
            setShowModal(true);
          }}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {t('customers.addCustomer')}
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาลูกค้า..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Stats Summary */}
      {customersData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">ลูกค้าทั้งหมด</p>
                <p className="text-xl font-bold">{customersData.data.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">VIP</p>
                <p className="text-xl font-bold">
                  {customersData.data.filter((c: any) => c.tier === 'vip').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Crown className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Premium</p>
                <p className="text-xl font-bold">
                  {customersData.data.filter((c: any) => c.tier === 'premium').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">มี LINE ID</p>
                <p className="text-xl font-bold">
                  {customersData.data.filter((c: any) => c.lineId).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customers Table */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ลูกค้า
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ติดต่อ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ประเภท
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    คำสั่งซื้อ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers?.map((customer: any) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                          {(customer.companyName || customer.contactPerson || '?')[0].toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.companyName || customer.contactPerson || 'ไม่มีชื่อ'}
                          </div>
                          {customer.companyName && customer.contactPerson && (
                            <div className="text-sm text-gray-500">{customer.contactPerson}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{customer.phone || '-'}</div>
                      {customer.lineId && (
                        <div className="flex items-center gap-1 text-sm text-green-600">
                          <MessageCircle className="w-3 h-3" />
                          {customer.lineId.substring(0, 10)}...
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <CustomerTierBadge tier={customer.tier || 'regular'} discount={customer.discount} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">{customer.orders?.length || 0}</span>
                        <span className="text-sm text-gray-500">orders</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetail(customer)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="ดูประวัติ"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(customer)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="แก้ไข"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="ลบ"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCustomers && filteredCustomers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {searchTerm ? 'ไม่พบลูกค้าที่ค้นหา' : 'ยังไม่มีลูกค้า'}
            </div>
          )}
        </div>
      )}

      {/* Customer Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold">
                  {(selectedCustomer?.companyName || selectedCustomer?.contactPerson || '?')[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {selectedCustomer?.companyName || selectedCustomer?.contactPerson || 'ลูกค้า'}
                  </h2>
                  <p className="text-primary-100 text-sm">ประวัติการสั่งซื้อ</p>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-white hover:bg-white/20 p-2 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : customerDetail ? (
                <>
                  {/* Customer Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-blue-600 mb-1">
                        <ShoppingCart className="w-4 h-4" />
                        <span className="text-sm">คำสั่งซื้อ</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-700">{customerDetail.stats?.totalOrders || 0}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-600 mb-1">
                        <Package className="w-4 h-4" />
                        <span className="text-sm">สินค้า</span>
                      </div>
                      <p className="text-2xl font-bold text-green-700">{customerDetail.stats?.totalItems || 0}</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-amber-600 mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm">ยอดรวม (฿)</span>
                      </div>
                      <p className="text-2xl font-bold text-amber-700">
                        ฿{Number(customerDetail.stats?.totalBaht || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-purple-600 mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm">ยอดรวม (¥)</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-700">
                        ¥{Number(customerDetail.stats?.totalYen || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold mb-3">ข้อมูลลูกค้า</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">ชื่อ/บริษัท</p>
                        <p className="font-medium">{customerDetail.companyName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">ผู้ติดต่อ</p>
                        <p className="font-medium">{customerDetail.contactPerson || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">เบอร์โทร</p>
                        <p className="font-medium">{customerDetail.phone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">LINE ID</p>
                        <p className="font-medium">{customerDetail.lineId || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">ประเภท</p>
                        <CustomerTierBadge tier={customerDetail.tier || 'regular'} discount={customerDetail.discount} />
                      </div>
                      <div>
                        <p className="text-gray-500">วันที่สร้าง</p>
                        <p className="font-medium">
                          {new Date(customerDetail.createdAt).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Orders List */}
                  <div>
                    <h3 className="font-semibold mb-3">ประวัติคำสั่งซื้อ ({customerDetail.orders?.length || 0})</h3>
                    {customerDetail.orders && customerDetail.orders.length > 0 ? (
                      <div className="space-y-3">
                        {customerDetail.orders.map((order: any) => (
                          <div
                            key={order.id}
                            className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => navigate(`/admin/orders/${order.id}`)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <Package className="w-5 h-5 text-gray-400" />
                                <span className="font-medium">{order.orderNumber}</span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    STATUS_BADGES[order.status] || 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {STATUS_LABELS[order.status] || order.status}
                                </span>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(order.createdAt).toLocaleDateString('th-TH')}
                              </span>
                              <span>
                                {order.shippingMethod === 'air' ? '✈️ เครื่องบิน' : '🚢 ทางเรือ'}
                              </span>
                              <span className="flex items-center gap-1">
                                <ShoppingCart className="w-4 h-4" />
                                {order._count?.orderItems || order.orderItems?.length || 0} รายการ
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                        ยังไม่มีประวัติการสั่งซื้อ
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">ไม่พบข้อมูลลูกค้า</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingCustomer ? t('customers.editCustomer') : t('customers.addCustomer')}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('customers.companyName')}</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="บริษัท ABC จำกัด"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('customers.contactPerson')}</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="คุณสมชาย"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('customers.phone')}</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="081-234-5678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                    {t('customers.lineId')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.lineId}
                      onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="U1234567890abcdef"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLineSearchModal(true)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1"
                      title="Search LINE Users"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('customers.address')}</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="123 ถนนสุขุมวิท แขวงคลองเตย..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('customers.notes')}</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="หมายเหตุเพิ่มเติม..."
                />
              </div>

              {/* VIP Tier Section */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <p className="text-sm font-medium text-gray-700">{t('customers.tier')}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">ประเภท</label>
                    <select
                      value={formData.tier}
                      onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="regular">{t('customers.regular')}</option>
                      <option value="vip">{t('customers.vip')}</option>
                      <option value="premium">{t('customers.premium')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{t('customers.discount')} (%)</label>
                    <input
                      type="number"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="5"
                      min="0"
                      max="100"
                      step="0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{t('customers.totalSpent')} (฿)</label>
                    <input
                      type="number"
                      value={formData.totalSpent}
                      onChange={(e) => setFormData({ ...formData, totalSpent: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCustomer(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createCustomer.isPending || updateCustomer.isPending}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {createCustomer.isPending || updateCustomer.isPending
                    ? 'กำลังบันทึก...'
                    : editingCustomer
                    ? t('common.save')
                    : t('common.add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LINE User Search Modal */}
      <LineSearchModal
        isOpen={showLineSearchModal}
        onClose={() => setShowLineSearchModal(false)}
        onSelectUser={handleSelectLineUser}
      />
    </div>
  );
};

export default AdminCustomersPage;
