import express from 'express';
import prisma from '../lib/prisma';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';
import { lineService } from '../services/lineService';

const router = express.Router();

// Helper function to recalculate order totals from items
async function recalculateOrderTotals(orderId: string) {
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    select: { weight: true, shippingCost: true, priceBaht: true },
  });

  const totalWeight = items.reduce((sum, item) => sum + Number(item.weight || 0), 0);
  const totalShipping = items.reduce((sum, item) => sum + Number(item.shippingCost || 0), 0);

  await prisma.order.update({
    where: { id: orderId },
    data: {
      totalWeight: totalWeight || null,
      estimatedCost: totalShipping || null, // ใช้ estimatedCost เก็บค่าจัดส่งรวม
    },
  });

  console.log(`[OrderItems] Recalculated order ${orderId}: totalWeight=${totalWeight}kg`);
}

// GET /api/v1/order-items - Get all order items (with filters)
router.get('/', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    const orderId = req.query.orderId as string;
    const customerId = req.query.customerId as string;
    const search = req.query.search as string;

    const whereClause: any = {};

    // Filter by order
    if (orderId) {
      whereClause.orderId = orderId;
    }

    // Filter by customer (through order)
    if (customerId) {
      whereClause.order = {
        customerId: customerId,
      };
    }

    // Search in multiple fields (including new JP/TH tracking)
    if (search) {
      whereClause.OR = [
        { productCode: { contains: search, mode: 'insensitive' } },
        { productUrl: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { clickerName: { contains: search, mode: 'insensitive' } },
        { trackingNumber: { contains: search, mode: 'insensitive' } },
        { trackingNumberJP: { contains: search, mode: 'insensitive' } },
        { trackingNumberTH: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by status step (timeline)
    const statusStep = req.query.statusStep as string;
    if (statusStep) {
      whereClause.statusStep = parseInt(statusStep);
    }

    const [items, total] = await Promise.all([
      prisma.orderItem.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              customer: {
                select: {
                  id: true,
                  companyName: true,
                  contactPerson: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.orderItem.count({ where: whereClause }),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching order items:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch order items',
      },
    });
  }
});

// GET /api/v1/order-items/:id - Get single order item with status history and payments
router.get('/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const item = await prisma.orderItem.findUnique({
      where: { id: req.params.id },
      include: {
        order: {
          include: {
            customer: true,
          },
        },
        statusHistory: {
          orderBy: { timestamp: 'desc' },
        },
        payments: {
          orderBy: { installmentNumber: 'asc' },
        },
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Order item not found',
        },
      });
    }

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error fetching order item:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch order item',
      },
    });
  }
});

// POST /api/v1/order-items - Create order item
router.post('/', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const itemData: any = {
      orderId: req.body.orderId,
    };

    // Optional fields
    if (req.body.sequenceNumber !== undefined) itemData.sequenceNumber = parseInt(req.body.sequenceNumber);
    if (req.body.clickDate) itemData.clickDate = new Date(req.body.clickDate);
    if (req.body.clickChannel) itemData.clickChannel = req.body.clickChannel;
    if (req.body.clickerName) itemData.clickerName = req.body.clickerName;
    if (req.body.customerName) itemData.customerName = req.body.customerName;
    if (req.body.productCode) itemData.productCode = req.body.productCode;
    if (req.body.productUrl) itemData.productUrl = req.body.productUrl;
    if (req.body.priceYen !== undefined) itemData.priceYen = parseFloat(req.body.priceYen);
    if (req.body.priceBaht !== undefined) itemData.priceBaht = parseFloat(req.body.priceBaht);
    if (req.body.weight !== undefined) itemData.weight = parseFloat(req.body.weight);
    if (req.body.shippingCost !== undefined) itemData.shippingCost = parseFloat(req.body.shippingCost);
    if (req.body.itemStatus) itemData.itemStatus = req.body.itemStatus;
    if (req.body.paymentStatus) itemData.paymentStatus = req.body.paymentStatus;
    if (req.body.shippingRound) itemData.shippingRound = req.body.shippingRound;
    if (req.body.storePage) itemData.storePage = req.body.storePage;
    if (req.body.remarks) itemData.remarks = req.body.remarks;

    // 🆕 New fields: Tracking JP/TH, product images, status step
    if (req.body.trackingNumber) itemData.trackingNumber = req.body.trackingNumber;
    if (req.body.trackingNumberJP) itemData.trackingNumberJP = req.body.trackingNumberJP;
    if (req.body.trackingNumberTH) itemData.trackingNumberTH = req.body.trackingNumberTH;
    if (req.body.productImages) itemData.productImages = req.body.productImages;
    if (req.body.statusStep !== undefined) itemData.statusStep = parseInt(req.body.statusStep);

    const item = await prisma.orderItem.create({
      data: itemData,
      include: {
        order: {
          include: {
            customer: true,
          },
        },
        statusHistory: true,
        payments: true,
      },
    });

    // Recalculate order totals (weight, shipping)
    await recalculateOrderTotals(orderId);

    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error: any) {
    console.error('Error creating order item:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: 'Failed to create order item',
        details: error.message,
      },
    });
  }
});

