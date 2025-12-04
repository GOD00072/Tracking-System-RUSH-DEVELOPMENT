import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Truck,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Ship,
  Plane,
  Calendar,
  ChevronRight,
  AlertTriangle,
  Timer,
  TrendingUp,
  Crown,
  XCircle,
  Search,
  ChevronLeft,
  Eye,
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { motion } from 'framer-motion';
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
  ComposedChart,
  Line,
} from 'recharts';
import { pageTransition, staggerContainer, staggerItem } from '../../lib/animations';
import api from '../../lib/api';

interface ShipmentsData {
  summary: {
    totalPending: number;
    totalShipped: number;
    totalDelivered: number;
    totalActive: number;
    totalCancelled: number;
  };
  statusDistribution: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  shippingMethodDistribution: {
    sea: number;
    air: number;
  };
  pendingByAge: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    older: number;
  };
  pendingOrders: Array<{
    id: string;
    orderNumber: string;
    customer: string;
    customerTier: string;
    status: string;
    statusStep: number;
    shippingMethod: string;
    itemCount: number;
    ageInDays: number;
    createdAt: string;
  }>;
  workflowProgress: Array<{
    step: number;
    name: string;
    orderCount: number;
    itemCount: number;
  }>;
  upcomingDeliveries: Array<{
    id: string;
    orderNumber: string;
    customer: string;
    status: string;
    shippingMethod: string;
    estimatedDelivery: string;
  }>;
  recentActivity: Array<{
    id: string;
    orderNumber: string;
    status: string;
    statusStep: number;
    updatedAt: string;
  }>;
  timeline: Array<{
    date: string;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    total: number;
  }>;
  generatedAt: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'รอดำเนินการ', color: '#f59e0b', bgColor: 'bg-yellow-100 text-yellow-700' },
  processing: { label: 'กำลังดำเนินการ', color: '#3b82f6', bgColor: 'bg-blue-100 text-blue-700' },
  shipped: { label: 'กำลังจัดส่ง', color: '#8b5cf6', bgColor: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'ส่งสำเร็จ', color: '#10b981', bgColor: 'bg-green-100 text-green-700' },
  cancelled: { label: 'ยกเลิก', color: '#ef4444', bgColor: 'bg-red-100 text-red-700' },
};

const STATUS_STEP_COLORS: Record<number, string> = {
  1: 'bg-gray-100 text-gray-700',
  2: 'bg-yellow-100 text-yellow-700',
  3: 'bg-blue-100 text-blue-700',
  4: 'bg-indigo-100 text-indigo-700',
  5: 'bg-purple-100 text-purple-700',
  6: 'bg-violet-100 text-violet-700',
  7: 'bg-cyan-100 text-cyan-700',
  8: 'bg-orange-100 text-orange-700',
  9: 'bg-green-100 text-green-700',
};

interface TrackingItem {
  id: string;
  trackingCode: string;
  productCode: string;
  productName: string;
  priceYen: number;
  priceBaht: number;
  statusStep: number;
  statusName: string;
  trackingNumberJP: string | null;
  trackingNumberTH: string | null;
  orderId: string;
  orderNumber: string;
  shippingMethod: string;
  customerId: string;
  customerName: string;
  customerTier: string;
  createdAt: string;
  updatedAt: string;
}

const AGE_COLORS: Record<string, string> = {
  today: '#10b981',
  thisWeek: '#3b82f6',
  thisMonth: '#f59e0b',
  older: '#ef4444',
};

const formatShortDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
};

const formatFullDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
};

const AdminShipmentsPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ShipmentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'tracking'>('overview');

  // Tracking Orders state
  const [trackingItems, setTrackingItems] = useState<TrackingItem[]>([]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingSearch, setTrackingSearch] = useState('');
  const [trackingStatusFilter, setTrackingStatusFilter] = useState('all');
  const [trackingPage, setTrackingPage] = useState(1);
  const [trackingPagination, setTrackingPagination] = useState({ total: 0, totalPages: 0 });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/statistics/shipments');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err: any) {
      console.error('Shipments fetch error:', err);
      setError(err.response?.data?.error?.message || 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackingOrders = async () => {
    try {
      setTrackingLoading(true);
      const params = new URLSearchParams();
      params.append('page', trackingPage.toString());
      params.append('limit', '15');
      if (trackingSearch) params.append('search', trackingSearch);
      if (trackingStatusFilter !== 'all') params.append('statusStep', trackingStatusFilter);

      const res = await api.get(`/statistics/tracking-orders?${params.toString()}`);
      if (res.data.success) {
        setTrackingItems(res.data.data.items);
        setTrackingPagination(res.data.data.pagination);
      }
    } catch (err) {
      console.error('Tracking orders fetch error:', err);
    } finally {
      setTrackingLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchTrackingOrders();
  }, []);

  useEffect(() => {
    fetchTrackingOrders();
  }, [trackingPage, trackingStatusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTrackingPage(1);
      fetchTrackingOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [trackingSearch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner text="กำลังโหลดข้อมูลการจัดส่ง..." />
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
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Prepare chart data
  const statusPieData = Object.entries(data.statusDistribution)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      name: STATUS_LABELS[status]?.label || status,
      value: count,
      color: STATUS_LABELS[status]?.color || '#gray',
    }));

  const shippingMethodPieData = [
    { name: 'ทางเรือ', value: data.shippingMethodDistribution.sea, color: '#3b82f6', icon: Ship },
    { name: 'ทางอากาศ', value: data.shippingMethodDistribution.air, color: '#8b5cf6', icon: Plane },
  ].filter((item) => item.value > 0);

  const pendingAgeData = [
    { name: 'วันนี้', value: data.pendingByAge.today, color: AGE_COLORS.today },
    { name: 'สัปดาห์นี้', value: data.pendingByAge.thisWeek, color: AGE_COLORS.thisWeek },
    { name: 'เดือนนี้', value: data.pendingByAge.thisMonth, color: AGE_COLORS.thisMonth },
    { name: 'เก่ากว่า', value: data.pendingByAge.older, color: AGE_COLORS.older },
  ].filter((item) => item.value > 0);

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
        className="mb-6 flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">การจัดส่ง</h1>
          <p className="text-gray-600 mt-2">ภาพรวมสถานะการจัดส่งและติดตามสินค้า</p>
        </div>
        <button
          onClick={() => { fetchData(); fetchTrackingOrders(); }}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors border border-gray-200"
        >
          <RefreshCw className="w-4 h-4" />
          รีเฟรช
        </button>
      </motion.div>

      {/* Tabs */}
      <motion.div
        className="mb-6 border-b border-gray-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              ภาพรวม
            </div>
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'tracking'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Tracking Orders
              {trackingPagination.total > 0 && (
                <span className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full">
                  {trackingPagination.total}
                </span>
              )}
            </div>
          </button>
        </div>
      </motion.div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <>
      {/* Summary Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
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
            <span className="text-amber-100 text-sm font-medium">รอดำเนินการ</span>
          </div>
          <p className="text-3xl font-bold">{data.summary.totalPending}</p>
          <p className="text-amber-200 text-sm mt-1">ออเดอร์ค้างส่ง</p>
        </motion.div>

        {/* Shipped */}
        <motion.div
          className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-5 text-white shadow-lg shadow-purple-500/20"
          variants={staggerItem}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Truck className="w-5 h-5" />
            </div>
            <span className="text-purple-100 text-sm font-medium">กำลังจัดส่ง</span>
          </div>
          <p className="text-3xl font-bold">{data.summary.totalShipped}</p>
          <p className="text-purple-200 text-sm mt-1">อยู่ระหว่างขนส่ง</p>
        </motion.div>

        {/* Delivered */}
        <motion.div
          className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20"
          variants={staggerItem}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-emerald-100 text-sm font-medium">ส่งสำเร็จ</span>
          </div>
          <p className="text-3xl font-bold">{data.summary.totalDelivered}</p>
          <p className="text-emerald-200 text-sm mt-1">ส่งมอบแล้ว</p>
        </motion.div>

        {/* Active */}
        <motion.div
          className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20"
          variants={staggerItem}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-blue-100 text-sm font-medium">ออเดอร์ Active</span>
          </div>
          <p className="text-3xl font-bold">{data.summary.totalActive}</p>
          <p className="text-blue-200 text-sm mt-1">กำลังดำเนินการ</p>
        </motion.div>

        {/* Cancelled */}
        <motion.div
          className="bg-gradient-to-br from-slate-500 to-slate-600 rounded-2xl p-5 text-white shadow-lg shadow-slate-500/20"
          variants={staggerItem}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <XCircle className="w-5 h-5" />
            </div>
            <span className="text-slate-300 text-sm font-medium">ยกเลิก</span>
          </div>
          <p className="text-3xl font-bold">{data.summary.totalCancelled}</p>
          <p className="text-slate-400 text-sm mt-1">ออเดอร์ที่ยกเลิก</p>
        </motion.div>
      </motion.div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Timeline Chart */}
        <motion.div
          className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          variants={staggerItem}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">กราฟการจัดส่ง 30 วัน</h2>
              <p className="text-sm text-gray-500 mt-1">แนวโน้มออเดอร์รายวัน</p>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.timeline}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatShortDate}
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
                          <p className="text-sm font-medium text-gray-900 mb-2">{formatShortDate(label)}</p>
                          {payload.map((entry: any, index: number) => (
                            <p key={index} className="text-sm" style={{ color: entry.color }}>
                              {entry.name}: {entry.value} รายการ
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="ทั้งหมด"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorTotal)"
                />
                <Line
                  type="monotone"
                  dataKey="delivered"
                  name="ส่งสำเร็จ"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="shipped"
                  name="กำลังส่ง"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Status Distribution Pie */}
        <motion.div
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          variants={staggerItem}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">สถานะออเดอร์</h2>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-2 rounded-lg shadow-lg border border-gray-100">
                          <p className="text-sm font-medium">{payload[0].name}</p>
                          <p className="text-lg font-bold">{payload[0].value} ออเดอร์</p>
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
            {statusPieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {/* Shipping Method */}
        <motion.div
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          variants={staggerItem}
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4">วิธีการจัดส่ง</h2>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={shippingMethodPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {shippingMethodPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-2 rounded-lg shadow-lg border border-gray-100">
                          <p className="text-sm font-medium">{payload[0].name}</p>
                          <p className="text-lg font-bold">{payload[0].value} ออเดอร์</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            <div className="flex items-center gap-2">
              <Ship className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-600">เรือ: {data.shippingMethodDistribution.sea}</span>
            </div>
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-gray-600">อากาศ: {data.shippingMethodDistribution.air}</span>
            </div>
          </div>
        </motion.div>

        {/* Pending by Age */}
        <motion.div
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          variants={staggerItem}
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4">อายุออเดอร์ค้าง</h2>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pendingAgeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pendingAgeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-2 rounded-lg shadow-lg border border-gray-100">
                          <p className="text-sm font-medium">{payload[0].name}</p>
                          <p className="text-lg font-bold">{payload[0].value} ออเดอร์</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {pendingAgeData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Workflow Progress - Takes 2 columns */}
        <motion.div
          className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          variants={staggerItem}
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4">ขั้นตอนการดำเนินงาน (8 Steps)</h2>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.workflowProgress} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#374151', fontSize: 11 }}
                  width={90}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{data.name}</p>
                          <p className="text-sm text-blue-600">ออเดอร์: {data.orderCount}</p>
                          <p className="text-sm text-purple-600">สินค้า: {data.itemCount}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="orderCount" name="ออเดอร์" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="itemCount" name="สินค้า" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Pending Orders Table & Upcoming Deliveries */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pending Orders */}
        <motion.div
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          variants={staggerItem}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-bold text-gray-900">ออเดอร์ค้างส่ง</h2>
            </div>
            <button
              onClick={() => navigate('/admin/orders')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              ดูทั้งหมด <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium">Order Number</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Route</th>
                  <th className="pb-3 font-medium">Method</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.pendingOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-400" />
                      <p>ไม่มีออเดอร์ค้างส่ง</p>
                    </td>
                  </tr>
                ) : (
                  data.pendingOrders.slice(0, 10).map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3">
                        <span className="font-medium text-gray-900 text-sm">{order.orderNumber}</span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-gray-600 truncate max-w-[120px]">{order.customer}</span>
                          {order.customerTier !== 'member' && (
                            <Crown
                              className={`w-3 h-3 ${
                                order.customerTier === 'vvip' ? 'text-purple-500' : 'text-amber-500'
                              }`}
                            />
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="text-sm text-gray-600">JP → TH</span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          {order.shippingMethod === 'sea' ? (
                            <>
                              <Ship className="w-4 h-4 text-blue-500" />
                              <span className="text-xs text-gray-500">เรือ</span>
                            </>
                          ) : (
                            <>
                              <Plane className="w-4 h-4 text-purple-500" />
                              <span className="text-xs text-gray-500">อากาศ</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            STATUS_LABELS[order.status]?.bgColor || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          Step {order.statusStep}
                        </span>
                        {order.ageInDays > 7 && (
                          <span className={`ml-1 text-xs ${order.ageInDays > 30 ? 'text-red-500' : 'text-amber-500'}`}>
                            ({order.ageInDays}d)
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          ดูรายละเอียด
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Upcoming Deliveries & Recent Activity */}
        <div className="space-y-6">
          {/* Upcoming Deliveries */}
          <motion.div
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            variants={staggerItem}
          >
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-bold text-gray-900">กำหนดส่งเร็วๆ นี้</h2>
            </div>

            {data.upcomingDeliveries.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <Truck className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">ไม่มีกำหนดส่งใน 7 วันข้างหน้า</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.upcomingDeliveries.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-xl cursor-pointer hover:bg-green-100 transition-colors"
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{order.orderNumber}</p>
                      <p className="text-xs text-gray-500">{order.customer}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">
                        {formatFullDate(order.estimatedDelivery)}
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        {order.shippingMethod === 'sea' ? (
                          <Ship className="w-3 h-3 text-blue-500" />
                        ) : (
                          <Plane className="w-3 h-3 text-purple-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            variants={staggerItem}
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-bold text-gray-900">กิจกรรมล่าสุด</h2>
            </div>

            <div className="space-y-3 max-h-[250px] overflow-y-auto">
              {data.recentActivity.slice(0, 8).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => navigate(`/admin/orders/${activity.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: STATUS_LABELS[activity.status]?.color || '#gray' }}
                    />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{activity.orderNumber}</p>
                      <p className="text-xs text-gray-500">Step {activity.statusStep}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        STATUS_LABELS[activity.status]?.bgColor || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {STATUS_LABELS[activity.status]?.label || activity.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(activity.updatedAt).toLocaleString('th-TH', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
        </>
      )}

      {/* Tracking Orders Tab Content */}
      {activeTab === 'tracking' && (
      <motion.div
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary-500" />
            <h2 className="text-xl font-bold text-gray-900">Tracking Orders</h2>
            <span className="text-sm text-gray-500">({trackingPagination.total} รายการ)</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหา Tracking, Order, ลูกค้า..."
                value={trackingSearch}
                onChange={(e) => setTrackingSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {/* Status Filter */}
            <select
              value={trackingStatusFilter}
              onChange={(e) => {
                setTrackingStatusFilter(e.target.value);
                setTrackingPage(1);
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="1">1. รับออเดอร์</option>
              <option value="2">2. ชำระเงินงวดแรก</option>
              <option value="3">3. สั่งซื้อจากญี่ปุ่น</option>
              <option value="4">4. ของถึงโกดังญี่ปุ่น</option>
              <option value="5">5. จัดรอบส่งกลับ</option>
              <option value="6">6. ส่งออกจากญี่ปุ่น</option>
              <option value="7">7. ของถึงไทย</option>
              <option value="8">8. กำลังจัดส่ง</option>
              <option value="9">9. ส่งมอบสำเร็จ</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="pb-3 font-medium">Tracking Code</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Route</th>
                <th className="pb-3 font-medium">Method</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {trackingLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                    <p className="text-gray-400 mt-2">กำลังโหลด...</p>
                  </td>
                </tr>
              ) : trackingItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>ไม่พบรายการ</p>
                  </td>
                </tr>
              ) : (
                trackingItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3">
                      <div className="flex flex-col">
                        <code className="text-sm font-medium text-primary-700 bg-primary-50 px-2 py-1 rounded w-fit">
                          {item.trackingCode || '-'}
                        </code>
                        <span className="text-xs text-gray-400 mt-1">{item.orderNumber}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-700 truncate max-w-[150px]">{item.customerName}</span>
                        {item.customerTier !== 'member' && (
                          <Crown
                            className={`w-3 h-3 flex-shrink-0 ${
                              item.customerTier === 'vvip' ? 'text-purple-500' : 'text-amber-500'
                            }`}
                          />
                        )}
                      </div>
                      {item.productName && (
                        <p className="text-xs text-gray-400 truncate max-w-[150px]" title={item.productName}>
                          {item.productName}
                        </p>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-lg">🇯🇵</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-lg">🇹🇭</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        {item.shippingMethod === 'sea' ? (
                          <>
                            <Ship className="w-4 h-4 text-blue-500" />
                            <span className="text-xs text-gray-500">ทางเรือ</span>
                          </>
                        ) : (
                          <>
                            <Plane className="w-4 h-4 text-purple-500" />
                            <span className="text-xs text-gray-500">ทางอากาศ</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          STATUS_STEP_COLORS[item.statusStep] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {item.statusStep}. {item.statusName}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => navigate(`/admin/orders/${item.orderId}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        ดูรายละเอียด
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {trackingPagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              หน้า {trackingPage} จาก {trackingPagination.totalPages} ({trackingPagination.total} รายการ)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTrackingPage((p) => Math.max(1, p - 1))}
                disabled={trackingPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTrackingPage((p) => Math.min(trackingPagination.totalPages, p + 1))}
                disabled={trackingPage === trackingPagination.totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
      )}

      {/* Last Updated */}
      <motion.div
        className="mt-6 text-center text-xs text-gray-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        อัปเดตล่าสุด: {new Date(data.generatedAt).toLocaleString('th-TH')}
      </motion.div>
    </motion.div>
  );
};

export default AdminShipmentsPage;
