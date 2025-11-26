import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ship,
  Package,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Crown,
  Loader2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, staggerItem, buttonTap } from '../../lib/animations';
import api from '../../lib/api';

interface DashboardStats {
  stats: {
    totalOrders: { value: number; change: string; thisMonth: number };
    activeShipments: { value: number; processing: number; shipped: number };
    deliveredThisMonth: { value: number; change: string };
    totalCustomers: { value: number; change: string; vipCount: number };
    totalOrderItems: { value: number; thisMonth: number };
    pendingPayments: { value: number };
  };
  ordersByStatus: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customer: string;
    customerTier: string;
    status: string;
    itemCount: number;
    shippingMethod: string;
    createdAt: string;
  }>;
  generatedAt: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'รอดำเนินการ', color: 'bg-yellow-100 text-yellow-700' },
  processing: { label: 'กำลังดำเนินการ', color: 'bg-blue-100 text-blue-700' },
  shipped: { label: 'กำลังจัดส่ง', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'ส่งสำเร็จ', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'ยกเลิก', color: 'bg-red-100 text-red-700' },
};

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/statistics/dashboard');
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err.response?.data?.error?.message || 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const stats = data
    ? [
        {
          icon: ShoppingCart,
          label: 'คำสั่งซื้อทั้งหมด',
          value: data.stats.totalOrders.value.toLocaleString(),
          change: data.stats.totalOrders.change,
          subtext: `เดือนนี้ ${data.stats.totalOrders.thisMonth}`,
          color: 'blue',
          bgColor: 'bg-blue-100',
          iconColor: 'text-blue-600',
        },
        {
          icon: Truck,
          label: 'กำลังจัดส่ง',
          value: data.stats.activeShipments.value.toLocaleString(),
          change: null,
          subtext: `Processing: ${data.stats.activeShipments.processing} | Shipped: ${data.stats.activeShipments.shipped}`,
          color: 'orange',
          bgColor: 'bg-orange-100',
          iconColor: 'text-orange-600',
        },
        {
          icon: CheckCircle2,
          label: 'ส่งสำเร็จเดือนนี้',
          value: data.stats.deliveredThisMonth.value.toLocaleString(),
          change: data.stats.deliveredThisMonth.change,
          subtext: null,
          color: 'green',
          bgColor: 'bg-green-100',
          iconColor: 'text-green-600',
        },
        {
          icon: Users,
          label: 'ลูกค้าทั้งหมด',
          value: data.stats.totalCustomers.value.toLocaleString(),
          change: data.stats.totalCustomers.change,
          subtext: `VIP: ${data.stats.totalCustomers.vipCount}`,
          color: 'purple',
          bgColor: 'bg-purple-100',
          iconColor: 'text-purple-600',
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="mt-4 text-gray-800 font-medium">เกิดข้อผิดพลาด</p>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchDashboard}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="p-8"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
    >
      {/* Header */}
      <motion.div
        className="mb-8 flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">ภาพรวมระบบ Tracking System</p>
        </div>
        <button
          onClick={fetchDashboard}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          รีเฟรช
        </button>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.change?.startsWith('+');
          return (
            <motion.div
              key={index}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
              variants={staggerItem}
              whileHover={{ scale: 1.03, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
                {stat.change && (
                  <span
                    className={`text-sm font-medium flex items-center gap-1 ${
                      isPositive ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {stat.change}
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-600">{stat.label}</p>
              {stat.subtext && <p className="text-xs text-gray-400 mt-1">{stat.subtext}</p>}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Additional Stats Row */}
      {data && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Order Items */}
          <motion.div
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
            variants={staggerItem}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">รายการสินค้าทั้งหมด</p>
                <p className="text-xl font-bold text-gray-900">
                  {data.stats.totalOrderItems.value.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400">เดือนนี้: {data.stats.totalOrderItems.thisMonth}</p>
          </motion.div>

          {/* Pending Payments */}
          <motion.div
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
            variants={staggerItem}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">งวดชำระรอดำเนินการ</p>
                <p className="text-xl font-bold text-gray-900">
                  {data.stats.pendingPayments.value.toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400">รอตรวจสอบการชำระเงิน</p>
          </motion.div>

          {/* Orders by Status */}
          <motion.div
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
            variants={staggerItem}
          >
            <p className="text-sm text-gray-600 mb-3">สถานะคำสั่งซื้อ</p>
            <div className="space-y-2">
              {Object.entries(data.ordersByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_LABELS[status]?.color}`}>
                    {STATUS_LABELS[status]?.label || status}
                  </span>
                  <span className="font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Recent Orders */}
        <motion.div
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          variants={staggerItem}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">คำสั่งซื้อล่าสุด</h2>
            <button
              onClick={() => navigate('/admin/orders')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              ดูทั้งหมด →
            </button>
          </div>
          <div className="space-y-3">
            {data?.recentOrders.length === 0 ? (
              <p className="text-center text-gray-500 py-8">ยังไม่มีคำสั่งซื้อ</p>
            ) : (
              data?.recentOrders.slice(0, 5).map((order, index) => (
                <motion.div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  onClick={() => navigate(`/admin/orders/${order.id}`)}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                      {order.customerTier !== 'regular' && (
                        <Crown
                          className={`w-4 h-4 ${
                            order.customerTier === 'premium' ? 'text-purple-500' : 'text-amber-500'
                          }`}
                        />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{order.customer}</p>
                    <p className="text-xs text-gray-400">{order.itemCount} รายการ</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        STATUS_LABELS[order.status]?.color || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {STATUS_LABELS[order.status]?.label || order.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(order.createdAt).toLocaleDateString('th-TH', {
                        day: '2-digit',
                        month: 'short',
                        year: '2-digit',
                      })}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          variants={staggerItem}
        >
          <h2 className="text-xl font-bold mb-4">การดำเนินการด่วน</h2>
          <div className="space-y-3">
            <motion.button
              onClick={() => navigate('/admin/orders')}
              className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={buttonTap}
            >
              <p className="font-semibold text-blue-700">จัดการคำสั่งซื้อ</p>
              <p className="text-sm text-blue-600">ดูและแก้ไขคำสั่งซื้อทั้งหมด</p>
            </motion.button>
            <motion.button
              onClick={() => navigate('/admin/customers')}
              className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={buttonTap}
            >
              <p className="font-semibold text-purple-700">จัดการลูกค้า</p>
              <p className="text-sm text-purple-600">ดูข้อมูลลูกค้าและ VIP</p>
            </motion.button>
            <motion.button
              onClick={() => navigate('/admin/reviews')}
              className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={buttonTap}
            >
              <p className="font-semibold text-green-700">รีวิวจากลูกค้า</p>
              <p className="text-sm text-green-600">อนุมัติและจัดการรีวิว</p>
            </motion.button>
            <motion.button
              onClick={() => navigate('/admin/settings')}
              className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={buttonTap}
            >
              <p className="font-semibold text-gray-700">ตั้งค่าระบบ</p>
              <p className="text-sm text-gray-600">ปรับแต่งการทำงานของระบบ</p>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Last Updated */}
      {data && (
        <div className="mt-6 text-center text-xs text-gray-400">
          อัปเดตล่าสุด: {new Date(data.generatedAt).toLocaleString('th-TH')}
        </div>
      )}
    </motion.div>
  );
};

export default AdminDashboardPage;
