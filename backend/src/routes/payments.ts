import express from 'express';
import prisma from '../lib/prisma';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';
import { lineService } from '../services/lineService';

const router = express.Router();

// GET /api/v1/payments - Get all payments (with filters)
router.get('/', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    const orderItemId = req.query.orderItemId as string;
    const status = req.query.status as string;

    const whereClause: any = {};

    if (orderItemId) {
      whereClause.orderItemId = orderItemId;
    }

    if (status) {
      whereClause.status = status;
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          orderItem: {
            select: {
              id: true,
              productCode: true,
              customerName: true,
              priceYen: true,
              priceBaht: true,
              order: {
                select: {
                  id: true,
                  orderNumber: true,
                },
              },
            },
          },
        },
        orderBy: [
          { orderItemId: 'asc' },
          { installmentNumber: 'asc' },
        ],
      }),
      prisma.payment.count({ where: whereClause }),
    ]);

    res.json({
      success: true,
      data: payments,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch payments',
      },
    });
  }
});

// GET /api/v1/payments/:id - Get single payment
router.get('/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: {
        orderItem: {
          include: {
            order: {
              include: {
                customer: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Payment not found',
        },
      });
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch payment',
      },
    });
  }
});

// POST /api/v1/payments - Create payment installment
router.post('/', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { orderItemId, installmentNumber, installmentName } = req.body;

    if (!orderItemId || !installmentNumber) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'orderItemId and installmentNumber are required',
        },
      });
    }

    // Get order item with its payments to validate total at item level
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        payments: true,
      },
    });

    if (!orderItem) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Order item not found',
        },
      });
    }

    // Calculate item total (price + shipping for this item only)
    const itemTotal = (Number(orderItem.priceBaht) || 0) + (Number(orderItem.shippingCost) || 0);

    // Calculate existing payments total for this item only
    const existingPaymentsTotal = orderItem.payments.reduce(
      (sum, p) => sum + (Number(p.amountBaht) || 0),
      0
    );

    const newPaymentAmount = req.body.amountBaht ? parseFloat(req.body.amountBaht) : 0;
    const newTotal = existingPaymentsTotal + newPaymentAmount;

    // Validate: total payments should not exceed item total (allow 1 baht tolerance for rounding)
    const tolerance = 1;
    if (newTotal > itemTotal + tolerance) {
      const remainingBalance = itemTotal - existingPaymentsTotal;
      return res.status(400).json({
        success: false,
        error: {
          code: 'EXCEEDS_ITEM_TOTAL',
          message: `ยอดรวมงวดชำระเกินยอดสินค้า! คงเหลือที่สร้างได้: ฿${remainingBalance.toLocaleString()}`,
          details: {
            itemTotal,
            existingPaymentsTotal,
            newPaymentAmount,
            remainingBalance,
          },
        },
      });
    }

    const paymentData: any = {
      orderItemId,
      installmentNumber: parseInt(installmentNumber),
    };

    // Optional fields
    if (installmentName) paymentData.installmentName = installmentName;
    if (req.body.amountYen !== undefined) paymentData.amountYen = parseFloat(req.body.amountYen);
    if (req.body.amountBaht !== undefined) paymentData.amountBaht = parseFloat(req.body.amountBaht);
    if (req.body.exchangeRate !== undefined) paymentData.exchangeRate = parseFloat(req.body.exchangeRate);
    if (req.body.status) paymentData.status = req.body.status;
    if (req.body.paymentMethod) paymentData.paymentMethod = req.body.paymentMethod;
    if (req.body.proofImageUrl) paymentData.proofImageUrl = req.body.proofImageUrl;
    if (req.body.dueDate) paymentData.dueDate = new Date(req.body.dueDate);
    if (req.body.notes) paymentData.notes = req.body.notes;

    const payment = await prisma.payment.create({
      data: paymentData,
      include: {
        orderItem: true,
      },
    });

    res.status(201).json({
      success: true,
      data: payment,
    });
  } catch (error: any) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: 'Failed to create payment',
        details: error.message,
      },
    });
  }
});

