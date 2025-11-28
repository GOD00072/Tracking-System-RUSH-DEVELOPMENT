import express from 'express';
import prisma from '../lib/prisma';
import { authenticateAdmin } from '../middleware/auth';
import { lineService } from '../services/lineService';

const router = express.Router();

// All notification routes require admin authentication
router.use(authenticateAdmin);

// POST /api/v1/notifications/status - Send status notification
router.post('/status', async (req, res) => {
  try {
    const { orderId, customMessage } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_ORDER_ID', message: 'Order ID is required' },
      });
    }

    // Get order with customer and items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          include: {
            user: {
              select: { lineId: true },
            },
          },
        },
        orderItems: {
          select: {
            id: true,
            productCode: true,
            productName: true,
            customerName: true,
            statusStep: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
      });
    }

    // Get LINE ID from customer or user
    const lineId = order.customer?.lineId || order.customer?.user?.lineId;

    if (!lineId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_LINE_ID', message: 'Customer does not have LINE ID' },
      });
    }

    // Get customer name
    const customerName = order.customer?.companyName || order.customer?.contactPerson || 'ลูกค้า';

    // Get the most advanced status from items
    const maxStatusStep = Math.max(...order.orderItems.map((item) => item.statusStep || 1));

    // Map status step to status key
    const statusStepToKey: Record<number, string> = {
      1: 'order_received',
      2: 'first_payment',
      3: 'ordered_from_japan',
      4: 'arrived_jp_warehouse',
      5: 'shipped_from_japan',
      6: 'arrived_thailand',
      7: 'out_for_delivery',
      8: 'delivered',
    };
    const statusKey = statusStepToKey[maxStatusStep] || 'order_received';

    // Build items for flex message
    const itemsForFlex = order.orderItems.map((item) => ({
      productCode: item.productCode || item.productName || item.customerName || 'สินค้า',
      productName: item.productName || item.customerName || undefined,
    }));

    // Build tracking URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5001';
    const trackingUrl = `${frontendUrl}/tracking/${order.orderNumber}`;

    // Send notification
    const success = await lineService.sendStatusUpdateFlexMessage(
      lineId,
      customerName,
      statusKey,
      itemsForFlex,
      order.orderNumber,
      trackingUrl
    );

    if (success) {
      res.json({
        success: true,
        message: 'Status notification sent successfully',
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName,
          status: statusKey,
          itemCount: itemsForFlex.length,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: { code: 'SEND_FAILED', message: 'Failed to send LINE notification' },
      });
    }
  } catch (error) {
    console.error('Error sending status notification:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to send notification' },
    });
  }
});

// POST /api/v1/notifications/payment - Send payment reminder notification
router.post('/payment', async (req, res) => {
  try {
    const { orderId, totalAmount, paidAmount, dueDate, bankInfo, qrCodeUrl, installmentName, installmentAmount } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_ORDER_ID', message: 'Order ID is required' },
      });
    }

    // Get order with customer
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          include: {
            user: {
              select: { lineId: true },
            },
          },
        },
        orderItems: {
          select: {
            priceBaht: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
      });
    }

    // Get LINE ID from customer or user
    const lineId = order.customer?.lineId || order.customer?.user?.lineId;

    if (!lineId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_LINE_ID', message: 'Customer does not have LINE ID' },
      });
    }

    // Get customer name
    const customerName = order.customer?.companyName || order.customer?.contactPerson || 'ลูกค้า';

    // Calculate totals if not provided
    const calculatedTotal = order.orderItems.reduce((sum, item) => sum + (item.priceBaht || 0), 0);
    const finalTotalAmount = totalAmount || calculatedTotal || 0;
    const finalPaidAmount = paidAmount || 0;
    const remainingAmount = finalTotalAmount - finalPaidAmount;

    // Send payment reminder
    const success = await lineService.sendPaymentReminderFlex(
      lineId,
      customerName,
      order.orderNumber,
      finalTotalAmount,
      finalPaidAmount,
      installmentAmount || remainingAmount, // Use installment amount if provided
      dueDate ? new Date(dueDate) : undefined,
      bankInfo,
      qrCodeUrl,
      installmentName // New parameter for installment name
    );

    if (success) {
      res.json({
        success: true,
        message: 'Payment notification sent successfully',
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName,
          totalAmount: finalTotalAmount,
          paidAmount: finalPaidAmount,
          remainingAmount,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: { code: 'SEND_FAILED', message: 'Failed to send LINE notification' },
      });
    }
  } catch (error) {
    console.error('Error sending payment notification:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to send notification' },
    });
  }
});

// GET /api/v1/notifications/preview/:orderId - Get notification preview data
router.get('/preview/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          include: {
            user: {
              select: { lineId: true, fullName: true },
            },
          },
        },
        orderItems: {
          select: {
            id: true,
            productCode: true,
            productName: true,
            customerName: true,
            statusStep: true,
            priceBaht: true,
            priceYen: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
      });
    }

    const lineId = order.customer?.lineId || order.customer?.user?.lineId;
    const customerName = order.customer?.companyName || order.customer?.contactPerson || 'ลูกค้า';
    const maxStatusStep = Math.max(...order.orderItems.map((item) => item.statusStep || 1), 1);
    const totalBaht = order.orderItems.reduce((sum, item) => sum + (item.priceBaht || 0), 0);

    // Status labels
    const statusLabels: Record<number, string> = {
      1: 'รับออเดอร์แล้ว',
      2: 'ชำระเงินงวดแรก',
      3: 'สั่งซื้อจากญี่ปุ่นแล้ว',
      4: 'ถึงโกดังญี่ปุ่น',
      5: 'ส่งออกจากญี่ปุ่น',
      6: 'ถึงไทยแล้ว',
      7: 'กำลังจัดส่ง',
      8: 'จัดส่งสำเร็จ',
    };

    res.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName,
        hasLineId: !!lineId,
        lineId: lineId || null,
        currentStatus: statusLabels[maxStatusStep] || 'ไม่ระบุ',
        currentStatusStep: maxStatusStep,
        itemCount: order.orderItems.length,
        items: order.orderItems.map((item) => ({
          productCode: item.productCode || item.productName || item.customerName || 'สินค้า',
          productName: item.productName || item.customerName,
          statusStep: item.statusStep,
          priceBaht: item.priceBaht,
        })),
        totalBaht,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error('Error getting notification preview:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get preview data' },
    });
  }
});

export default router;
