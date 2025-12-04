import express from 'express';
import prisma from '../lib/prisma';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();

// GET /api/v1/statistics/dashboard - Get real dashboard statistics
router.get('/dashboard', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    // Get current date info
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Run all queries in parallel for performance
    const [
      totalOrders,
      ordersThisMonth,
      ordersLastMonth,
      activeShipments,
      deliveredThisMonth,
      deliveredLastMonth,
      totalCustomers,
      customersThisMonth,
      customersLastMonth,
      totalOrderItems,
      orderItemsThisMonth,
      recentOrders,
      ordersByStatus,
      vipCustomers,
      pendingPayments,
    ] = await Promise.all([
      // Total orders
      prisma.order.count(),

      // Orders this month
      prisma.order.count({
        where: {
          createdAt: { gte: startOfMonth },
        },
      }),

      // Orders last month
      prisma.order.count({
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
      }),

      // Active shipments (processing or shipped)
      prisma.order.count({
        where: {
          status: { in: ['processing', 'shipped'] },
        },
      }),

      // Delivered this month
      prisma.order.count({
        where: {
          status: 'delivered',
          updatedAt: { gte: startOfMonth },
        },
      }),

      // Delivered last month
      prisma.order.count({
        where: {
          status: 'delivered',
          updatedAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
      }),

      // Total customers
      prisma.customer.count(),

      // Customers this month
      prisma.customer.count({
        where: {
          createdAt: { gte: startOfMonth },
        },
      }),

      // Customers last month
      prisma.customer.count({
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
      }),

      // Total order items
      prisma.orderItem.count(),

      // Order items this month
      prisma.orderItem.count({
        where: {
          createdAt: { gte: startOfMonth },
        },
      }),

      // Recent orders (last 10)
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              companyName: true,
              contactPerson: true,
              tier: true,
            },
          },
          _count: {
            select: { orderItems: true },
          },
        },
      }),

      // Orders by status
      prisma.order.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // VIP customers count
      prisma.customer.count({
        where: {
          tier: { in: ['vip', 'premium'] },
        },
      }),

      // Pending payments count
      prisma.payment.count({
        where: {
          status: 'pending',
        },
      }),
    ]);

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const change = ((current - previous) / previous) * 100;
      return change >= 0 ? `+${change.toFixed(0)}%` : `${change.toFixed(0)}%`;
    };

    // Format orders by status
    const statusCounts = ordersByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      data: {
        // Main stats
        stats: {
          totalOrders: {
            value: totalOrders,
            change: calculateChange(ordersThisMonth, ordersLastMonth),
            thisMonth: ordersThisMonth,
          },
          activeShipments: {
            value: activeShipments,
            processing: statusCounts['processing'] || 0,
            shipped: statusCounts['shipped'] || 0,
          },
          deliveredThisMonth: {
            value: deliveredThisMonth,
            change: calculateChange(deliveredThisMonth, deliveredLastMonth),
          },
          totalCustomers: {
            value: totalCustomers,
            change: calculateChange(customersThisMonth, customersLastMonth),
            vipCount: vipCustomers,
          },
          totalOrderItems: {
            value: totalOrderItems,
            thisMonth: orderItemsThisMonth,
          },
          pendingPayments: {
            value: pendingPayments,
          },
        },

        // Orders by status breakdown
        ordersByStatus: {
          pending: statusCounts['pending'] || 0,
          processing: statusCounts['processing'] || 0,
          shipped: statusCounts['shipped'] || 0,
          delivered: statusCounts['delivered'] || 0,
          cancelled: statusCounts['cancelled'] || 0,
        },

        // Recent orders
        recentOrders: recentOrders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customer: order.customer?.companyName || order.customer?.contactPerson || 'ไม่ระบุ',
          customerTier: order.customer?.tier || 'regular',
          status: order.status,
          itemCount: order._count.orderItems,
          shippingMethod: order.shippingMethod,
          createdAt: order.createdAt,
        })),

        // Metadata
        generatedAt: new Date().toISOString(),
        period: {
          currentMonth: startOfMonth.toISOString(),
          lastMonth: startOfLastMonth.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch dashboard statistics',
      },
    });
  }
});

