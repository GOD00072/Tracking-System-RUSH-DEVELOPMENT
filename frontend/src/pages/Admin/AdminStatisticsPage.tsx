import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, TrendingUp, TrendingDown, RefreshCw, Calendar,
  DollarSign, Package, Users, CreditCard, Download, Filter,
  ChevronLeft, ChevronRight, Clock, CheckCircle,
  Banknote, PiggyBank, ArrowUpRight, ArrowDownRight, FileText,
  Crown, Ship, Plane, ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';

// Tab types
type TabType = 'overview' | 'daily' | 'monthly' | 'transactions';

const AdminStatisticsPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      start: start.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0],
    };
  });
  const [transactionType, setTransactionType] = useState<'all' | 'verified' | 'pending'>('all');

  // Fetch overview data
  const { data: overviewData, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
    queryKey: ['statistics-overview'],
    queryFn: async () => {
      const [revenue, today, dashboard] = await Promise.all([
        api.get('/statistics/revenue-overview'),
        api.get('/statistics/today-summary'),
        api.get('/statistics/dashboard'),
      ]);
      return {
        revenue: revenue.data.data,
        today: today.data.data,
        dashboard: dashboard.data.data,
      };
    },
  });

  // Fetch monthly report
  const { data: monthlyData, isLoading: monthlyLoading, refetch: refetchMonthly } = useQuery({
    queryKey: ['statistics-monthly', selectedMonth.year, selectedMonth.month],
    queryFn: async () => {
      const res = await api.get('/statistics/monthly-report', {
        params: { year: selectedMonth.year, month: selectedMonth.month },
      });
      return res.data.data;
    },
    enabled: activeTab === 'monthly',
  });

  // Fetch transactions
  const { data: transactionsData, isLoading: transactionsLoading, refetch: refetchTransactions } = useQuery({
    queryKey: ['statistics-transactions', dateRange, transactionType],
    queryFn: async () => {
      const res = await api.get('/statistics/transactions', {
        params: {
          startDate: dateRange.start,
          endDate: dateRange.end,
          type: transactionType,
          limit: 100,
        },
      });
      return res.data.data;
    },
    enabled: activeTab === 'transactions' || activeTab === 'daily',
  });

  // Fetch sales chart
  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['statistics-chart'],
    queryFn: async () => {
      const res = await api.get('/statistics/sales-chart', {
        params: { period: '30d' },
      });
      return res.data.data;
    },
  });

  const handleRefresh = () => {
    refetchOverview();
    if (activeTab === 'monthly') refetchMonthly();
    if (activeTab === 'transactions' || activeTab === 'daily') refetchTransactions();
  };

  const formatCurrency = (amount: number, currency: 'THB' | 'JPY' = 'THB') => {
    if (currency === 'JPY') {
      return `¥${Math.round(amount).toLocaleString()}`;
    }
    return `฿${amount.toLocaleString()}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const changeMonth = (delta: number) => {
    setSelectedMonth((prev) => {
      let newMonth = prev.month + delta;
      let newYear = prev.year;
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      } else if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
      return { year: newYear, month: newMonth };
    });
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'vip': return 'bg-yellow-100 text-yellow-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'wholesale': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'ภาพรวม', shortLabel: 'ภาพรวม', icon: BarChart3 },
    { id: 'daily' as TabType, label: 'รายวัน', shortLabel: 'วัน', icon: Calendar },
    { id: 'monthly' as TabType, label: 'รายเดือน', shortLabel: 'เดือน', icon: FileText },
    { id: 'transactions' as TabType, label: 'รายการเงิน', shortLabel: 'เงิน', icon: CreditCard },
  ];

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2 md:gap-3">
            <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
            <span className="hidden md:inline">สถิติและรายงาน</span>
            <span className="md:hidden">สถิติ</span>
          </h1>
          <p className="text-gray-600 text-sm hidden md:block mt-1">ข้อมูลยอดขาย รายได้ และสถิติต่างๆ</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-2 md:px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden md:inline">โหลดข้อมูลใหม่</span>
        </button>
      </div>

      {/* Tabs - Mobile Scroll */}
      <div className="flex gap-1.5 md:gap-2 mb-4 md:mb-6 bg-white p-1 rounded-xl shadow-sm overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-lg font-medium transition-all whitespace-nowrap text-sm md:text-base ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4 md:w-5 md:h-5" />
              <span className="md:hidden">{tab.shortLabel}</span>
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4 md:space-y-6">
          {overviewLoading ? (
            <LoadingSpinner />
          ) : overviewData ? (
            <>
              {/* Today's Summary Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl md:rounded-2xl p-4 md:p-6 text-white shadow-xl"
              >
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h2 className="text-base md:text-xl font-bold flex items-center gap-2">
                    <DollarSign className="w-5 h-5 md:w-6 md:h-6" />
                    ยอดขายวันนี้
                  </h2>
                  <span className="text-blue-200 text-xs md:text-sm hidden md:block">
                    {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                  <div>
                    <p className="text-blue-200 text-xs md:text-sm mb-1">รายได้วันนี้</p>
                    <p className="text-xl md:text-3xl font-bold">{formatCurrency(overviewData.today.revenue.todayBaht)}</p>
                    {overviewData.today.revenue.todayYen > 0 && (
                      <p className="text-blue-200 text-xs md:text-sm mt-1">
                        {formatCurrency(overviewData.today.revenue.todayYen, 'JPY')}
                      </p>
                    )}
                    <div className={`flex items-center gap-1 mt-1 md:mt-2 ${overviewData.today.revenue.changePercent >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                      {overviewData.today.revenue.changePercent >= 0 ? (
                        <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 md:w-4 md:h-4" />
                      )}
                      <span className="text-xs md:text-sm font-medium">
                        {overviewData.today.revenue.changePercent >= 0 ? '+' : ''}{overviewData.today.revenue.changePercent}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-blue-200 text-xs md:text-sm mb-1">ชำระเงิน</p>
                    <p className="text-xl md:text-3xl font-bold">{overviewData.today.revenue.paymentsCount}</p>
                    <p className="text-blue-200 text-xs md:text-sm mt-1">รายการ</p>
                  </div>
                  <div>
                    <p className="text-blue-200 text-xs md:text-sm mb-1">ออเดอร์ใหม่</p>
                    <p className="text-xl md:text-3xl font-bold">{overviewData.today.orders.today}</p>
                    <div className={`flex items-center gap-1 mt-1 md:mt-2 ${overviewData.today.orders.changePercent >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                      {overviewData.today.orders.changePercent >= 0 ? (
                        <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 md:w-4 md:h-4" />
                      )}
                      <span className="text-xs md:text-sm">{overviewData.today.orders.changePercent >= 0 ? '+' : ''}{overviewData.today.orders.changePercent}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-blue-200 text-xs md:text-sm mb-1">รอยืนยัน</p>
                    <p className="text-xl md:text-3xl font-bold">{overviewData.today.pendingPayments.count}</p>
                    <p className="text-blue-200 text-xs md:text-sm mt-1">
                      {formatCurrency(overviewData.today.pendingPayments.totalBaht)}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Revenue Overview Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <StatCard
                  title="สัปดาห์นี้"
                  value={formatCurrency(overviewData.revenue.thisWeek.baht)}
                  subValue={`${overviewData.revenue.thisWeek.count} รายการ`}
                  icon={Calendar}
                  color="green"
                />
                <StatCard
                  title="เดือนนี้"
                  value={formatCurrency(overviewData.revenue.thisMonth.baht)}
                  subValue={`${overviewData.revenue.thisMonth.growthPercent >= 0 ? '+' : ''}${overviewData.revenue.thisMonth.growthPercent}%`}
                  icon={TrendingUp}
                  color="blue"
                  trend={overviewData.revenue.thisMonth.growthPercent}
                />
                <StatCard
                  title="ปีนี้"
                  value={formatCurrency(overviewData.revenue.thisYear.baht)}
                  subValue={`${overviewData.revenue.thisYear.count} รายการ`}
                  icon={PiggyBank}
                  color="purple"
                />
                <StatCard
                  title="รอดำเนินการ"
                  value={formatCurrency(overviewData.revenue.pending.baht)}
                  subValue={`${overviewData.revenue.pending.count} รายการ`}
                  icon={Clock}
                  color="yellow"
                />
              </div>

              {/* Dashboard Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <StatCard
                  title="ออเดอร์ทั้งหมด"
                  value={overviewData.dashboard.stats.totalOrders.value.toString()}
                  subValue={`เดือนนี้ ${overviewData.dashboard.stats.totalOrders.thisMonth}`}
                  icon={Package}
                  color="indigo"
                />
                <StatCard
                  title="กำลังจัดส่ง"
                  value={overviewData.dashboard.stats.activeShipments.value.toString()}
                  subValue={`Shipped: ${overviewData.dashboard.stats.activeShipments.shipped}`}
                  icon={Ship}
                  color="cyan"
                />
                <StatCard
                  title="ลูกค้าทั้งหมด"
                  value={overviewData.dashboard.stats.totalCustomers.value.toString()}
                  subValue={`VIP: ${overviewData.dashboard.stats.totalCustomers.vipCount}`}
                  icon={Users}
                  color="pink"
                />
                <StatCard
                  title="สินค้าในระบบ"
                  value={overviewData.dashboard.stats.totalOrderItems.value.toString()}
                  subValue={`เดือนนี้ ${overviewData.dashboard.stats.totalOrderItems.thisMonth}`}
                  icon={Banknote}
                  color="orange"
                />
              </div>

              {/* Chart and Order Status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Simple Bar Chart */}
                <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm md:text-base">
                    <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                    ยอดขาย 30 วันล่าสุด
                  </h3>
                  {chartLoading ? (
                    <div className="h-36 md:h-48 flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : chartData?.chartData ? (
                    <div className="h-36 md:h-48 flex items-end gap-0.5 md:gap-1">
                      {chartData.chartData.slice(-30).map((day: any, idx: number) => {
                        const maxValue = Math.max(...chartData.chartData.map((d: any) => d.totalBaht)) || 1;
                        const height = (day.totalBaht / maxValue) * 100;
                        return (
                          <div
                            key={idx}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 rounded-t transition-all cursor-pointer group relative"
                            style={{ height: `${Math.max(height, 2)}%` }}
                            title={`${day.date}: ${formatCurrency(day.totalBaht)}`}
                          >
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 hidden md:block">
                              {formatCurrency(day.totalBaht)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-36 md:h-48 flex items-center justify-center text-gray-400">
                      ไม่มีข้อมูล
                    </div>
                  )}
                  {chartData && (
                    <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t flex justify-between text-xs md:text-sm">
                      <span className="text-gray-500">รวม 30 วัน</span>
                      <span className="font-bold text-blue-600">{formatCurrency(chartData.totals.totalBaht)}</span>
                    </div>
                  )}
                </div>

                {/* Order Status Distribution */}
                <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm md:text-base">
                    <Package className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                    สถานะออเดอร์
                  </h3>
                  <div className="space-y-2 md:space-y-3">
                    {[
                      { key: 'pending', label: 'รอดำเนินการ', color: 'bg-yellow-500' },
                      { key: 'processing', label: 'กำลังดำเนินการ', color: 'bg-blue-500' },
                      { key: 'shipped', label: 'กำลังจัดส่ง', color: 'bg-purple-500' },
                      { key: 'delivered', label: 'ส่งถึงแล้ว', color: 'bg-green-500' },
                      { key: 'cancelled', label: 'ยกเลิก', color: 'bg-red-500' },
                    ].map((status) => {
                      const count = overviewData.dashboard.ordersByStatus[status.key] || 0;
                      const total = Object.values(overviewData.dashboard.ordersByStatus).reduce((a: number, b: any) => a + b, 0) as number;
                      const percent = total > 0 ? (count / total) * 100 : 0;
                      return (
                        <div key={status.key}>
                          <div className="flex justify-between text-xs md:text-sm mb-1">
                            <span className="text-gray-600">{status.label}</span>
                            <span className="font-medium">{count} ({percent.toFixed(0)}%)</span>
                          </div>
                          <div className="h-1.5 md:h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${status.color} rounded-full transition-all`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm md:text-base">
                  <Clock className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                  ออเดอร์ล่าสุด
                </h3>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 border-b">
                        <th className="pb-3 font-medium">เลขออเดอร์</th>
                        <th className="pb-3 font-medium">ลูกค้า</th>
                        <th className="pb-3 font-medium">สินค้า</th>
                        <th className="pb-3 font-medium">ขนส่ง</th>
                        <th className="pb-3 font-medium">สถานะ</th>
                        <th className="pb-3 font-medium">วันที่</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {overviewData.dashboard.recentOrders.map((order: any) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="py-3 font-medium text-blue-600">{order.orderNumber}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              {order.customer}
                              {order.customerTier !== 'member' && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getTierColor(order.customerTier)}`}>
                                  {order.customerTier.toUpperCase()}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3">{order.itemCount} รายการ</td>
                          <td className="py-3">
                            {order.shippingMethod === 'sea' ? (
                              <span className="flex items-center gap-1 text-blue-600">
                                <Ship className="w-4 h-4" /> ทางเรือ
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-purple-600">
                                <Plane className="w-4 h-4" /> ทางอากาศ
                              </span>
                            )}
                          </td>
                          <td className="py-3">
                            <StatusBadge status={order.status} />
                          </td>
                          <td className="py-3 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {overviewData.dashboard.recentOrders.slice(0, 5).map((order: any) => (
                    <div key={order.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-blue-600 text-sm">{order.orderNumber}</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">{order.customer}</span>
                          {order.customerTier !== 'member' && (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${getTierColor(order.customerTier)}`}>
                              {order.customerTier}
                            </span>
                          )}
                        </div>
                        <span className="text-gray-500">{order.itemCount} รายการ</span>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        {order.shippingMethod === 'sea' ? (
                          <span className="flex items-center gap-1 text-blue-600">
                            <Ship className="w-3 h-3" /> ทางเรือ
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-purple-600">
                            <Plane className="w-3 h-3" /> ทางอากาศ
                          </span>
                        )}
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Daily Tab */}
      {activeTab === 'daily' && (
        <div className="space-y-4 md:space-y-6">
          {/* Date Range Filter */}
          <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Calendar className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="border rounded-lg px-2 md:px-3 py-2 text-sm flex-1 md:flex-none"
                />
                <span className="text-gray-400 text-sm">ถึง</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="border rounded-lg px-2 md:px-3 py-2 text-sm flex-1 md:flex-none"
                />
              </div>
              <button
                onClick={() => refetchTransactions()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 w-full md:w-auto"
              >
                ค้นหา
              </button>
            </div>
          </div>

          {transactionsLoading ? (
            <LoadingSpinner />
          ) : transactionsData ? (
            <>
              {/* Daily Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <StatCard
                  title="ยอดรวม (ยืนยันแล้ว)"
                  value={formatCurrency(transactionsData.totals.verifiedBaht)}
                  subValue={`${transactionsData.totals.verifiedCount} รายการ`}
                  icon={CheckCircle}
                  color="green"
                />
                <StatCard
                  title="ยอดเยน"
                  value={formatCurrency(transactionsData.totals.verifiedYen, 'JPY')}
                  subValue="จากการชำระทั้งหมด"
                  icon={Banknote}
                  color="indigo"
                />
                <StatCard
                  title="รายการทั้งหมด"
                  value={transactionsData.totals.totalTransactions.toString()}
                  subValue={`${transactionsData.dailySummaries.length} วัน`}
                  icon={FileText}
                  color="blue"
                />
              </div>

              {/* Daily Breakdown Table */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-3 md:p-4 border-b bg-gray-50">
                  <h3 className="font-bold text-gray-900 text-sm md:text-base">สรุปรายวัน</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs md:text-sm text-gray-500 bg-gray-50 border-b">
                        <th className="px-3 md:px-4 py-2 md:py-3 font-medium">วันที่</th>
                        <th className="px-3 md:px-4 py-2 md:py-3 font-medium text-right">ยอด (฿)</th>
                        <th className="px-3 md:px-4 py-2 md:py-3 font-medium text-right hidden md:table-cell">ยอด (¥)</th>
                        <th className="px-3 md:px-4 py-2 md:py-3 font-medium text-right">จำนวน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {transactionsData.dailySummaries.map((day: any) => (
                        <tr key={day.date} className="hover:bg-gray-50">
                          <td className="px-3 md:px-4 py-2 md:py-3 font-medium text-xs md:text-sm">{formatDate(day.date)}</td>
                          <td className="px-3 md:px-4 py-2 md:py-3 text-right text-green-600 font-medium text-xs md:text-sm">
                            {formatCurrency(day.verifiedBaht)}
                          </td>
                          <td className="px-3 md:px-4 py-2 md:py-3 text-right text-indigo-600 hidden md:table-cell">
                            {formatCurrency(day.verifiedYen, 'JPY')}
                          </td>
                          <td className="px-3 md:px-4 py-2 md:py-3 text-right text-xs md:text-sm">{day.verifiedCount}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2">
                      <tr className="font-bold text-xs md:text-sm">
                        <td className="px-3 md:px-4 py-2 md:py-3">รวม</td>
                        <td className="px-3 md:px-4 py-2 md:py-3 text-right text-green-600">
                          {formatCurrency(transactionsData.totals.verifiedBaht)}
                        </td>
                        <td className="px-3 md:px-4 py-2 md:py-3 text-right text-indigo-600 hidden md:table-cell">
                          {formatCurrency(transactionsData.totals.verifiedYen, 'JPY')}
                        </td>
                        <td className="px-3 md:px-4 py-2 md:py-3 text-right">{transactionsData.totals.verifiedCount}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Monthly Tab */}
      {activeTab === 'monthly' && (
        <div className="space-y-4 md:space-y-6">
          {/* Month Selector */}
          <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm flex items-center justify-between">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base md:text-xl font-bold">
              {new Date(selectedMonth.year, selectedMonth.month - 1).toLocaleDateString('th-TH', {
                month: 'long',
                year: 'numeric',
              })}
            </h2>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {monthlyLoading ? (
            <LoadingSpinner />
          ) : monthlyData ? (
            <>
              {/* Monthly Summary */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl md:rounded-2xl p-4 md:p-6 text-white shadow-xl">
                <h3 className="text-sm md:text-lg font-medium mb-3 md:mb-4 text-green-100">สรุปประจำเดือน {monthlyData.period.monthName}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                  <div>
                    <p className="text-green-200 text-xs md:text-sm">รายได้รวม</p>
                    <p className="text-xl md:text-3xl font-bold mt-1">{formatCurrency(monthlyData.summary.totalRevenueBaht)}</p>
                    <div className={`flex items-center gap-1 mt-1 md:mt-2 ${monthlyData.summary.growthPercent >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                      {monthlyData.summary.growthPercent >= 0 ? <TrendingUp className="w-3 h-3 md:w-4 md:h-4" /> : <TrendingDown className="w-3 h-3 md:w-4 md:h-4" />}
                      <span className="text-xs md:text-sm">{monthlyData.summary.growthPercent >= 0 ? '+' : ''}{monthlyData.summary.growthPercent}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-green-200 text-xs md:text-sm">รายการ</p>
                    <p className="text-xl md:text-3xl font-bold mt-1">{monthlyData.summary.transactionCount}</p>
                    <p className="text-green-200 text-xs md:text-sm mt-1 md:mt-2">รายการ</p>
                  </div>
                  <div>
                    <p className="text-green-200 text-xs md:text-sm">ออเดอร์ใหม่</p>
                    <p className="text-xl md:text-3xl font-bold mt-1">{monthlyData.summary.newOrders}</p>
                    <p className="text-green-200 text-xs md:text-sm mt-1 md:mt-2">ออเดอร์</p>
                  </div>
                  <div>
                    <p className="text-green-200 text-xs md:text-sm">ลูกค้าใหม่</p>
                    <p className="text-xl md:text-3xl font-bold mt-1">{monthlyData.summary.newCustomers}</p>
                    <p className="text-green-200 text-xs md:text-sm mt-1 md:mt-2">ราย</p>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <StatCard
                  title="เฉลี่ยต่อรายการ"
                  value={formatCurrency(Math.round(monthlyData.summary.averageTransactionBaht))}
                  icon={BarChart3}
                  color="blue"
                />
                <StatCard
                  title="รายการสูงสุด"
                  value={formatCurrency(monthlyData.summary.maxTransactionBaht)}
                  icon={TrendingUp}
                  color="green"
                />
                <StatCard
                  title="รายการต่ำสุด"
                  value={formatCurrency(monthlyData.summary.minTransactionBaht)}
                  icon={TrendingDown}
                  color="yellow"
                />
                <StatCard
                  title="เดือนก่อน"
                  value={formatCurrency(monthlyData.summary.lastMonthBaht)}
                  icon={Calendar}
                  color="gray"
                />
              </div>

              {/* Top Customers */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-3 md:p-4 border-b bg-gray-50">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm md:text-base">
                    <Crown className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
                    ลูกค้ายอดซื้อสูงสุด
                  </h3>
                </div>
                <div className="divide-y">
                  {monthlyData.topCustomers.map((customer: any, idx: number) => (
                    <div key={customer.id} className="p-3 md:p-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-2 md:gap-3">
                        <span className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold ${
                          idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                          idx === 1 ? 'bg-gray-100 text-gray-700' :
                          idx === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-medium text-sm md:text-base">{customer.name}</p>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-1.5 md:px-2 py-0.5 rounded-full ${getTierColor(customer.tier)}`}>
                              {customer.tier.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">{customer.transactionCount} รายการ</span>
                          </div>
                        </div>
                      </div>
                      <p className="font-bold text-green-600 text-sm md:text-base">{formatCurrency(customer.totalBaht)}</p>
                    </div>
                  ))}
                  {monthlyData.topCustomers.length === 0 && (
                    <div className="p-8 text-center text-gray-400">
                      ไม่มีข้อมูล
                    </div>
                  )}
                </div>
              </div>

              {/* Revenue by Tier */}
              <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3 md:mb-4 text-sm md:text-base">รายได้แยกตามระดับลูกค้า</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                  {monthlyData.revenueByTier.map((tier: any) => (
                    <div key={tier.tier} className={`p-3 md:p-4 rounded-xl ${
                      tier.tier === 'vip' ? 'bg-yellow-50' :
                      tier.tier === 'premium' ? 'bg-purple-50' :
                      tier.tier === 'wholesale' ? 'bg-blue-50' :
                      'bg-gray-50'
                    }`}>
                      <p className="text-xs md:text-sm text-gray-600 mb-1">{tier.tier.toUpperCase()}</p>
                      <p className="text-base md:text-xl font-bold">{formatCurrency(tier.totalBaht)}</p>
                      <p className="text-xs md:text-sm text-gray-500">{tier.count} รายการ</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-4 md:space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Calendar className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="border rounded-lg px-2 md:px-3 py-2 text-sm flex-1 md:flex-none"
                />
                <span className="text-gray-400 text-sm">ถึง</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="border rounded-lg px-2 md:px-3 py-2 text-sm flex-1 md:flex-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
                <select
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value as any)}
                  className="border rounded-lg px-2 md:px-3 py-2 text-sm flex-1 md:flex-none"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="verified">ยืนยันแล้ว</option>
                  <option value="pending">รอยืนยัน</option>
                </select>
              </div>
              <button
                onClick={() => refetchTransactions()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 w-full md:w-auto"
              >
                ค้นหา
              </button>
            </div>
          </div>

          {transactionsLoading ? (
            <LoadingSpinner />
          ) : transactionsData ? (
            <>
              {/* Summary */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl md:rounded-2xl p-4 md:p-6 text-white shadow-xl">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h3 className="text-sm md:text-lg font-medium text-indigo-200">Statement รายการเงิน</h3>
                  <span className="text-indigo-200 text-xs md:text-sm hidden md:block">
                    {formatDate(transactionsData.period.start)} - {formatDate(transactionsData.period.end)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 md:gap-6">
                  <div>
                    <p className="text-indigo-200 text-xs md:text-sm">ยอดรับรวม</p>
                    <p className="text-xl md:text-3xl font-bold mt-1">{formatCurrency(transactionsData.totals.verifiedBaht)}</p>
                  </div>
                  <div>
                    <p className="text-indigo-200 text-xs md:text-sm">รายการทั้งหมด</p>
                    <p className="text-xl md:text-3xl font-bold mt-1">{transactionsData.totals.totalTransactions}</p>
                  </div>
                  <div>
                    <p className="text-indigo-200 text-xs md:text-sm">ยืนยันแล้ว</p>
                    <p className="text-xl md:text-3xl font-bold mt-1">{transactionsData.totals.verifiedCount}</p>
                  </div>
                </div>
              </div>

              {/* Transaction List */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-3 md:p-4 border-b bg-gray-50 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 text-sm md:text-base">รายการเคลื่อนไหว</h3>
                  <button className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-blue-600 hover:text-blue-700">
                    <Download className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden md:inline">ดาวน์โหลด</span>
                  </button>
                </div>

                {/* Mobile Transaction Cards */}
                <div className="md:hidden divide-y">
                  {transactionsData.transactions.map((tx: any) => (
                    <div key={tx.id} className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Link
                          to={`/admin/orders/${tx.orderId}`}
                          className="text-blue-600 font-medium text-sm hover:underline flex items-center gap-1"
                        >
                          {tx.reference}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                        {tx.status === 'verified' ? (
                          <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-xs">
                            <CheckCircle className="w-3 h-3" />
                            ยืนยัน
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full text-xs">
                            <Clock className="w-3 h-3" />
                            รอ
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
                      {tx.trackingNumber && (
                        <p className="text-xs text-gray-500">Tracking: {tx.trackingNumber}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-600">{tx.customer.name}</span>
                          {tx.customer.tier !== 'member' && (
                            <span className={`text-xs px-1 py-0.5 rounded ${getTierColor(tx.customer.tier)}`}>
                              {tx.customer.tier}
                            </span>
                          )}
                        </div>
                        <span className={`font-bold ${tx.status === 'verified' ? 'text-green-600' : 'text-yellow-600'}`}>
                          {tx.status === 'verified' ? '+' : ''}{formatCurrency(tx.amountBaht)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>{formatDateTime(tx.date)}</span>
                        <span className="flex items-center gap-1">
                          {tx.shippingMethod === 'sea' ? (
                            <><Ship className="w-3 h-3 text-blue-500" /> เรือ</>
                          ) : (
                            <><Plane className="w-3 h-3 text-purple-500" /> อากาศ</>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 bg-gray-50 border-b">
                        <th className="px-4 py-3 font-medium">Order Number</th>
                        <th className="px-4 py-3 font-medium">Customer</th>
                        <th className="px-4 py-3 font-medium">Route</th>
                        <th className="px-4 py-3 font-medium">Method</th>
                        <th className="px-4 py-3 font-medium text-center">Status</th>
                        <th className="px-4 py-3 font-medium text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {transactionsData.transactions.map((tx: any) => (
                        <tr key={tx.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <Link
                              to={`/admin/orders/${tx.orderId}`}
                              className="text-blue-600 font-medium hover:underline"
                            >
                              {tx.reference}
                            </Link>
                            {tx.trackingNumber && (
                              <div className="text-xs text-gray-500">Tracking: {tx.trackingNumber}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{tx.customer.name}</span>
                              {tx.customer.tier !== 'member' && (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${getTierColor(tx.customer.tier)}`}>
                                  {tx.customer.tier.toUpperCase()}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            JP → TH
                          </td>
                          <td className="px-4 py-3">
                            {tx.shippingMethod === 'sea' ? (
                              <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs">
                                <Ship className="w-3 h-3" />
                                Sea
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-1 rounded-full text-xs">
                                <Plane className="w-3 h-3" />
                                Air
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {tx.status === 'verified' ? (
                              <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full text-xs">
                                <Clock className="w-3 h-3" />
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Link
                              to={`/admin/orders/${tx.orderId}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs"
                            >
                              <ExternalLink className="w-3 h-3" />
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {transactionsData.transactions.length === 0 && (
                  <div className="p-8 md:p-12 text-center text-gray-400">
                    <FileText className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3" />
                    <p>ไม่พบรายการในช่วงเวลาที่เลือก</p>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({
  title,
  value,
  subValue,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: string;
  subValue?: string;
  icon: React.ElementType;
  color: 'green' | 'blue' | 'purple' | 'yellow' | 'indigo' | 'pink' | 'orange' | 'cyan' | 'gray';
  trend?: number;
}) => {
  const colors = {
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    pink: 'bg-pink-50 text-pink-600',
    orange: 'bg-orange-50 text-orange-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    gray: 'bg-gray-50 text-gray-600',
  };

  return (
    <div className="bg-white rounded-xl p-3 md:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <span className="text-gray-500 text-xs md:text-sm">{title}</span>
        <div className={`p-1.5 md:p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-4 h-4 md:w-5 md:h-5" />
        </div>
      </div>
      <p className="text-lg md:text-2xl font-bold text-gray-900">{value}</p>
      {subValue && (
        <p className={`text-xs md:text-sm mt-1 flex items-center gap-1 ${
          trend !== undefined ? (trend >= 0 ? 'text-green-600' : 'text-red-600') : 'text-gray-500'
        }`}>
          {trend !== undefined && (
            trend >= 0 ? <TrendingUp className="w-3 h-3 md:w-4 md:h-4" /> : <TrendingDown className="w-3 h-3 md:w-4 md:h-4" />
          )}
          {subValue}
        </p>
      )}
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const configs: Record<string, { label: string; className: string }> = {
    pending: { label: 'รอดำเนินการ', className: 'bg-yellow-100 text-yellow-800' },
    processing: { label: 'กำลังดำเนินการ', className: 'bg-blue-100 text-blue-800' },
    shipped: { label: 'กำลังจัดส่ง', className: 'bg-purple-100 text-purple-800' },
    delivered: { label: 'ส่งถึงแล้ว', className: 'bg-green-100 text-green-800' },
    cancelled: { label: 'ยกเลิก', className: 'bg-red-100 text-red-800' },
  };

  const config = configs[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

export default AdminStatisticsPage;