// PATCH /api/v1/payments/:id - Update payment
router.patch('/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    // If updating amountBaht, validate it doesn't exceed item total
    if (req.body.amountBaht !== undefined) {
      const existingPayment = await prisma.payment.findUnique({
        where: { id: req.params.id },
        include: {
          orderItem: {
            include: {
              payments: true,
            },
          },
        },
      });

      if (!existingPayment) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Payment not found',
          },
        });
      }

      const orderItem = existingPayment.orderItem;

      // Calculate item total (price + shipping for this item only)
      const itemTotal = (Number(orderItem.priceBaht) || 0) + (Number(orderItem.shippingCost) || 0);

      // Calculate existing payments total for this item, excluding current payment
      const otherPaymentsTotal = orderItem.payments
        .filter(p => p.id !== req.params.id)
        .reduce((sum, p) => sum + (Number(p.amountBaht) || 0), 0);

      const newPaymentAmount = req.body.amountBaht ? parseFloat(req.body.amountBaht) : 0;
      const newTotal = otherPaymentsTotal + newPaymentAmount;

      // Validate: total payments should not exceed item total
      if (newTotal > itemTotal) {
        const remainingBalance = itemTotal - otherPaymentsTotal;
        return res.status(400).json({
          success: false,
          error: {
            code: 'EXCEEDS_ITEM_TOTAL',
            message: `ยอดรวมงวดชำระเกินยอดสินค้า! สามารถแก้ไขได้สูงสุด: ฿${remainingBalance.toLocaleString()}`,
            details: {
              itemTotal,
              otherPaymentsTotal,
              newPaymentAmount,
              remainingBalance,
            },
          },
        });
      }
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    // Update fields if provided
    if (req.body.installmentNumber !== undefined) updateData.installmentNumber = parseInt(req.body.installmentNumber);
    if (req.body.installmentName !== undefined) updateData.installmentName = req.body.installmentName;
    if (req.body.amountYen !== undefined) updateData.amountYen = req.body.amountYen ? parseFloat(req.body.amountYen) : null;
    if (req.body.amountBaht !== undefined) updateData.amountBaht = req.body.amountBaht ? parseFloat(req.body.amountBaht) : null;
    if (req.body.slipAmount !== undefined) updateData.slipAmount = req.body.slipAmount ? parseFloat(req.body.slipAmount) : null;
    if (req.body.exchangeRate !== undefined) updateData.exchangeRate = req.body.exchangeRate ? parseFloat(req.body.exchangeRate) : null;
    if (req.body.paymentMethod !== undefined) updateData.paymentMethod = req.body.paymentMethod;
    if (req.body.proofImageUrl !== undefined) updateData.proofImageUrl = req.body.proofImageUrl;
    if (req.body.dueDate !== undefined) updateData.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
    if (req.body.notes !== undefined) updateData.notes = req.body.notes;

    // Handle status change
    if (req.body.status !== undefined) {
      updateData.status = req.body.status;

      // Set paidAt when status changes to 'paid'
      if (req.body.status === 'paid' && !req.body.paidAt) {
        updateData.paidAt = new Date();
      }
    }

    // Manual paidAt override
    if (req.body.paidAt !== undefined) {
      updateData.paidAt = req.body.paidAt ? new Date(req.body.paidAt) : null;
    }

    // Handle verification
    if (req.body.verified === true) {
      updateData.verifiedBy = (req as any).user?.email || 'admin';
      updateData.verifiedAt = new Date();
    }

    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        orderItem: true,
      },
    });

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update payment',
      },
    });
  }
});

// DELETE /api/v1/payments/:id - Delete payment
router.delete('/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    await prisma.payment.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: 'Payment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to delete payment',
      },
    });
  }
});

