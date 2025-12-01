import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, TrendingUp, TrendingDown, RefreshCw, Calendar,
  DollarSign, Package, Users, CreditCard, Download, Filter,
  ChevronLeft, ChevronRight, Clock, CheckCircle, AlertCircle,
  Banknote, PiggyBank, ArrowUpRight, ArrowDownRight, FileText,
  Crown, Ship, Plane
} from 'lucide-react';
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
      return `¥${amount.toLocaleString()}`;
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
    { id: 'overview' as TabType, label: 'ภาพรวม', icon: BarChart3 },
    { id: 'daily' as TabType, label: 'รายวัน', icon: Calendar },
    { id: 'monthly' as TabType, label: 'รายเดือน', icon: FileText },
    { id: 'transactions' as TabType, label: 'รายการเงิน', icon: CreditCard },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            สถิติและรายงาน
          </h1>
          <p className="text-gray-600 mt-1">ข้อมูลยอดขาย รายได้ และสถิติต่างๆ</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          โหลดข้อมูลใหม่
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white p-1 rounded-xl shadow-sm w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {overviewLoading ? (
            <LoadingSpinner />
          ) : overviewData ? (
            <>
              {/* Today's Summary Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <DollarSign className="w-6 h-6" />
                    ยอดขายวันนี้
                  </h2>
                  <span className="text-blue-200 text-sm">
                    {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-blue-200 text-sm mb-1">รายได้วันนี้</p>
                    <p className="text-3xl font-bold">{formatCurrency(overviewData.today.revenue.todayBaht)}</p>
                    <p className="text-blue-200 text-sm mt-1">
                      {overviewData.today.revenue.todayYen > 0 && formatCurrency(overviewData.today.revenue.todayYen, 'JPY')}
                    </p>
                    <div className={`flex items-center gap-1 mt-2 ${overviewData.today.revenue.changePercent >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                      {overviewData.today.revenue.changePercent >= 0 ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">
                        {overviewData.today.revenue.changePercent >= 0 ? '+' : ''}{overviewData.today.revenue.changePercent}% จากเมื่อวาน
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm mb-1">รายการชำระเงิน</p>
                    <p className="text-3xl font-bold">{overviewData.today.revenue.paymentsCount}</p>
                    <p className="text-blue-200 text-sm mt-1">รายการ</p>
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm mb-1">ออเดอร์ใหม่</p>
                    <p className="text-3xl font-bold">{overviewData.today.orders.today}</p>
                    <div className={`flex items-center gap-1 mt-2 ${overviewData.today.orders.changePercent >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                      {overviewData.today.orders.changePercent >= 0 ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      <span className="text-sm">{overviewData.today.orders.changePercent >= 0 ? '+' : ''}{overviewData.today.orders.changePercent}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm mb-1">รอยืนยันชำระ</p>
                    <p className="text-3xl font-bold">{overviewData.today.pendingPayments.count}</p>
                    <p className="text-blue-200 text-sm mt-1">
                      {formatCurrency(overviewData.today.pendingPayments.totalBaht)}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Revenue Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  subValue={`${overviewData.revenue.thisMonth.growthPercent >= 0 ? '+' : ''}${overviewData.revenue.thisMonth.growthPercent}% จากเดือนก่อน`}
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
                  subValue={`${overviewData.revenue.pending.count} รายการรอยืนยัน`}
                  icon={Clock}
                  color="yellow"
                />
              </div>

              {/* Dashboard Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="ออเดอร์ทั้งหมด"
                  value={overviewData.dashboard.stats.totalOrders.value.toString()}
                  subValue={`เดือนนี้ ${overviewData.dashboard.stats.totalOrders.thisMonth} ออเดอร์`}
                  icon={Package}
                  color="indigo"
                />
                <StatCard
                  title="กำลังจัดส่ง"
                  value={overviewData.dashboard.stats.activeShipments.value.toString()}
                  subValue={`Processing: ${overviewData.dashboard.stats.activeShipments.processing}, Shipped: ${overviewData.dashboard.stats.activeShipments.shipped}`}
                  icon={Ship}
                  color="cyan"
                />
                <StatCard
                  title="ลูกค้าทั้งหมด"
                  value={overviewData.dashboard.stats.totalCustomers.value.toString()}
                  subValue={`VIP/Premium: ${overviewData.dashboard.stats.totalCustomers.vipCount} ราย`}
                  icon={Users}
                  color="pink"
                />
                <StatCard
                  title="สินค้าในระบบ"
                  value={overviewData.dashboard.stats.totalOrderItems.value.toString()}
                  subValue={`เดือนนี้ ${overviewData.dashboard.stats.totalOrderItems.thisMonth} รายการ`}
                  icon={Banknote}
                  color="orange"
                />
              </div>

              {/* Chart and Order Status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Simple Bar Chart */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    ยอดขาย 30 วันล่าสุด
                  </h3>
                  {chartLoading ? (
                    <div className="h-48 flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : chartData?.chartData ? (
                    <div className="h-48 flex items-end gap-1">
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
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                              {formatCurrency(day.totalBaht)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-48 flex items-center justify-center text-gray-400">
                      ไม่มีข้อมูล
                    </div>
                  )}
                  {chartData && (
                    <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                      <span className="text-gray-500">รวม 30 วัน</span>
                      <span className="font-bold text-blue-600">{formatCurrency(chartData.totals.totalBaht)}</span>
                    </div>
                  )}
                </div>

                {/* Order Status Distribution */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-green-600" />
                    สถานะออเดอร์
                  </h3>
                  <div className="space-y-3">
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
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">{status.label}</span>
                            <span className="font-medium">{count} ({percent.toFixed(0)}%)</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
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
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  ออเดอร์ล่าสุด
                </h3>
                <div className="overflow-x-auto">
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
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Daily Tab */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Date Range Filter */}
          <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <span className="text-gray-400">ถึง</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={() => refetchTransactions()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              ค้นหา
            </button>
          </div>

          {transactionsLoading ? (
            <LoadingSpinner />
          ) : transactionsData ? (
            <>
              {/* Daily Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div className="p-4 border-b bg-gray-50">
                  <h3 className="font-bold text-gray-900">สรุปรายวัน</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-500 bg-gray-50 border-b">
                        <th className="px-4 py-3 font-medium">วันที่</th>
                        <th className="px-4 py-3 font-medium text-right">ยอดยืนยัน (฿)</th>
                        <th className="px-4 py-3 font-medium text-right">ยอดยืนยัน (¥)</th>
                        <th className="px-4 py-3 font-medium text-right">จำนวน</th>
                        <th className="px-4 py-3 font-medium text-right">รอยืนยัน (฿)</th>
                        <th className="px-4 py-3 font-medium text-right">รอยืนยัน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {transactionsData.dailySummaries.map((day: any) => (
                        <tr key={day.date} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{formatDate(day.date)}</td>
                          <td className="px-4 py-3 text-right text-green-600 font-medium">
                            {formatCurrency(day.verifiedBaht)}
                          </td>
                          <td className="px-4 py-3 text-right text-indigo-600">
                            {formatCurrency(day.verifiedYen, 'JPY')}
                          </td>
                          <td className="px-4 py-3 text-right">{day.verifiedCount}</td>
                          <td className="px-4 py-3 text-right text-yellow-600">
                            {day.pendingBaht > 0 ? formatCurrency(day.pendingBaht) : '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-yellow-600">
                            {day.pendingCount > 0 ? day.pendingCount : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2">
                      <tr className="font-bold">
                        <td className="px-4 py-3">รวมทั้งหมด</td>
                        <td className="px-4 py-3 text-right text-green-600">
                          {formatCurrency(transactionsData.totals.verifiedBaht)}
                        </td>
                        <td className="px-4 py-3 text-right text-indigo-600">
                          {formatCurrency(transactionsData.totals.verifiedYen, 'JPY')}
                        </td>
                        <td className="px-4 py-3 text-right">{transactionsData.totals.verifiedCount}</td>
                        <td className="px-4 py-3 text-right" colSpan={2}></td>
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
        <div className="space-y-6">
          {/* Month Selector */}
          <div className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold">
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
              <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-6 text-white shadow-xl">
                <h3 className="text-lg font-medium mb-4 text-green-100">สรุปประจำเดือน {monthlyData.period.monthName}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-green-200 text-sm">รายได้รวม</p>
                    <p className="text-3xl font-bold mt-1">{formatCurrency(monthlyData.summary.totalRevenueBaht)}</p>
                    <div className={`flex items-center gap-1 mt-2 ${monthlyData.summary.growthPercent >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                      {monthlyData.summary.growthPercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="text-sm">{monthlyData.summary.growthPercent >= 0 ? '+' : ''}{monthlyData.summary.growthPercent}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-green-200 text-sm">จำนวนรายการ</p>
                    <p className="text-3xl font-bold mt-1">{monthlyData.summary.transactionCount}</p>
                    <p className="text-green-200 text-sm mt-2">รายการ</p>
                  </div>
                  <div>
                    <p className="text-green-200 text-sm">ออเดอร์ใหม่</p>
                    <p className="text-3xl font-bold mt-1">{monthlyData.summary.newOrders}</p>
                    <p className="text-green-200 text-sm mt-2">ออเดอร์</p>
                  </div>
                  <div>
                    <p className="text-green-200 text-sm">ลูกค้าใหม่</p>
                    <p className="text-3xl font-bold mt-1">{monthlyData.summary.newCustomers}</p>
                    <p className="text-green-200 text-sm mt-2">ราย</p>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

              {/* Daily Breakdown & Top Customers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Breakdown */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">รายได้รายวัน</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-white">
                        <tr className="text-left text-sm text-gray-500 border-b">
                          <th className="px-4 py-2 font-medium">วัน</th>
                          <th className="px-4 py-2 font-medium text-right">ยอด (฿)</th>
                          <th className="px-4 py-2 font-medium text-right">รายการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {monthlyData.dailyBreakdown.map((day: any) => (
                          <tr key={day.date} className={`hover:bg-gray-50 ${day.totalBaht > 0 ? '' : 'text-gray-400'}`}>
                            <td className="px-4 py-2">
                              <span className="font-medium">{day.day}</span>
                              <span className="text-gray-400 text-sm ml-2">{day.dayOfWeek}</span>
                            </td>
                            <td className="px-4 py-2 text-right font-medium text-green-600">
                              {day.totalBaht > 0 ? formatCurrency(day.totalBaht) : '-'}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {day.count > 0 ? day.count : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Customers */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b bg-gray-50">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <Crown className="w-5 h-5 text-yellow-500" />
                      ลูกค้ายอดซื้อสูงสุด
                    </h3>
                  </div>
                  <div className="divide-y">
                    {monthlyData.topCustomers.map((customer: any, idx: number) => (
                      <div key={customer.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                            idx === 1 ? 'bg-gray-100 text-gray-700' :
                            idx === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-50 text-gray-500'
                          }`}>
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getTierColor(customer.tier)}`}>
                                {customer.tier.toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-500">{customer.transactionCount} รายการ</span>
                            </div>
                          </div>
                        </div>
                        <p className="font-bold text-green-600">{formatCurrency(customer.totalBaht)}</p>
                      </div>
                    ))}
                    {monthlyData.topCustomers.length === 0 && (
                      <div className="p-8 text-center text-gray-400">
                        ไม่มีข้อมูล
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Revenue by Tier */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">รายได้แยกตามระดับลูกค้า</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {monthlyData.revenueByTier.map((tier: any) => (
                    <div key={tier.tier} className={`p-4 rounded-xl ${
                      tier.tier === 'vip' ? 'bg-yellow-50' :
                      tier.tier === 'premium' ? 'bg-purple-50' :
                      tier.tier === 'wholesale' ? 'bg-blue-50' :
                      'bg-gray-50'
                    }`}>
                      <p className="text-sm text-gray-600 mb-1">{tier.tier.toUpperCase()}</p>
                      <p className="text-xl font-bold">{formatCurrency(tier.totalBaht)}</p>
                      <p className="text-sm text-gray-500">{tier.count} รายการ</p>
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
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <span className="text-gray-400">ถึง</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value as any)}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">ทั้งหมด</option>
                <option value="verified">ยืนยันแล้ว</option>
                <option value="pending">รอยืนยัน</option>
              </select>
            </div>
            <button
              onClick={() => refetchTransactions()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              ค้นหา
            </button>
          </div>

          {transactionsLoading ? (
            <LoadingSpinner />
          ) : transactionsData ? (
            <>
              {/* Summary */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-indigo-200">Statement รายการเงิน</h3>
                  <span className="text-indigo-200 text-sm">
                    {formatDate(transactionsData.period.start)} - {formatDate(transactionsData.period.end)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-indigo-200 text-sm">ยอดรับรวม</p>
                    <p className="text-3xl font-bold mt-1">{formatCurrency(transactionsData.totals.verifiedBaht)}</p>
                  </div>
                  <div>
                    <p className="text-indigo-200 text-sm">รายการทั้งหมด</p>
                    <p className="text-3xl font-bold mt-1">{transactionsData.totals.totalTransactions}</p>
                  </div>
                  <div>
                    <p className="text-indigo-200 text-sm">ยืนยันแล้ว</p>
                    <p className="text-3xl font-bold mt-1">{transactionsData.totals.verifiedCount}</p>
                  </div>
                </div>
              </div>

              {/* Transaction List - Bank Statement Style */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">รายการเคลื่อนไหว</h3>
                  <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                    <Download className="w-4 h-4" />
                    ดาวน์โหลด
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 bg-gray-50 border-b">
                        <th className="px-4 py-3 font-medium">วันที่/เวลา</th>
                        <th className="px-4 py-3 font-medium">รายละเอียด</th>
                        <th className="px-4 py-3 font-medium">ลูกค้า</th>
                        <th className="px-4 py-3 font-medium">อ้างอิง</th>
                        <th className="px-4 py-3 font-medium text-right">จำนวน (฿)</th>
                        <th className="px-4 py-3 font-medium text-right">ยอดสะสม</th>
                        <th className="px-4 py-3 font-medium text-center">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {transactionsData.transactions.map((tx: any) => (
                        <tr key={tx.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="text-gray-900">{formatDateTime(tx.date)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900 truncate max-w-xs" title={tx.description}>
                              {tx.description}
                            </div>
                            {tx.trackingNumber && (
                              <div className="text-xs text-gray-500">#{tx.trackingNumber}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span>{tx.customer.name}</span>
                              {tx.customer.tier !== 'member' && (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${getTierColor(tx.customer.tier)}`}>
                                  {tx.customer.tier}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-blue-600 font-mono text-xs">
                            {tx.reference}
                          </td>
                          <td className={`px-4 py-3 text-right font-medium ${tx.status === 'verified' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {tx.status === 'verified' ? '+' : ''}{formatCurrency(tx.amountBaht)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            {tx.status === 'verified' ? formatCurrency(tx.runningBalance) : '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {tx.status === 'verified' ? (
                              <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs">
                                <CheckCircle className="w-3 h-3" />
                                ยืนยัน
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full text-xs">
                                <Clock className="w-3 h-3" />
                                รอยืนยัน
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {transactionsData.transactions.length === 0 && (
                  <div className="p-12 text-center text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-3" />
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
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-500 text-sm">{title}</span>
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subValue && (
        <p className={`text-sm mt-1 flex items-center gap-1 ${
          trend !== undefined ? (trend >= 0 ? 'text-green-600' : 'text-red-600') : 'text-gray-500'
        }`}>
          {trend !== undefined && (
            trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />
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
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

export default AdminStatisticsPage;