// Status step names for timeline (Thai)
const STATUS_STEP_NAMES: Record<number, string> = {
  1: 'รับออเดอร์',
  2: 'ชำระเงินงวดแรก',
  3: 'สั่งซื้อจากญี่ปุ่น',
  4: 'ของถึงโกดังญี่ปุ่น',
  5: 'ส่งออกจากญี่ปุ่น',
  6: 'ของถึงไทย',
  7: 'กำลังจัดส่ง',
  8: 'ส่งมอบสำเร็จ',
};

// PATCH /api/v1/order-items/:id - Update order item
router.patch('/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Update all fields if provided
    if (req.body.sequenceNumber !== undefined) updateData.sequenceNumber = parseInt(req.body.sequenceNumber);
    if (req.body.clickDate !== undefined) updateData.clickDate = req.body.clickDate ? new Date(req.body.clickDate) : null;
    if (req.body.clickChannel !== undefined) updateData.clickChannel = req.body.clickChannel;
    if (req.body.clickerName !== undefined) updateData.clickerName = req.body.clickerName;
    if (req.body.customerName !== undefined) updateData.customerName = req.body.customerName;
    if (req.body.productCode !== undefined) updateData.productCode = req.body.productCode;
    if (req.body.productUrl !== undefined) updateData.productUrl = req.body.productUrl;
    if (req.body.priceYen !== undefined) updateData.priceYen = req.body.priceYen ? parseFloat(req.body.priceYen) : null;
    if (req.body.priceBaht !== undefined) updateData.priceBaht = req.body.priceBaht ? parseFloat(req.body.priceBaht) : null;
    if (req.body.weight !== undefined) updateData.weight = req.body.weight ? parseFloat(req.body.weight) : null;
    if (req.body.shippingCost !== undefined) updateData.shippingCost = req.body.shippingCost ? parseFloat(req.body.shippingCost) : null;
    if (req.body.itemStatus !== undefined) updateData.itemStatus = req.body.itemStatus;
    if (req.body.paymentStatus !== undefined) updateData.paymentStatus = req.body.paymentStatus;
    if (req.body.shippingRound !== undefined) updateData.shippingRound = req.body.shippingRound;
    if (req.body.storePage !== undefined) updateData.storePage = req.body.storePage;
    if (req.body.remarks !== undefined) updateData.remarks = req.body.remarks;

    // 🆕 New fields: Tracking JP/TH, product images, status step
    if (req.body.trackingNumber !== undefined) updateData.trackingNumber = req.body.trackingNumber;
    if (req.body.trackingNumberJP !== undefined) updateData.trackingNumberJP = req.body.trackingNumberJP;
    if (req.body.trackingNumberTH !== undefined) updateData.trackingNumberTH = req.body.trackingNumberTH;
    if (req.body.productImages !== undefined) updateData.productImages = req.body.productImages;

    // Handle status step change with history logging
    let statusChanged = false;
    let newStatusStep: number | undefined;
    if (req.body.statusStep !== undefined) {
      newStatusStep = parseInt(req.body.statusStep);
      updateData.statusStep = newStatusStep;
      statusChanged = true;
    }

    const item = await prisma.orderItem.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        order: {
          include: {
            customer: true,
          },
        },
        statusHistory: {
          orderBy: { timestamp: 'desc' },
        },
        payments: {
          orderBy: { installmentNumber: 'asc' },
        },
      },
    });

    // Create status history entry if status changed
    if (statusChanged && newStatusStep) {
      await prisma.itemStatusHistory.create({
        data: {
          orderItemId: req.params.id,
          statusStep: newStatusStep,
          statusName: STATUS_STEP_NAMES[newStatusStep] || `สถานะ ${newStatusStep}`,
          description: req.body.statusDescription || null,
          changedBy: (req as any).user?.email || 'admin',
        },
      });

      // Send LINE notification to customer if they have LINE ID
      if (item.order?.customer?.lineId) {
        const customerLineId = item.order.customer.lineId;
        const customerName = item.customerName || item.order.customer.companyName || 'ลูกค้า';
        const statusName = STATUS_STEP_NAMES[newStatusStep] || `สถานะ ${newStatusStep}`;
        const orderNumber = item.order.orderNumber;

        // Build notification message
        let message = `📦 อัปเดตสถานะสินค้า\n\n`;
        message += `👤 ลูกค้า: ${customerName}\n`;
        message += `📋 เลขออเดอร์: ${orderNumber}\n`;
        if (item.productCode) {
          message += `🏷️ รหัสสินค้า: ${item.productCode}\n`;
        }
        message += `\n✅ สถานะใหม่: ${statusName}\n`;

        // Add tracking info if available
        if (item.trackingNumberJP && newStatusStep >= 4) {
          message += `📮 เลข Tracking JP: ${item.trackingNumberJP}\n`;
        }
        if (item.trackingNumberTH && newStatusStep >= 6) {
          message += `📮 เลข Tracking TH: ${item.trackingNumberTH}\n`;
        }

        message += `\nขอบคุณที่ใช้บริการ 🙏`;

        // Send LINE notification (non-blocking)
        lineService.sendTextMessage(customerLineId, message).catch((err) => {
          console.error('[OrderItems] LINE notification error:', err);
        });

        console.log(`[OrderItems] LINE notification sent to ${customerLineId} for status ${newStatusStep}`);
      }
    }

    // Recalculate order totals (weight, shipping)
    await recalculateOrderTotals(item.orderId);

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error updating order item:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update order item',
      },
    });
  }
});