// POST /api/v1/payments/bulk - Bulk create payments for an order item
router.post('/bulk', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { orderItemId, installments } = req.body;

    if (!orderItemId || !Array.isArray(installments) || installments.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'orderItemId and installments array are required',
        },
      });
    }

    // Get order item with its payments to validate total at item level
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        payments: true,
      },
    });

    if (!orderItem) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Order item not found',
        },
      });
    }

    // Calculate item total (price + shipping for this item only)
    const itemTotal = (Number(orderItem.priceBaht) || 0) + (Number(orderItem.shippingCost) || 0);

    // Calculate existing payments total for this item only
    const existingPaymentsTotal = orderItem.payments.reduce(
      (sum, p) => sum + (Number(p.amountBaht) || 0),
      0
    );

    // Calculate total of new installments
    const newInstallmentsTotal = installments.reduce(
      (sum, inst: any) => sum + (inst.amountBaht ? parseFloat(inst.amountBaht) : 0),
      0
    );

    const newTotal = existingPaymentsTotal + newInstallmentsTotal;

    // Validate: total payments should not exceed item total
    if (newTotal > itemTotal) {
      const remainingBalance = itemTotal - existingPaymentsTotal;
      return res.status(400).json({
        success: false,
        error: {
          code: 'EXCEEDS_ITEM_TOTAL',
          message: `ยอดรวมงวดชำระเกินยอดสินค้า! คงเหลือที่สร้างได้: ฿${remainingBalance.toLocaleString()}`,
          details: {
            itemTotal,
            existingPaymentsTotal,
            newInstallmentsTotal,
            remainingBalance,
          },
        },
      });
    }

    const createdPayments = await Promise.all(
      installments.map((inst: any, index: number) => {
        const paymentData: any = {
          orderItemId,
          installmentNumber: inst.installmentNumber || index + 1,
          installmentName: inst.installmentName || `งวดที่ ${index + 1}`,
        };

        if (inst.amountYen) paymentData.amountYen = parseFloat(inst.amountYen);
        if (inst.amountBaht) paymentData.amountBaht = parseFloat(inst.amountBaht);
        if (inst.dueDate) paymentData.dueDate = new Date(inst.dueDate);
        if (inst.status) paymentData.status = inst.status;

        return prisma.payment.create({ data: paymentData });
      })
    );

    res.status(201).json({
      success: true,
      data: createdPayments,
      message: `Created ${createdPayments.length} payment installments`,
    });
  } catch (error: any) {
    console.error('Error bulk creating payments:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BULK_CREATE_ERROR',
        message: 'Failed to bulk create payments',
        details: error.message,
      },
    });
  }
});

// GET /api/v1/payments/order/:orderId - Get all payments for an order (grouped by item)
router.get('/order/:orderId', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            contactPerson: true,
            lineId: true,
          },
        },
        orderItems: {
          include: {
            payments: {
              orderBy: { installmentNumber: 'asc' },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Order not found',
        },
      });
    }

    // Calculate totals
    let totalYen = 0;
    let totalBaht = 0;
    let totalShipping = 0;
    let paidYen = 0;
    let paidBaht = 0;
    let pendingPayments: any[] = [];
    let allPayments: any[] = [];

    order.orderItems.forEach((item) => {
      totalYen += Number(item.priceYen) || 0;
      totalBaht += Number(item.priceBaht) || 0;
      totalShipping += Number(item.shippingCost) || 0;

      item.payments.forEach((payment) => {
        allPayments.push({
          ...payment,
          productCode: item.productCode,
          productName: item.productName,
        });

        if (payment.status === 'paid' || payment.status === 'verified') {
          paidYen += Number(payment.amountYen) || 0;
          paidBaht += Number(payment.amountBaht) || 0;
        } else if (payment.status === 'pending') {
          pendingPayments.push({
            ...payment,
            productCode: item.productCode,
            productName: item.productName,
          });
        }
      });
    });

    const grandTotal = totalBaht + totalShipping;
    const remainingBaht = grandTotal - paidBaht;

    // Build items with per-item summary
    const itemsWithSummary = order.orderItems.map((item) => {
      const itemTotal = (Number(item.priceBaht) || 0) + (Number(item.shippingCost) || 0);
      const itemPaidBaht = item.payments
        .filter(p => p.status === 'paid' || p.status === 'verified')
        .reduce((sum, p) => sum + (Number(p.amountBaht) || 0), 0);
      const itemRemainingBaht = itemTotal - itemPaidBaht;
      const itemPercentPaid = itemTotal > 0 ? Math.round((itemPaidBaht / itemTotal) * 100) : 0;

      return {
        id: item.id,
        productCode: item.productCode,
        productName: item.productName,
        priceYen: item.priceYen,
        priceBaht: item.priceBaht,
        shippingCost: item.shippingCost,
        paymentStatus: item.paymentStatus,
        payments: item.payments,
        // Per-item summary
        itemSummary: {
          itemTotal,
          paidBaht: itemPaidBaht,
          remainingBaht: itemRemainingBaht,
          percentPaid: itemPercentPaid,
          totalPayments: item.payments.length,
          paidPayments: item.payments.filter(p => p.status === 'paid' || p.status === 'verified').length,
          pendingPayments: item.payments.filter(p => p.status === 'pending').length,
        },
      };
    });

    res.json({
      success: true,
      data: {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          customer: order.customer,
        },
        items: itemsWithSummary,
        summary: {
          totalYen,
          totalBaht,
          totalShipping,
          grandTotal,
          paidYen,
          paidBaht,
          remainingBaht,
          percentPaid: grandTotal > 0 ? Math.round((paidBaht / grandTotal) * 100) : 0,
          totalPayments: allPayments.length,
          paidPayments: allPayments.filter((p) => p.status === 'paid' || p.status === 'verified').length,
          pendingPayments: pendingPayments.length,
        },
        pendingPayments,
        allPayments,
      },
    });
  } catch (error: any) {
    console.error('Error fetching order payments:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch order payments',
      },
    });
  }
});