// GET /api/v1/statistics/sales-chart - Get sales data for charts
router.get('/sales-chart', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { period = '30d' } = req.query; // 7d, 30d, 90d, 1y, all

    const now = new Date();
    let startDate: Date;
    let groupFormat: 'day' | 'week' | 'month' = 'day';

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupFormat = 'day';
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupFormat = 'day';
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        groupFormat = 'week';
        break;
      case '1y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        groupFormat = 'month';
        break;
      case 'all':
        startDate = new Date(2020, 0, 1);
        groupFormat = 'month';
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get all verified payments in the period
    const payments = await prisma.payment.findMany({
      where: {
        verifiedAt: {
          gte: startDate,
        },
        status: 'verified',
      },
      select: {
        amountBaht: true,
        amountYen: true,
        verifiedAt: true,
        paidAt: true,
        orderItem: {
          select: {
            order: {
              select: {
                customer: {
                  select: {
                    tier: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        verifiedAt: 'asc',
      },
    });

    // Group by date
    const salesByDate: Record<string, { date: string; totalBaht: number; totalYen: number; count: number }> = {};

    for (const payment of payments) {
      const date = payment.verifiedAt || payment.paidAt || new Date();
      let key: string;

      if (groupFormat === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupFormat === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!salesByDate[key]) {
        salesByDate[key] = { date: key, totalBaht: 0, totalYen: 0, count: 0 };
      }

      salesByDate[key].totalBaht += Number(payment.amountBaht || 0);
      salesByDate[key].totalYen += Number(payment.amountYen || 0);
      salesByDate[key].count += 1;
    }

    // Fill in missing dates with zeros
    const chartData: Array<{ date: string; totalBaht: number; totalYen: number; count: number }> = [];
    const current = new Date(startDate);

    while (current <= now) {
      let key: string;

      if (groupFormat === 'day') {
        key = current.toISOString().split('T')[0];
        current.setDate(current.getDate() + 1);
      } else if (groupFormat === 'week') {
        const weekStart = new Date(current);
        weekStart.setDate(current.getDate() - current.getDay());
        key = weekStart.toISOString().split('T')[0];
        current.setDate(current.getDate() + 7);
      } else {
        key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        current.setMonth(current.getMonth() + 1);
      }

      if (!chartData.find(d => d.date === key)) {
        chartData.push(salesByDate[key] || { date: key, totalBaht: 0, totalYen: 0, count: 0 });
      }
    }

    // Calculate totals
    const totals = chartData.reduce(
      (acc, day) => ({
        totalBaht: acc.totalBaht + day.totalBaht,
        totalYen: acc.totalYen + day.totalYen,
        totalCount: acc.totalCount + day.count,
      }),
      { totalBaht: 0, totalYen: 0, totalCount: 0 }
    );

    res.json({
      success: true,
      data: {
        chartData: chartData.sort((a, b) => a.date.localeCompare(b.date)),
        totals,
        period,
        groupFormat,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching sales chart:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch sales chart data',
      },
    });
  }
});

// GET /api/v1/statistics/today-summary - Today's detailed summary
router.get('/today-summary', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

    const [
      todayPayments,
      yesterdayPayments,
      todayOrders,
      yesterdayOrders,
      todayNewCustomers,
      todayPendingPayments,
    ] = await Promise.all([
      // Today's verified payments
      prisma.payment.aggregate({
        where: {
          verifiedAt: { gte: startOfToday },
          status: 'verified',
        },
        _sum: {
          amountBaht: true,
          amountYen: true,
        },
        _count: true,
      }),

      // Yesterday's verified payments
      prisma.payment.aggregate({
        where: {
          verifiedAt: {
            gte: startOfYesterday,
            lt: startOfToday,
          },
          status: 'verified',
        },
        _sum: {
          amountBaht: true,
        },
        _count: true,
      }),

      // Today's orders
      prisma.order.count({
        where: {
          createdAt: { gte: startOfToday },
        },
      }),

      // Yesterday's orders
      prisma.order.count({
        where: {
          createdAt: {
            gte: startOfYesterday,
            lt: startOfToday,
          },
        },
      }),

      // Today's new customers
      prisma.customer.count({
        where: {
          createdAt: { gte: startOfToday },
        },
      }),

      // Today's pending payments (submitted but not verified)
      prisma.payment.aggregate({
        where: {
          paidAt: { gte: startOfToday },
          status: 'pending',
        },
        _sum: {
          amountBaht: true,
        },
        _count: true,
      }),
    ]);

    const todayBaht = Number(todayPayments._sum.amountBaht || 0);
    const yesterdayBaht = Number(yesterdayPayments._sum.amountBaht || 0);
    const changePercent = yesterdayBaht === 0
      ? (todayBaht > 0 ? 100 : 0)
      : ((todayBaht - yesterdayBaht) / yesterdayBaht) * 100;

    res.json({
      success: true,
      data: {
        revenue: {
          todayBaht,
          todayYen: Number(todayPayments._sum.amountYen || 0),
          yesterdayBaht,
          changePercent: Math.round(changePercent * 10) / 10,
          paymentsCount: todayPayments._count,
        },
        orders: {
          today: todayOrders,
          yesterday: yesterdayOrders,
          changePercent: yesterdayOrders === 0
            ? (todayOrders > 0 ? 100 : 0)
            : Math.round(((todayOrders - yesterdayOrders) / yesterdayOrders) * 100),
        },
        newCustomers: todayNewCustomers,
        pendingPayments: {
          count: todayPendingPayments._count,
          totalBaht: Number(todayPendingPayments._sum.amountBaht || 0),
        },
        date: startOfToday.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching today summary:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch today summary',
      },
    });
  }
});

// GET /api/v1/statistics/pending-payments-detail - Detailed pending payments
router.get('/pending-payments-detail', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: 'pending',
      },
      include: {
        orderItem: {
          select: {
            productName: true,
            trackingNumber: true,
            order: {
              select: {
                orderNumber: true,
                customer: {
                  select: {
                    id: true,
                    companyName: true,
                    contactPerson: true,
                    tier: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        paidAt: 'desc',
      },
    });

    const groupedByCustomer: Record<string, {
      customer: {
        id: string;
        name: string;
        tier: string;
      };
      totalBaht: number;
      totalYen: number;
      payments: Array<{
        id: string;
        orderNumber: string;
        productName: string | null;
        amountBaht: number;
        amountYen: number;
        paidAt: Date | null;
        proofImageUrl: string | null;
      }>;
    }> = {};

    for (const payment of pendingPayments) {
      const customerId = payment.orderItem.order.customer?.id || 'unknown';
      const customerName = payment.orderItem.order.customer?.companyName
        || payment.orderItem.order.customer?.contactPerson
        || 'ไม่ระบุ';

      if (!groupedByCustomer[customerId]) {
        groupedByCustomer[customerId] = {
          customer: {
            id: customerId,
            name: customerName,
            tier: payment.orderItem.order.customer?.tier || 'member',
          },
          totalBaht: 0,
          totalYen: 0,
          payments: [],
        };
      }

      groupedByCustomer[customerId].totalBaht += Number(payment.amountBaht || 0);
      groupedByCustomer[customerId].totalYen += Number(payment.amountYen || 0);
      groupedByCustomer[customerId].payments.push({
        id: payment.id,
        orderNumber: payment.orderItem.order.orderNumber,
        productName: payment.orderItem.productName,
        amountBaht: Number(payment.amountBaht || 0),
        amountYen: Number(payment.amountYen || 0),
        paidAt: payment.paidAt,
        proofImageUrl: payment.proofImageUrl,
      });
    }

    const totals = {
      totalBaht: pendingPayments.reduce((sum, p) => sum + Number(p.amountBaht || 0), 0),
      totalYen: pendingPayments.reduce((sum, p) => sum + Number(p.amountYen || 0), 0),
      count: pendingPayments.length,
      customerCount: Object.keys(groupedByCustomer).length,
    };

    res.json({
      success: true,
      data: {
        byCustomer: Object.values(groupedByCustomer).sort((a, b) => b.totalBaht - a.totalBaht),
        totals,
      },
    });
  } catch (error) {
    console.error('Error fetching pending payments detail:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch pending payments detail',
      },
    });
  }
});

// GET /api/v1/statistics/revenue-overview - Revenue overview for different periods
router.get('/revenue-overview', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const now = new Date();

    // Calculate period boundaries
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      todayRevenue,
      weekRevenue,
      monthRevenue,
      yearRevenue,
      lastMonthRevenue,
      allTimeRevenue,
      pendingTotal,
    ] = await Promise.all([
      // Today
      prisma.payment.aggregate({
        where: { verifiedAt: { gte: startOfToday }, status: 'verified' },
        _sum: { amountBaht: true, amountYen: true },
        _count: true,
      }),

      // This week
      prisma.payment.aggregate({
        where: { verifiedAt: { gte: startOfWeek }, status: 'verified' },
        _sum: { amountBaht: true, amountYen: true },
        _count: true,
      }),

      // This month
      prisma.payment.aggregate({
        where: { verifiedAt: { gte: startOfMonth }, status: 'verified' },
        _sum: { amountBaht: true, amountYen: true },
        _count: true,
      }),

      // This year
      prisma.payment.aggregate({
        where: { verifiedAt: { gte: startOfYear }, status: 'verified' },
        _sum: { amountBaht: true, amountYen: true },
        _count: true,
      }),

      // Last month
      prisma.payment.aggregate({
        where: {
          verifiedAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          status: 'verified',
        },
        _sum: { amountBaht: true },
        _count: true,
      }),

      // All time
      prisma.payment.aggregate({
        where: { status: 'verified' },
        _sum: { amountBaht: true, amountYen: true },
        _count: true,
      }),

      // Total pending
      prisma.payment.aggregate({
        where: { status: 'pending' },
        _sum: { amountBaht: true, amountYen: true },
        _count: true,
      }),
    ]);

    const monthBaht = Number(monthRevenue._sum.amountBaht || 0);
    const lastMonthBaht = Number(lastMonthRevenue._sum.amountBaht || 0);
    const monthGrowth = lastMonthBaht === 0
      ? (monthBaht > 0 ? 100 : 0)
      : ((monthBaht - lastMonthBaht) / lastMonthBaht) * 100;

    res.json({
      success: true,
      data: {
        today: {
          baht: Number(todayRevenue._sum.amountBaht || 0),
          yen: Number(todayRevenue._sum.amountYen || 0),
          count: todayRevenue._count,
        },
        thisWeek: {
          baht: Number(weekRevenue._sum.amountBaht || 0),
          yen: Number(weekRevenue._sum.amountYen || 0),
          count: weekRevenue._count,
        },
        thisMonth: {
          baht: monthBaht,
          yen: Number(monthRevenue._sum.amountYen || 0),
          count: monthRevenue._count,
          growthPercent: Math.round(monthGrowth * 10) / 10,
        },
        thisYear: {
          baht: Number(yearRevenue._sum.amountBaht || 0),
          yen: Number(yearRevenue._sum.amountYen || 0),
          count: yearRevenue._count,
        },
        allTime: {
          baht: Number(allTimeRevenue._sum.amountBaht || 0),
          yen: Number(allTimeRevenue._sum.amountYen || 0),
          count: allTimeRevenue._count,
        },
        pending: {
          baht: Number(pendingTotal._sum.amountBaht || 0),
          yen: Number(pendingTotal._sum.amountYen || 0),
          count: pendingTotal._count,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching revenue overview:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch revenue overview',
      },
    });
  }
});