// DELETE /api/v1/order-items/:id - Delete order item
router.delete('/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    // Get orderId before deleting
    const item = await prisma.orderItem.findUnique({
      where: { id: req.params.id },
      select: { orderId: true },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order item not found' },
      });
    }

    await prisma.orderItem.delete({
      where: { id: req.params.id },
    });

    // Recalculate order totals after deletion
    await recalculateOrderTotals(item.orderId);

    res.json({
      success: true,
      message: 'Order item deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting order item:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to delete order item',
      },
    });
  }
});

// POST /api/v1/order-items/bulk-status - Bulk update status for multiple items
router.post('/bulk-status', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { itemIds, statusStep, sendNotification = true } = req.body;

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'itemIds array is required',
        },
      });
    }

    if (statusStep === undefined || statusStep < 1 || statusStep > 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'statusStep must be between 1 and 8',
        },
      });
    }

    const statusName = STATUS_STEP_NAMES[statusStep] || `สถานะ ${statusStep}`;

    // Get items with customer info for notifications
    const items = await prisma.orderItem.findMany({
      where: { id: { in: itemIds } },
      include: {
        order: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'No items found with the provided IDs',
        },
      });
    }

    // Update all items
    await prisma.orderItem.updateMany({
      where: { id: { in: itemIds } },
      data: {
        statusStep,
        updatedAt: new Date(),
      },
    });

    // Create status history entries
    const changedBy = (req as any).user?.email || 'admin';
    await Promise.all(
      items.map((item) =>
        prisma.itemStatusHistory.create({
          data: {
            orderItemId: item.id,
            statusStep,
            statusName,
            description: `Bulk update: ${itemIds.length} items`,
            changedBy,
          },
        })
      )
    );

    // Send LINE notifications if enabled
    let notificationsSent = 0;
    if (sendNotification) {
      const customerNotifications = new Map<string, string[]>();

      // Group items by customer LINE ID
      for (const item of items) {
        const lineId = item.order?.customer?.lineId;
        if (lineId) {
          if (!customerNotifications.has(lineId)) {
            customerNotifications.set(lineId, []);
          }
          customerNotifications.get(lineId)!.push(
            item.productCode || item.customerName || item.id
          );
        }
      }

      // Send one notification per customer
      for (const [lineId, productCodes] of customerNotifications) {
        let message = `📦 อัปเดตสถานะสินค้า (${productCodes.length} รายการ)\n\n`;
        message += `✅ สถานะใหม่: ${statusName}\n\n`;
        message += `📋 รายการที่อัปเดต:\n`;
        productCodes.slice(0, 5).forEach((code) => {
          message += `• ${code}\n`;
        });
        if (productCodes.length > 5) {
          message += `... และอีก ${productCodes.length - 5} รายการ\n`;
        }
        message += `\nขอบคุณที่ใช้บริการ 🙏`;

        lineService.sendTextMessage(lineId, message).catch((err) => {
          console.error('[OrderItems] Bulk LINE notification error:', err);
        });
        notificationsSent++;
      }
    }

    res.json({
      success: true,
      data: {
        updatedCount: items.length,
        statusStep,
        statusName,
        notificationsSent,
      },
    });
  } catch (error: any) {
    console.error('Error bulk updating status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BULK_UPDATE_ERROR',
        message: 'Failed to bulk update status',
        details: error.message,
      },
    });
  }
});

