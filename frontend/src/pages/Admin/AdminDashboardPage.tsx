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
  DollarSign,
  Calendar,
  CalendarDays,
  CalendarRange,
  Wallet,
  BadgeJapaneseYen,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
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

interface SalesChartData {
  chartData: Array<{ date: string; totalBaht: number; totalYen: number; count: number }>;
  totals: { totalBaht: number; totalYen: number; totalCount: number };
  period: string;
  groupFormat: string;
}

interface RevenueOverview {
  today: { baht: number; yen: number; count: number };
  thisWeek: { baht: number; yen: number; count: number };
  thisMonth: { baht: number; yen: number; count: number; growthPercent: number };
  thisYear: { baht: number; yen: number; count: number };
  allTime: { baht: number; yen: number; count: number };
  pending: { baht: number; yen: number; count: number };
}

interface PendingPaymentCustomer {
  customer: { id: string; name: string; tier: string };
  totalBaht: number;
  totalYen: number;
  payments: Array<{
    id: string;
    orderNumber: string;
    productName: string | null;
    amountBaht: number;
    paidAt: string | null;
  }>;
}

interface TierDistribution {
  distribution: Array<{
    tier: string;
    customerCount: number;
    totalSpent: number;
    revenue: number;
  }>;
  totals: { customers: number; totalSpent: number; revenue: number };
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'รอดำเนินการ', color: 'bg-yellow-100 text-yellow-700' },
  processing: { label: 'กำลังดำเนินการ', color: 'bg-blue-100 text-blue-700' },
  shipped: { label: 'กำลังจัดส่ง', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'ส่งสำเร็จ', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'ยกเลิก', color: 'bg-red-100 text-red-700' },
};

const TIER_COLORS: Record<string, string> = {
  member: '#6366f1',
  vip: '#f59e0b',
  vvip: '#8b5cf6',
};

const TIER_LABELS: Record<string, string> = {
  member: 'Member',
  vip: 'VIP',
  vvip: 'VVIP',
};

const formatCurrency = (amount: number, currency: 'baht' | 'yen' = 'baht') => {
  if (currency === 'yen') {
    return `¥${amount.toLocaleString()}`;
  }
  return `฿${amount.toLocaleString()}`;
};

const formatShortDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
};

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [salesChart, setSalesChart] = useState<SalesChartData | null>(null);
  const [revenueOverview, setRevenueOverview] = useState<RevenueOverview | null>(null);
  const [pendingPayments, setPendingPayments] = useState<{
    byCustomer: PendingPaymentCustomer[];
    totals: { totalBaht: number; totalYen: number; count: number; customerCount: number };
  } | null>(null);
  const [tierDistribution, setTierDistribution] = useState<TierDistribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashboardRes, salesRes, revenueRes, pendingRes, tierRes] = await Promise.all([
        api.get('/statistics/dashboard'),
        api.get(`/statistics/sales-chart?period=${chartPeriod}`),
        api.get('/statistics/revenue-overview'),
        api.get('/statistics/pending-payments-detail'),
        api.get('/statistics/tier-distribution'),
      ]);

      if (dashboardRes.data.success) setData(dashboardRes.data.data);
      if (salesRes.data.success) setSalesChart(salesRes.data.data);
      if (revenueRes.data.success) setRevenueOverview(revenueRes.data.data);
      if (pendingRes.data.success) setPendingPayments(pendingRes.data.data);
      if (tierRes.data.success) setTierDistribution(tierRes.data.data);
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err.response?.data?.error?.message || 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesChart = async (period: string) => {
    try {
      const res = await api.get(`/statistics/sales-chart?period=${period}`);
      if (res.data.success) setSalesChart(res.data.data);
    } catch (err) {
      console.error('Sales chart fetch error:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchSalesChart(chartPeriod);
    }
  }, [chartPeriod]);

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
            onClick={fetchAllData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  const pieChartData = tierDistribution?.distribution.map((item) => ({
    name: TIER_LABELS[item.tier] || item.tier,
    value: item.customerCount,
    tier: item.tier,
  })) || [];

  return (
    <motion.div
      className="p-8 bg-gray-50 min-h-screen"
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
          onClick={fetchAllData}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors border border-gray-200"
        >
          <RefreshCw className="w-4 h-4" />
          รีเฟรช
        </button>
      </motion.div>

      {/* Revenue Overview Cards */}
      {revenueOverview && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {/* Today */}
          <motion.div
            className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20"
            variants={staggerItem}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-emerald-100 text-sm font-medium">วันนี้</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(revenueOverview.today.baht)}</p>
            <p className="text-emerald-200 text-sm mt-1">{revenueOverview.today.count} รายการ</p>
          </motion.div>

          {/* This Week */}
          <motion.div
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20"
            variants={staggerItem}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <CalendarDays className="w-5 h-5" />
              </div>
              <span className="text-blue-100 text-sm font-medium">สัปดาห์นี้</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(revenueOverview.thisWeek.baht)}</p>
            <p className="text-blue-200 text-sm mt-1">{revenueOverview.thisWeek.count} รายการ</p>
          </motion.div>

          {/* This Month */}
          <motion.div
            className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl p-5 text-white shadow-lg shadow-violet-500/20"
            variants={staggerItem}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <CalendarRange className="w-5 h-5" />
              </div>
              <span className="text-violet-100 text-sm font-medium">เดือนนี้</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(revenueOverview.thisMonth.baht)}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-violet-200 text-sm">{revenueOverview.thisMonth.count} รายการ</span>
              {revenueOverview.thisMonth.growthPercent !== 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  revenueOverview.thisMonth.growthPercent > 0
                    ? 'bg-green-400/30 text-green-100'
                    : 'bg-red-400/30 text-red-100'
                }`}>
                  {revenueOverview.thisMonth.growthPercent > 0 ? '+' : ''}
                  {revenueOverview.thisMonth.growthPercent}%
                </span>
              )}
            </div>
          </motion.div>

          {/* This Year */}
          <motion.div
            className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-500/20"
            variants={staggerItem}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-indigo-100 text-sm font-medium">ปีนี้</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(revenueOverview.thisYear.baht)}</p>
            <p className="text-indigo-200 text-sm mt-1">{revenueOverview.thisYear.count} รายการ</p>
          </motion.div>

          {/* All Time */}
          <motion.div
            className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl p-5 text-white shadow-lg shadow-slate-600/20"
            variants={staggerItem}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-slate-300 text-sm font-medium">รวมทั้งหมด</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(revenueOverview.allTime.baht)}</p>
            <p className="text-slate-400 text-sm mt-1">{revenueOverview.allTime.count} รายการ</p>
          </motion.div>

          {/* Pending */}
          <motion.div
            className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/20"
            variants={staggerItem}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-amber-100 text-sm font-medium">รอยืนยัน</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(revenueOverview.pending.baht)}</p>
            <p className="text-amber-200 text-sm mt-1">{revenueOverview.pending.count} รายการ</p>
          </motion.div>
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Sales Chart - Takes 2 columns */}
        <motion.div
          className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          variants={staggerItem}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">กราฟยอดขาย</h2>
              <p className="text-sm text-gray-500 mt-1">
                รายได้รวม: {formatCurrency(salesChart?.totals.totalBaht || 0)}
              </p>
            </div>
            <div className="flex gap-2">
              {(['7d', '30d', '90d', '1y'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setChartPeriod(period)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                    chartPeriod === period
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {period === '7d' && '7 วัน'}
                  {period === '30d' && '30 วัน'}
                  {period === '90d' && '90 วัน'}
                  {period === '1y' && '1 ปี'}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChart?.chartData || []}>
                <defs>
                  <linearGradient id="colorBaht" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatShortDate}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}k`}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
                          <p className="text-sm text-gray-600 mb-1">{formatShortDate(label)}</p>
                          <p className="text-lg font-bold text-blue-600">
                            {formatCurrency(payload[0].value as number)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {(payload[0].payload as any).count} รายการ
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="totalBaht"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorBaht)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Tier Distribution */}
        <motion.div
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          variants={staggerItem}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">สัดส่วนลูกค้า</h2>
            <button
              onClick={() => navigate('/admin/tier-settings')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              ตั้งค่า <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={TIER_COLORS[entry.tier] || '#gray'} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-2 rounded-lg shadow-lg border border-gray-100">
                          <p className="text-sm font-medium">{payload[0].name}</p>
                          <p className="text-lg font-bold">{payload[0].value} คน</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {tierDistribution?.distribution.map((item) => (
              <div key={item.tier} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: TIER_COLORS[item.tier] || '#gray' }}
                  />
                  <span className="text-sm text-gray-600">{TIER_LABELS[item.tier] || item.tier}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">{item.customerCount} คน</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {formatCurrency(item.totalSpent)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {/* Pending Payments Detail */}
        <motion.div
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          variants={staggerItem}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">รอยืนยันชำระเงิน</h2>
              <p className="text-sm text-gray-500">
                {pendingPayments?.totals.count || 0} รายการ รวม {formatCurrency(pendingPayments?.totals.totalBaht || 0)}
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/orders')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              ดูทั้งหมด <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {pendingPayments?.byCustomer.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-400" />
                <p>ไม่มีรายการรอยืนยัน</p>
              </div>
            ) : (
              pendingPayments?.byCustomer.slice(0, 5).map((item) => (
                <motion.div
                  key={item.customer.id}
                  className="p-4 bg-amber-50 rounded-xl border border-amber-100"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{item.customer.name}</span>
                      {item.customer.tier !== 'member' && (
                        <Crown
                          className={`w-4 h-4 ${
                            item.customer.tier === 'vvip' ? 'text-purple-500' : 'text-amber-500'
                          }`}
                        />
                      )}
                    </div>
                    <span className="font-bold text-amber-600">
                      {formatCurrency(item.totalBaht)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{item.payments.length} รายการรอยืนยัน</p>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Order Items by Status */}
        {data && (
          <motion.div
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            variants={staggerItem}
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">สถานะคำสั่งซื้อ</h2>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(data.ordersByStatus).map(([status, count]) => ({
                    name: STATUS_LABELS[status]?.label || status,
                    count,
                    status,
                  }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: '#374151', fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-2 rounded-lg shadow-lg border border-gray-100">
                            <p className="text-sm font-medium">{payload[0].payload.name}</p>
                            <p className="text-lg font-bold">{payload[0].value} รายการ</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="count"
                    radius={[0, 4, 4, 0]}
                    fill="#3b82f6"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Quick Stats */}
        <motion.div
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          variants={staggerItem}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">สถิติภาพรวม</h2>
          <div className="space-y-4">
            {data && (
              <>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">คำสั่งซื้อทั้งหมด</p>
                      <p className="text-lg font-bold text-gray-900">
                        {data.stats.totalOrders.value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      data.stats.totalOrders.change.startsWith('+')
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {data.stats.totalOrders.change}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">ลูกค้าทั้งหมด</p>
                      <p className="text-lg font-bold text-gray-900">
                        {data.stats.totalCustomers.value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-purple-600">
                    VIP: {data.stats.totalCustomers.vipCount}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">ส่งสำเร็จเดือนนี้</p>
                      <p className="text-lg font-bold text-gray-900">
                        {data.stats.deliveredThisMonth.value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      data.stats.deliveredThisMonth.change.startsWith('+')
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {data.stats.deliveredThisMonth.change}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">รายการสินค้าทั้งหมด</p>
                      <p className="text-lg font-bold text-gray-900">
                        {data.stats.totalOrderItems.value.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-cyan-600">
                    เดือนนี้: {data.stats.totalOrderItems.thisMonth}
                  </span>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <motion.div
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          variants={staggerItem}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">คำสั่งซื้อล่าสุด</h2>
            <button
              onClick={() => navigate('/admin/orders')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              ดูทั้งหมด <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {data?.recentOrders.length === 0 ? (
              <p className="text-center text-gray-500 py-8">ยังไม่มีคำสั่งซื้อ</p>
            ) : (
              data?.recentOrders.slice(0, 5).map((order, index) => (
                <motion.div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  onClick={() => navigate(`/admin/orders/${order.id}`)}
                  whileHover={{ x: 4 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Ship className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{order.orderNumber}</p>
                        {order.customerTier !== 'member' && order.customerTier !== 'regular' && (
                          <Crown
                            className={`w-4 h-4 ${
                              order.customerTier === 'vvip' ? 'text-purple-500' : 'text-amber-500'
                            }`}
                          />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{order.customer}</p>
                    </div>
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
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          variants={staggerItem}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">การดำเนินการด่วน</h2>
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              onClick={() => navigate('/admin/orders')}
              className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl transition-colors text-left"
              whileHover={{ scale: 1.02 }}
              whileTap={buttonTap}
            >
              <ShoppingCart className="w-8 h-8 text-blue-600 mb-2" />
              <p className="font-semibold text-blue-700">จัดการคำสั่งซื้อ</p>
              <p className="text-xs text-blue-600 mt-1">ดูและแก้ไขทั้งหมด</p>
            </motion.button>

            <motion.button
              onClick={() => navigate('/admin/customers')}
              className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl transition-colors text-left"
              whileHover={{ scale: 1.02 }}
              whileTap={buttonTap}
            >
              <Users className="w-8 h-8 text-purple-600 mb-2" />
              <p className="font-semibold text-purple-700">จัดการลูกค้า</p>
              <p className="text-xs text-purple-600 mt-1">ข้อมูลและ VIP</p>
            </motion.button>

            <motion.button
              onClick={() => navigate('/admin/tier-settings')}
              className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 rounded-xl transition-colors text-left"
              whileHover={{ scale: 1.02 }}
              whileTap={buttonTap}
            >
              <Crown className="w-8 h-8 text-amber-600 mb-2" />
              <p className="font-semibold text-amber-700">ตั้งค่า Tier</p>
              <p className="text-xs text-amber-600 mt-1">ระดับสมาชิก</p>
            </motion.button>

            <motion.button
              onClick={() => navigate('/admin/statistics')}
              className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 rounded-xl transition-colors text-left"
              whileHover={{ scale: 1.02 }}
              whileTap={buttonTap}
            >
              <TrendingUp className="w-8 h-8 text-emerald-600 mb-2" />
              <p className="font-semibold text-emerald-700">สถิติเพิ่มเติม</p>
              <p className="text-xs text-emerald-600 mt-1">รายงานละเอียด</p>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Last Updated */}
      {data && (
        <motion.div
          className="mt-6 text-center text-xs text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          อัปเดตล่าสุด: {new Date(data.generatedAt).toLocaleString('th-TH')}
        </motion.div>
      )}
    </motion.div>
  );
};

export default AdminDashboardPage;