// GET /api/v1/statistics/tier-distribution - Customer tier distribution
router.get('/tier-distribution', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const [tierCounts, tierRevenue] = await Promise.all([
      // Count customers by tier
      prisma.customer.groupBy({
        by: ['tier'],
        _count: { tier: true },
        _sum: { totalSpent: true },
      }),

      // Get revenue by customer tier
      prisma.$queryRaw<Array<{ tier: string; total_revenue: number }>>`
        SELECT
          c.tier,
          COALESCE(SUM(p.amount_baht), 0)::numeric as total_revenue
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.id
        LEFT JOIN order_items oi ON oi.order_id = o.id
        LEFT JOIN payments p ON p.order_item_id = oi.id AND p.status = 'verified'
        GROUP BY c.tier
      `,
    ]);

    const revenueMap = new Map(tierRevenue.map(r => [r.tier, Number(r.total_revenue || 0)]));

    const distribution = tierCounts.map(item => ({
      tier: item.tier || 'member',
      customerCount: item._count.tier,
      totalSpent: Number(item._sum.totalSpent || 0),
      revenue: revenueMap.get(item.tier || 'member') || 0,
    }));

    res.json({
      success: true,
      data: {
        distribution,
        totals: {
          customers: distribution.reduce((sum, d) => sum + d.customerCount, 0),
          totalSpent: distribution.reduce((sum, d) => sum + d.totalSpent, 0),
          revenue: distribution.reduce((sum, d) => sum + d.revenue, 0),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching tier distribution:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch tier distribution',
      },
    });
  }
});

