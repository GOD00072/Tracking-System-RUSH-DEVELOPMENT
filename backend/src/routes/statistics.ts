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
      5: 'ส่งออกจาก JP',
      6: 'ของถึงไทย',
      7: 'กำลังจัดส่ง',
      8: 'ส่งมอบสำเร็จ',
    };

    const summary = statusStepCounts.map((item) => ({
      step: item.statusStep,
      name: STATUS_NAMES[item.statusStep] || `สถานะ ${item.statusStep}`,
      count: item._count.statusStep,
    }));

    // Fill in missing steps with 0
    const fullSummary = Array.from({ length: 8 }, (_, i) => {
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

export default router;