// GET /api/v1/payments/summary/:orderItemId - Get payment summary for an order item
router.get('/summary/:orderItemId', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { orderItemId: req.params.orderItemId },
      orderBy: { installmentNumber: 'asc' },
    });

    const summary = {
      totalInstallments: payments.length,
      paidInstallments: payments.filter(p => p.status === 'paid').length,
      pendingInstallments: payments.filter(p => p.status === 'pending').length,
      totalAmountYen: payments.reduce((sum, p) => sum + (Number(p.amountYen) || 0), 0),
      totalAmountBaht: payments.reduce((sum, p) => sum + (Number(p.amountBaht) || 0), 0),
      paidAmountYen: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (Number(p.amountYen) || 0), 0),
      paidAmountBaht: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (Number(p.amountBaht) || 0), 0),
      payments,
    };

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error fetching payment summary:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch payment summary',
      },
    });
  }
});

// POST /api/v1/payments/reminder/:orderId - Send payment reminder for an order
router.post('/reminder/:orderId', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { orderId } = req.params;

    // Get order with customer and items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        orderItems: {
          include: {
            payments: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Order not found',
        },
      });
    }

    // Check if customer has LINE ID
    if (!order.customer?.lineId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_LINE_ID',
          message: 'ลูกค้าไม่มี LINE ID ในระบบ',
        },
      });
    }

    // Calculate totals
    const totalBaht = order.orderItems.reduce((sum, item) => sum + Number(item.priceBaht || 0), 0);
    const paidBaht = order.orderItems.reduce((sum, item) => {
      const itemPaid = item.payments
        .filter((p) => p.status === 'paid')
        .reduce((pSum, p) => pSum + Number(p.amountBaht || 0), 0);
      return sum + itemPaid;
    }, 0);

    // Get bank settings
    const bankSettings = await prisma.systemSetting.findUnique({
      where: { key: 'payment_bank' },
    });

    const bankInfo = bankSettings?.value as any;

    // Send LINE reminder
    const success = await lineService.sendPaymentReminder(
      order.customer.lineId,
      order.customer.companyName || order.customer.contactPerson || 'ลูกค้า',
      order.orderNumber,
      totalBaht,
      paidBaht,
      undefined, // dueDate
      bankInfo
        ? {
            bankName: bankInfo.bank_name,
            accountName: bankInfo.account_name,
            accountNumber: bankInfo.account_number,
          }
        : undefined
    );

    if (success) {
      res.json({
        success: true,
        message: 'ส่งแจ้งเตือนเรียบร้อยแล้ว',
        data: {
          orderId,
          orderNumber: order.orderNumber,
          customerName: order.customer.companyName || order.customer.contactPerson,
          totalBaht,
          paidBaht,
          remainingBaht: totalBaht - paidBaht,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'SEND_FAILED',
          message: 'ไม่สามารถส่งแจ้งเตือนได้ กรุณาตรวจสอบการตั้งค่า LINE',
        },
      });
    }
  } catch (error: any) {
    console.error('Error sending payment reminder:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REMINDER_ERROR',
        message: error.message || 'Failed to send payment reminder',
      },
    });
  }
});