// GET /api/v1/statistics/order-items-summary - Order items by status step
router.get('/order-items-summary', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const statusStepCounts = await prisma.orderItem.groupBy({
      by: ['statusStep'],
      _count: { statusStep: true },
    });

    const STATUS_NAMES: Record<number, string> = {
      1: 'รับออเดอร์',
      2: 'ชำระเงินงวดแรก',
      3: 'สั่งซื้อจาก JP',
      4: 'ของถึงโกดัง JP',
      5: 'จัดรอบส่งกลับ',
      6: 'ส่งออกจาก JP',
      7: 'ของถึงไทย',
      8: 'กำลังจัดส่ง',
      9: 'ส่งมอบสำเร็จ',
    };

    const summary = statusStepCounts.map((item) => ({
      step: item.statusStep,
      name: STATUS_NAMES[item.statusStep] || `สถานะ ${item.statusStep}`,
      count: item._count.statusStep,
    }));

    // Fill in missing steps with 0 (9 steps)
    const fullSummary = Array.from({ length: 9 }, (_, i) => {
      const step = i + 1;
      const existing = summary.find((s) => s.step === step);
      return existing || { step, name: STATUS_NAMES[step], count: 0 };
    });

    res.json({
      success: true,
      data: fullSummary,
    });
  } catch (error) {
    console.error('Error fetching order items summary:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch order items summary',
      },
    });
  }
});