// POST /api/v1/order-items/bulk - Bulk create order items
router.post('/bulk', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { orderId, items } = req.body;

    if (!orderId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'orderId and items array are required',
        },
      });
    }

    // Create all items
    const createdItems = await Promise.all(
      items.map((item: any, index: number) => {
        const itemData: any = {
          orderId,
          sequenceNumber: item.sequenceNumber || index + 1,
        };

        if (item.clickDate) itemData.clickDate = new Date(item.clickDate);
        if (item.clickChannel) itemData.clickChannel = item.clickChannel;
        if (item.clickerName) itemData.clickerName = item.clickerName;
        if (item.customerName) itemData.customerName = item.customerName;
        if (item.productCode) itemData.productCode = item.productCode;
        if (item.productUrl) itemData.productUrl = item.productUrl;
        if (item.priceYen) itemData.priceYen = parseFloat(item.priceYen);
        if (item.priceBaht) itemData.priceBaht = parseFloat(item.priceBaht);
        if (item.itemStatus) itemData.itemStatus = item.itemStatus;
        if (item.paymentStatus) itemData.paymentStatus = item.paymentStatus;
        if (item.shippingRound) itemData.shippingRound = item.shippingRound;
        if (item.trackingNumber) itemData.trackingNumber = item.trackingNumber;
        if (item.storePage) itemData.storePage = item.storePage;
        if (item.remarks) itemData.remarks = item.remarks;

        return prisma.orderItem.create({ data: itemData });
      })
    );

    res.status(201).json({
      success: true,
      data: createdItems,
      message: `Created ${createdItems.length} items`,
    });
  } catch (error: any) {
    console.error('Error bulk creating order items:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BULK_CREATE_ERROR',
        message: 'Failed to bulk create order items',
        details: error.message,
      },
    });
  }
});

// GET /api/v1/order-items/export - Export order items to JSON (for Excel)
router.get('/export', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const orderId = req.query.orderId as string;
    const statusStep = req.query.statusStep as string;
    const search = req.query.search as string;
    const format = (req.query.format as string) || 'json';

    const whereClause: any = {};

    if (orderId) {
      whereClause.orderId = orderId;
    }

    if (statusStep) {
      whereClause.statusStep = parseInt(statusStep);
    }

    if (search) {
      whereClause.OR = [
        { productCode: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { trackingNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const items = await prisma.orderItem.findMany({
      where: whereClause,
      include: {
        order: {
          select: {
            orderNumber: true,
            status: true,
            customer: {
              select: {
                companyName: true,
                contactPerson: true,
                phone: true,
                lineId: true,
              },
            },
          },
        },
      },
      orderBy: { sequenceNumber: 'asc' },
    });

    // Transform data for export
    const exportData = items.map((item, index) => ({
      no: index + 1,
      sequenceNumber: item.sequenceNumber,
      orderNumber: item.order?.orderNumber,
      customerName: item.customerName || item.order?.customer?.companyName,
      contactPerson: item.order?.customer?.contactPerson,
      phone: item.order?.customer?.phone,
      lineId: item.order?.customer?.lineId,
      clickDate: item.clickDate ? new Date(item.clickDate).toLocaleDateString('th-TH') : '',
      clickChannel: item.clickChannel,
      clickerName: item.clickerName,
      productCode: item.productCode,
      productUrl: item.productUrl,
      priceYen: item.priceYen ? Number(item.priceYen) : 0,
      priceBaht: item.priceBaht ? Number(item.priceBaht) : 0,
      statusStep: item.statusStep,
      statusName: STATUS_STEP_NAMES[item.statusStep || 1] || '',
      itemStatus: item.itemStatus,
      paymentStatus: item.paymentStatus,
      shippingRound: item.shippingRound,
      trackingNumber: item.trackingNumber,
      trackingNumberJP: item.trackingNumberJP,
      trackingNumberTH: item.trackingNumberTH,
      storePage: item.storePage,
      remarks: item.remarks,
    }));

    if (format === 'csv') {
      // Generate CSV
      const headers = Object.keys(exportData[0] || {}).join(',');
      const rows = exportData.map((row) =>
        Object.values(row)
          .map((val) => `"${String(val || '').replace(/"/g, '""')}"`)
          .join(',')
      );
      const csv = [headers, ...rows].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="order-items-${new Date().toISOString().slice(0, 10)}.csv"`);
      res.send('\uFEFF' + csv); // BOM for Excel UTF-8
    } else {
      res.json({
        success: true,
        data: exportData,
        meta: {
          totalItems: exportData.length,
          exportedAt: new Date().toISOString(),
          filters: { orderId, statusStep, search },
        },
      });
    }
  } catch (error: any) {
    console.error('Error exporting order items:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EXPORT_ERROR',
        message: 'Failed to export order items',
        details: error.message,
      },
    });
  }
});

export default router;