// POST /api/v1/payments/bulk-reminder - Send reminders to all customers with pending payments
router.post('/bulk-reminder', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    // Find all orders with pending payments
    const orders = await prisma.order.findMany({
      where: {
        customer: {
          lineId: { not: null },
        },
        orderItems: {
          some: {
            paymentStatus: { in: ['pending', 'partial'] },
          },
        },
      },
      include: {
        customer: true,
        orderItems: {
          include: {
            payments: true,
          },
        },
      },
    });

    // Get bank settings
    const bankSettings = await prisma.systemSetting.findUnique({
      where: { key: 'payment_bank' },
    });
    const bankInfo = bankSettings?.value as any;

    let sent = 0;
    let failed = 0;

    for (const order of orders) {
      if (!order.customer?.lineId) continue;

      const totalBaht = order.orderItems.reduce((sum, item) => sum + Number(item.priceBaht || 0), 0);
      const paidBaht = order.orderItems.reduce((sum, item) => {
        const itemPaid = item.payments
          .filter((p) => p.status === 'paid')
          .reduce((pSum, p) => pSum + Number(p.amountBaht || 0), 0);
        return sum + itemPaid;
      }, 0);

      // Only send if there's outstanding balance
      if (totalBaht > paidBaht) {
        const success = await lineService.sendPaymentReminder(
          order.customer.lineId,
          order.customer.companyName || order.customer.contactPerson || 'ลูกค้า',
          order.orderNumber,
          totalBaht,
          paidBaht,
          undefined,
          bankInfo
            ? {
                bankName: bankInfo.bank_name,
                accountName: bankInfo.account_name,
                accountNumber: bankInfo.account_number,
              }
            : undefined
        );

        if (success) {
          sent++;
        } else {
          failed++;
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    res.json({
      success: true,
      message: `ส่งแจ้งเตือน ${sent} ราย สำเร็จ, ${failed} ราย ล้มเหลว`,
      data: {
        sent,
        failed,
        total: sent + failed,
      },
    });
  } catch (error: any) {
    console.error('Error sending bulk payment reminders:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BULK_REMINDER_ERROR',
        message: error.message || 'Failed to send bulk payment reminders',
      },
    });
  }
});

// GET /api/v1/payments/pending - Get all orders with pending payments
router.get('/pending', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        orderItems: {
          some: {
            paymentStatus: { in: ['pending', 'partial'] },
          },
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            contactPerson: true,
            phone: true,
            lineId: true,
          },
        },
        orderItems: {
          include: {
            payments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate summary for each order
    const ordersWithSummary = orders.map((order) => {
      const totalBaht = order.orderItems.reduce((sum, item) => sum + Number(item.priceBaht || 0), 0);
      const paidBaht = order.orderItems.reduce((sum, item) => {
        const itemPaid = item.payments
          .filter((p) => p.status === 'paid')
          .reduce((pSum, p) => pSum + Number(p.amountBaht || 0), 0);
        return sum + itemPaid;
      }, 0);

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.customer,
        hasLineId: !!order.customer?.lineId,
        totalItems: order.orderItems.length,
        totalBaht,
        paidBaht,
        remainingBaht: totalBaht - paidBaht,
        percentPaid: totalBaht > 0 ? Math.round((paidBaht / totalBaht) * 100) : 0,
      };
    });

    // Filter to only show orders with remaining balance
    const pendingOrders = ordersWithSummary.filter((o) => o.remainingBaht > 0);

    res.json({
      success: true,
      data: pendingOrders,
      summary: {
        totalOrders: pendingOrders.length,
        totalOutstanding: pendingOrders.reduce((sum, o) => sum + o.remainingBaht, 0),
        canSendReminder: pendingOrders.filter((o) => o.hasLineId).length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching pending payments:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch pending payments',
      },
    });
  }
});

export default router;