// GET /api/v1/statistics/shipments - Comprehensive shipments statistics
router.get('/shipments', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Run all queries in parallel
    const [
      ordersByStatus,
      ordersByShippingMethod,
      ordersByStatusStep,
      pendingOrdersWithAge,
      upcomingDeliveries,
      recentStatusChanges,
      shipmentsTimeline,
      orderItemsByStep,
    ] = await Promise.all([
      // Orders by status
      prisma.order.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Orders by shipping method
      prisma.order.groupBy({
        by: ['shippingMethod'],
        _count: { shippingMethod: true },
        where: {
          status: { notIn: ['cancelled', 'delivered'] },
        },
      }),

      // Orders by status step
      prisma.order.groupBy({
        by: ['statusStep'],
        _count: { statusStep: true },
        where: {
          status: { notIn: ['cancelled', 'delivered'] },
        },
      }),

      // Pending orders with age calculation
      prisma.order.findMany({
        where: {
          status: { in: ['pending', 'processing'] },
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          statusStep: true,
          shippingMethod: true,
          createdAt: true,
          customer: {
            select: {
              companyName: true,
              contactPerson: true,
              tier: true,
            },
          },
          _count: {
            select: { orderItems: true },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: 20,
      }),

      // Upcoming deliveries (estimated delivery within 7 days)
      prisma.order.findMany({
        where: {
          status: { in: ['shipped', 'processing'] },
          estimatedDelivery: {
            gte: startOfToday,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          shippingMethod: true,
          estimatedDelivery: true,
          customer: {
            select: {
              companyName: true,
              contactPerson: true,
            },
          },
        },
        orderBy: { estimatedDelivery: 'asc' },
        take: 10,
      }),

      // Recent status changes (orders updated in last 7 days)
      prisma.order.findMany({
        where: {
          updatedAt: {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          statusStep: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 15,
      }),

      // Shipments timeline (last 30 days) - count by date and status
      prisma.$queryRaw<Array<{ date: string; status: string; count: bigint }>>`
        SELECT
          DATE(created_at)::text as date,
          status,
          COUNT(*)::bigint as count
        FROM orders
        WHERE created_at >= ${new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)}
        GROUP BY DATE(created_at), status
        ORDER BY date ASC
      `,

      // Order items by status step (for detailed workflow)
      prisma.orderItem.groupBy({
        by: ['statusStep'],
        _count: { statusStep: true },
      }),
    ]);

    // Process orders by status
    const statusCounts = ordersByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    // Process shipping method
    const shippingMethodCounts = ordersByShippingMethod.reduce((acc, item) => {
      acc[item.shippingMethod] = item._count.shippingMethod;
      return acc;
    }, {} as Record<string, number>);

    // Process pending orders by age
    const pendingByAge = {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      older: 0,
    };

    const pendingOrdersList = pendingOrdersWithAge.map((order) => {
      const ageInDays = Math.floor(
        (now.getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (ageInDays === 0) pendingByAge.today++;
      else if (ageInDays <= 7) pendingByAge.thisWeek++;
      else if (ageInDays <= 30) pendingByAge.thisMonth++;
      else pendingByAge.older++;

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.customer?.companyName || order.customer?.contactPerson || 'ไม่ระบุ',
        customerTier: order.customer?.tier || 'member',
        status: order.status,
        statusStep: order.statusStep,
        shippingMethod: order.shippingMethod,
        itemCount: order._count.orderItems,
        ageInDays,
        createdAt: order.createdAt,
      };
    });

    // Process status step counts (9 steps)
    const STATUS_STEP_NAMES: Record<number, string> = {
      1: 'รับออเดอร์',
      2: 'ชำระเงินงวดแรก',
      3: 'สั่งซื้อจาก JP',
      4: 'ของถึงโกดัง JP',
      5: 'จัดรอบส่งกลับ',
      6: 'ส่งออกจาก JP',
      7: 'ของถึงไทย',
      8: 'กำลังจัดส่ง',
      9: 'ส่งมอบสำเร็จ',
    };

    const workflowProgress = Array.from({ length: 9 }, (_, i) => {
      const step = i + 1;
      const orderCount = ordersByStatusStep.find((s) => s.statusStep === step)?._count.statusStep || 0;
      const itemCount = orderItemsByStep.find((s) => s.statusStep === step)?._count.statusStep || 0;
      return {
        step,
        name: STATUS_STEP_NAMES[step],
        orderCount,
        itemCount,
      };
    });

    // Process timeline data
    const timelineMap = new Map<string, Record<string, number>>();
    for (const row of shipmentsTimeline) {
      if (!timelineMap.has(row.date)) {
        timelineMap.set(row.date, { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0, total: 0 });
      }
      const dateData = timelineMap.get(row.date)!;
      dateData[row.status] = Number(row.count);
      dateData.total += Number(row.count);
    }

    // Fill missing dates
    const timelineData: Array<{ date: string; pending: number; processing: number; shipped: number; delivered: number; total: number }> = [];
    const current = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    while (current <= now) {
      const dateKey = current.toISOString().split('T')[0];
      const existing = timelineMap.get(dateKey);
      timelineData.push({
        date: dateKey,
        pending: existing?.pending || 0,
        processing: existing?.processing || 0,
        shipped: existing?.shipped || 0,
        delivered: existing?.delivered || 0,
        total: existing?.total || 0,
      });
      current.setDate(current.getDate() + 1);
    }

    // Calculate summary stats
    const totalPending = (statusCounts['pending'] || 0) + (statusCounts['processing'] || 0);
    const totalShipped = statusCounts['shipped'] || 0;
    const totalDelivered = statusCounts['delivered'] || 0;
    const totalActive = totalPending + totalShipped;

    res.json({
      success: true,
      data: {
        summary: {
          totalPending,
          totalShipped,
          totalDelivered,
          totalActive,
          totalCancelled: statusCounts['cancelled'] || 0,
        },
        statusDistribution: {
          pending: statusCounts['pending'] || 0,
          processing: statusCounts['processing'] || 0,
          shipped: statusCounts['shipped'] || 0,
          delivered: statusCounts['delivered'] || 0,
          cancelled: statusCounts['cancelled'] || 0,
        },
        shippingMethodDistribution: {
          sea: shippingMethodCounts['sea'] || 0,
          air: shippingMethodCounts['air'] || 0,
        },
        pendingByAge,
        pendingOrders: pendingOrdersList,
        workflowProgress,
        upcomingDeliveries: upcomingDeliveries.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customer: order.customer?.companyName || order.customer?.contactPerson || 'ไม่ระบุ',
          status: order.status,
          shippingMethod: order.shippingMethod,
          estimatedDelivery: order.estimatedDelivery,
        })),
        recentActivity: recentStatusChanges.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          statusStep: order.statusStep,
          updatedAt: order.updatedAt,
        })),
        timeline: timelineData,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching shipments statistics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch shipments statistics',
      },
    });
  }
});

// GET /api/v1/statistics/tracking-orders - All order items for tracking
router.get('/tracking-orders', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { page = '1', limit = '20', search, statusStep } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const whereClause: any = {};

    if (statusStep && statusStep !== 'all') {
      whereClause.statusStep = parseInt(statusStep as string);
    }

    if (search) {
      whereClause.OR = [
        { trackingCode: { contains: search as string, mode: 'insensitive' } },
        { productCode: { contains: search as string, mode: 'insensitive' } },
        { productName: { contains: search as string, mode: 'insensitive' } },
        { trackingNumberJP: { contains: search as string, mode: 'insensitive' } },
        { trackingNumberTH: { contains: search as string, mode: 'insensitive' } },
        { order: { orderNumber: { contains: search as string, mode: 'insensitive' } } },
        { order: { customer: { companyName: { contains: search as string, mode: 'insensitive' } } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.orderItem.findMany({
        where: whereClause,
        select: {
          id: true,
          trackingCode: true,
          productCode: true,
          productName: true,
          priceYen: true,
          priceBaht: true,
          statusStep: true,
          trackingNumberJP: true,
          trackingNumberTH: true,
          createdAt: true,
          updatedAt: true,
          order: {
            select: {
              id: true,
              orderNumber: true,
              shippingMethod: true,
              customer: {
                select: {
                  id: true,
                  companyName: true,
                  contactPerson: true,
                  tier: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.orderItem.count({ where: whereClause }),
    ]);

    // Status step names
    const STATUS_STEP_NAMES: Record<number, string> = {
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

    res.json({
      success: true,
      data: {
        items: items.map(item => ({
          id: item.id,
          trackingCode: item.trackingCode,
          productCode: item.productCode,
          productName: item.productName,
          priceYen: Math.round(Number(item.priceYen || 0)),
          priceBaht: Math.round(Number(item.priceBaht || 0)),
          statusStep: item.statusStep || 1,
          statusName: STATUS_STEP_NAMES[item.statusStep || 1] || 'รับออเดอร์',
          trackingNumberJP: item.trackingNumberJP,
          trackingNumberTH: item.trackingNumberTH,
          orderId: item.order?.id,
          orderNumber: item.order?.orderNumber,
          shippingMethod: item.order?.shippingMethod || 'sea',
          customerId: item.order?.customer?.id,
          customerName: item.order?.customer?.companyName || item.order?.customer?.contactPerson || '-',
          customerTier: item.order?.customer?.tier || 'member',
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching tracking orders:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch tracking orders',
      },
    });
  }
});

// GET /api/v1/statistics/transactions - Bank statement-like transaction history
router.get('/transactions', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, type = 'all', page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const skip = (pageNum - 1) * limitNum;

    // Date range
    const now = new Date();
    const start = startDate
      ? new Date(startDate as string)
      : new Date(now.getFullYear(), now.getMonth(), 1); // Default to start of month
    const end = endDate
      ? new Date(endDate as string)
      : now;
    end.setHours(23, 59, 59, 999);

    // Build where clause based on type
    const whereClause: any = {
      OR: [
        { paidAt: { gte: start, lte: end } },
        { verifiedAt: { gte: start, lte: end } },
      ],
    };

    if (type === 'verified') {
      whereClause.status = 'verified';
    } else if (type === 'pending') {
      whereClause.status = 'pending';
    }

    const [payments, totalCount, aggregates] = await Promise.all([
      prisma.payment.findMany({
        where: whereClause,
        include: {
          orderItem: {
            select: {
              id: true,
              productName: true,
              trackingNumber: true,
              priceYen: true,
              priceBaht: true,
              order: {
                select: {
                  id: true,
                  orderNumber: true,
                  shippingMethod: true,
                  customer: {
                    select: {
                      id: true,
                      companyName: true,
                      contactPerson: true,
                      phone: true,
                      tier: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [
          { verifiedAt: 'desc' },
          { paidAt: 'desc' },
        ],
        skip,
        take: limitNum,
      }),

      prisma.payment.count({ where: whereClause }),

      prisma.payment.aggregate({
        where: { ...whereClause, status: 'verified' },
        _sum: {
          amountBaht: true,
          amountYen: true,
        },
        _count: true,
      }),
    ]);

    // Calculate daily summaries
    const dailySummaries: Record<string, {
      date: string;
      verifiedBaht: number;
      verifiedYen: number;
      verifiedCount: number;
      pendingBaht: number;
      pendingCount: number;
    }> = {};

    for (const payment of payments) {
      const dateKey = (payment.verifiedAt || payment.paidAt || payment.createdAt)
        .toISOString().split('T')[0];

      if (!dailySummaries[dateKey]) {
        dailySummaries[dateKey] = {
          date: dateKey,
          verifiedBaht: 0,
          verifiedYen: 0,
          verifiedCount: 0,
          pendingBaht: 0,
          pendingCount: 0,
        };
      }

      if (payment.status === 'verified') {
        dailySummaries[dateKey].verifiedBaht += Math.round(Number(payment.amountBaht || payment.orderItem.priceBaht || 0));
        dailySummaries[dateKey].verifiedYen += Math.round(Number(payment.amountYen || payment.orderItem.priceYen || 0));
        dailySummaries[dateKey].verifiedCount += 1;
      } else if (payment.status === 'pending') {
        dailySummaries[dateKey].pendingBaht += Math.round(Number(payment.amountBaht || payment.orderItem.priceBaht || 0));
        dailySummaries[dateKey].pendingCount += 1;
      }
    }

    // Format transactions like bank statement
    const transactions = payments.map((payment) => ({
      id: payment.id,
      date: payment.verifiedAt || payment.paidAt || payment.createdAt,
      type: payment.status === 'verified' ? 'income' : 'pending',
      status: payment.status,
      description: payment.orderItem.productName || 'ไม่ระบุสินค้า',
      reference: payment.orderItem.order.orderNumber,
      orderId: payment.orderItem.order.id,
      orderItemId: payment.orderItem.id,
      trackingNumber: payment.orderItem.trackingNumber,
      customer: {
        id: payment.orderItem.order.customer?.id,
        name: payment.orderItem.order.customer?.companyName
          || payment.orderItem.order.customer?.contactPerson
          || 'ไม่ระบุ',
        phone: payment.orderItem.order.customer?.phone,
        tier: payment.orderItem.order.customer?.tier || 'member',
      },
      shippingMethod: payment.orderItem.order.shippingMethod,
      amountBaht: Math.round(Number(payment.amountBaht || payment.orderItem.priceBaht || 0)),
      amountYen: Math.round(Number(payment.amountYen || payment.orderItem.priceYen || 0)),
      paymentMethod: payment.paymentMethod,
      proofImageUrl: payment.proofImageUrl,
      notes: payment.notes,
      verifiedAt: payment.verifiedAt,
      verifiedBy: payment.verifiedBy,
    }));

    // Running balance calculation (for display)
    let runningBalance = 0;
    const transactionsWithBalance = transactions.reverse().map((t) => {
      if (t.status === 'verified') {
        runningBalance += t.amountBaht;
      }
      return { ...t, runningBalance };
    }).reverse();

    // Calculate totals from dailySummaries (includes fallback to orderItem prices)
    const dailySummaryValues = Object.values(dailySummaries);
    const calculatedTotals = dailySummaryValues.reduce(
      (acc, day) => ({
        verifiedBaht: acc.verifiedBaht + day.verifiedBaht,
        verifiedYen: acc.verifiedYen + day.verifiedYen,
        verifiedCount: acc.verifiedCount + day.verifiedCount,
      }),
      { verifiedBaht: 0, verifiedYen: 0, verifiedCount: 0 }
    );

    res.json({
      success: true,
      data: {
        transactions: transactionsWithBalance,
        dailySummaries: dailySummaryValues.sort((a, b) =>
          b.date.localeCompare(a.date)
        ),
        totals: {
          verifiedBaht: calculatedTotals.verifiedBaht,
          verifiedYen: calculatedTotals.verifiedYen,
          verifiedCount: calculatedTotals.verifiedCount,
          totalTransactions: totalCount,
        },
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limitNum),
        },
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch transactions',
      },
    });
  }
});

// GET /api/v1/statistics/monthly-report - Monthly report like bank statement
router.get('/monthly-report', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { year, month } = req.query;

    const now = new Date();
    const targetYear = parseInt(year as string) || now.getFullYear();
    const targetMonth = parseInt(month as string) || now.getMonth() + 1;

    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
    const startOfLastMonth = new Date(targetYear, targetMonth - 2, 1);
    const endOfLastMonth = new Date(targetYear, targetMonth - 1, 0, 23, 59, 59, 999);

    const [
      monthlyPayments,
      lastMonthPayments,
      dailyBreakdown,
      topCustomers,
      paymentsByTier,
      newCustomers,
      orderStats,
    ] = await Promise.all([
      // This month's verified payments
      prisma.payment.aggregate({
        where: {
          verifiedAt: { gte: startOfMonth, lte: endOfMonth },
          status: 'verified',
        },
        _sum: { amountBaht: true, amountYen: true },
        _count: true,
        _avg: { amountBaht: true },
        _max: { amountBaht: true },
        _min: { amountBaht: true },
      }),

      // Last month for comparison
      prisma.payment.aggregate({
        where: {
          verifiedAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          status: 'verified',
        },
        _sum: { amountBaht: true },
        _count: true,
      }),

      // Daily breakdown
      prisma.$queryRaw<Array<{ date: string; total_baht: number; total_yen: number; count: bigint }>>`
        SELECT
          DATE(verified_at)::text as date,
          COALESCE(SUM(amount_baht), 0)::numeric as total_baht,
          COALESCE(SUM(amount_yen), 0)::numeric as total_yen,
          COUNT(*)::bigint as count
        FROM payments
        WHERE verified_at >= ${startOfMonth}
          AND verified_at <= ${endOfMonth}
          AND status = 'verified'
        GROUP BY DATE(verified_at)
        ORDER BY date ASC
      `,

      // Top customers this month
      prisma.$queryRaw<Array<{
        customer_id: string;
        company_name: string | null;
        contact_person: string | null;
        tier: string;
        total_baht: number;
        transaction_count: bigint;
      }>>`
        SELECT
          c.id as customer_id,
          c.company_name,
          c.contact_person,
          c.tier,
          COALESCE(SUM(p.amount_baht), 0)::numeric as total_baht,
          COUNT(p.id)::bigint as transaction_count
        FROM customers c
        JOIN orders o ON o.customer_id = c.id
        JOIN order_items oi ON oi.order_id = o.id
        JOIN payments p ON p.order_item_id = oi.id
        WHERE p.verified_at >= ${startOfMonth}
          AND p.verified_at <= ${endOfMonth}
          AND p.status = 'verified'
        GROUP BY c.id, c.company_name, c.contact_person, c.tier
        ORDER BY total_baht DESC
        LIMIT 10
      `,

      // Payments by tier
      prisma.$queryRaw<Array<{ tier: string; total_baht: number; count: bigint }>>`
        SELECT
          COALESCE(c.tier, 'member') as tier,
          COALESCE(SUM(p.amount_baht), 0)::numeric as total_baht,
          COUNT(p.id)::bigint as count
        FROM payments p
        JOIN order_items oi ON oi.id = p.order_item_id
        JOIN orders o ON o.id = oi.order_id
        LEFT JOIN customers c ON c.id = o.customer_id
        WHERE p.verified_at >= ${startOfMonth}
          AND p.verified_at <= ${endOfMonth}
          AND p.status = 'verified'
        GROUP BY c.tier
      `,

      // New customers this month
      prisma.customer.count({
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),

      // Order stats
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
        _count: true,
      }),
    ]);

    // Calculate growth
    const thisMonthBaht = Number(monthlyPayments._sum.amountBaht || 0);
    const lastMonthBaht = Number(lastMonthPayments._sum.amountBaht || 0);
    const growthPercent = lastMonthBaht === 0
      ? (thisMonthBaht > 0 ? 100 : 0)
      : ((thisMonthBaht - lastMonthBaht) / lastMonthBaht) * 100;

    // Fill daily breakdown with zeros for missing days
    const daysInMonth = endOfMonth.getDate();
    const dailyMap = new Map(dailyBreakdown.map(d => [d.date, d]));
    const fullDailyBreakdown = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const existing = dailyMap.get(dateStr);
      return {
        date: dateStr,
        day,
        dayOfWeek: new Date(targetYear, targetMonth - 1, day).toLocaleDateString('th-TH', { weekday: 'short' }),
        totalBaht: existing ? Number(existing.total_baht) : 0,
        totalYen: existing ? Number(existing.total_yen) : 0,
        count: existing ? Number(existing.count) : 0,
      };
    });

    res.json({
      success: true,
      data: {
        period: {
          year: targetYear,
          month: targetMonth,
          monthName: new Date(targetYear, targetMonth - 1).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }),
          startDate: startOfMonth.toISOString(),
          endDate: endOfMonth.toISOString(),
        },
        summary: {
          totalRevenueBaht: thisMonthBaht,
          totalRevenueYen: Number(monthlyPayments._sum.amountYen || 0),
          transactionCount: monthlyPayments._count,
          averageTransactionBaht: Number(monthlyPayments._avg.amountBaht || 0),
          maxTransactionBaht: Number(monthlyPayments._max.amountBaht || 0),
          minTransactionBaht: Number(monthlyPayments._min.amountBaht || 0),
          lastMonthBaht,
          growthPercent: Math.round(growthPercent * 10) / 10,
          newOrders: orderStats._count,
          newCustomers,
        },
        dailyBreakdown: fullDailyBreakdown,
        topCustomers: topCustomers.map(c => ({
          id: c.customer_id,
          name: c.company_name || c.contact_person || 'ไม่ระบุ',
          tier: c.tier,
          totalBaht: Number(c.total_baht),
          transactionCount: Number(c.transaction_count),
        })),
        revenueByTier: paymentsByTier.map(t => ({
          tier: t.tier,
          totalBaht: Number(t.total_baht),
          count: Number(t.count),
        })),
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching monthly report:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch monthly report',
      },
    });
  }
});

export default router;
