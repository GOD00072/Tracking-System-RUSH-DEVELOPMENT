import express from 'express';
import prisma from '../lib/prisma';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';
import { lineService } from '../services/lineService';
import { deleteFromCloudinary, isCloudinaryUrl } from '../config/cloudinary';

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
    const shippingMethod = req.query.shippingMethod as string;

    const whereClause: any = {};

    // Filter by order
    if (orderId) {
      whereClause.orderId = orderId;
    }

    // Filter by customer (through order)
    if (customerId) {
      whereClause.order = {
        ...whereClause.order,
        customerId: customerId,
      };
    }

    // Filter by shipping method (through order)
    if (shippingMethod) {
      whereClause.order = {
        ...whereClause.order,
        shippingMethod: shippingMethod,
      };
    }

    // Search in multiple fields (including trackingCode and customer code)
    if (search) {
      whereClause.OR = [
        { trackingCode: { contains: search, mode: 'insensitive' } },
        { productCode: { contains: search, mode: 'insensitive' } },
        { productName: { contains: search, mode: 'insensitive' } },
        { productUrl: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { clickerName: { contains: search, mode: 'insensitive' } },
        { trackingNumber: { contains: search, mode: 'insensitive' } },
        { trackingNumberJP: { contains: search, mode: 'insensitive' } },
        { trackingNumberTH: { contains: search, mode: 'insensitive' } },
        { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
        { order: { customer: { customerCode: { contains: search, mode: 'insensitive' } } } },
        { order: { customer: { companyName: { contains: search, mode: 'insensitive' } } } },
        { order: { customer: { contactPerson: { contains: search, mode: 'insensitive' } } } },
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
              origin: true,
              destination: true,
              shippingMethod: true,
              customer: {
                select: {
                  id: true,
                  customerCode: true,
                  companyName: true,
                  contactPerson: true,
                  tier: true,
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

// GET /api/v1/order-items/export - Export order items to JSON/CSV (MUST be before /:id route)
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

    // Status step names (9 steps)
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
      productName: item.productName,
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

// Generate random suffix for tracking code (3 characters: letters and numbers)
const generateRandomSuffix = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars: I, O, 0, 1
  let result = '';
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate tracking code based on order number, sequence, and random suffix
// Format: PKN-{YYMMDD}-{orderSeq}-{itemSeq}-{random} e.g., PKN-241204-002-01-A3B
// trackingCode = รหัสติดตาม (auto-generated for customers to track)
// productCode = รหัสสินค้า (admin can manually enter, e.g. SKU from JP store)
const generateTrackingCode = async (orderId: string, sequenceNumber: number): Promise<string> => {
  const randomSuffix = generateRandomSuffix();

  // Get order number from order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { orderNumber: true, createdAt: true },
  });

  // Extract short format from order number or use date
  // Order number format: 20251204-ORD-002 → extract 241204-002
  let shortCode = '';
  if (order?.orderNumber) {
    // Try to extract date and sequence from order number
    const match = order.orderNumber.match(/(\d{4})(\d{2})(\d{2})-ORD-(\d+)/);
    if (match) {
      const yy = match[1].slice(-2); // 2025 → 25
      const mm = match[2];
      const dd = match[3];
      const seq = match[4];
      shortCode = `${yy}${mm}${dd}-${seq}`;
    } else {
      // Fallback: use last 6 chars of order number
      shortCode = order.orderNumber.replace(/-/g, '').slice(-6);
    }
  } else {
    // Fallback: use date-based format
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    const dd = now.getDate().toString().padStart(2, '0');
    shortCode = `${yy}${mm}${dd}-001`;
  }

  // Format: PKN-{shortCode}-{itemSeq}-{random}
  // e.g., PKN-241204-002-01-A3B
  return `PKN-${shortCode}-${sequenceNumber.toString().padStart(2, '0')}-${randomSuffix}`;
};

// POST /api/v1/order-items - Create order item
router.post('/', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const orderId = req.body.orderId;

    // Get next sequence number if not provided
    let sequenceNumber = req.body.sequenceNumber;
    if (sequenceNumber === undefined) {
      const maxSeq = await prisma.orderItem.aggregate({
        where: { orderId },
        _max: { sequenceNumber: true },
      });
      sequenceNumber = (maxSeq._max.sequenceNumber || 0) + 1;
    } else {
      sequenceNumber = parseInt(sequenceNumber);
    }

    // Auto-generate tracking code (for customers to track) - not for FEE items
    let trackingCode = null;
    if (req.body.productCode !== 'FEE') {
      trackingCode = await generateTrackingCode(orderId, sequenceNumber);
    }

    const itemData: any = {
      orderId: orderId,
      trackingCode: trackingCode,
      sequenceNumber: sequenceNumber,
    };

    // productCode is manually entered by admin (e.g., SKU from JP store)
    if (req.body.productCode) itemData.productCode = req.body.productCode;
    if (req.body.itemCode) itemData.itemCode = req.body.itemCode;
    if (req.body.clickDate) itemData.clickDate = new Date(req.body.clickDate);
    if (req.body.clickChannel) itemData.clickChannel = req.body.clickChannel;
    if (req.body.clickerName) itemData.clickerName = req.body.clickerName;
    if (req.body.customerName) itemData.customerName = req.body.customerName;
    if (req.body.productName) itemData.productName = req.body.productName;
    if (req.body.productUrl) itemData.productUrl = req.body.productUrl;
    if (req.body.priceYen !== undefined) itemData.priceYen = Math.round(parseFloat(req.body.priceYen));
    if (req.body.priceBaht !== undefined) itemData.priceBaht = Math.ceil(parseFloat(req.body.priceBaht)); // ปัดเศษขึ้น
    if (req.body.weight !== undefined) itemData.weight = parseFloat(req.body.weight);
    if (req.body.shippingCost !== undefined) itemData.shippingCost = Math.ceil(parseFloat(req.body.shippingCost)); // ปัดเศษขึ้น
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

    // 🆕 Status detail fields - รายละเอียดแต่ละสถานะ
    if (req.body.jpOrderNumber) itemData.jpOrderNumber = req.body.jpOrderNumber;
    if (req.body.jpOrderDate) itemData.jpOrderDate = new Date(req.body.jpOrderDate);
    if (req.body.warehouseDate) itemData.warehouseDate = new Date(req.body.warehouseDate);
    if (req.body.shipmentBatch) itemData.shipmentBatch = req.body.shipmentBatch;
    if (req.body.exportDate) itemData.exportDate = new Date(req.body.exportDate);
    if (req.body.arrivalDate) itemData.arrivalDate = new Date(req.body.arrivalDate);
    if (req.body.courierName) itemData.courierName = req.body.courierName;
    if (req.body.deliveryDate) itemData.deliveryDate = new Date(req.body.deliveryDate);
    if (req.body.statusRemarks) itemData.statusRemarks = req.body.statusRemarks;

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
    await recalculateOrderTotals(item.orderId);

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

// Status step names for timeline (Thai) - 9 steps
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

// PATCH /api/v1/order-items/:id - Update order item
router.patch('/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    // Get current item to check if status actually changed and to compare images
    const currentItem = await prisma.orderItem.findUnique({
      where: { id: req.params.id },
      select: { statusStep: true, orderId: true, productImages: true },
    });

    if (!currentItem) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order item not found' },
      });
    }

    // Handle image deletion from Cloudinary when productImages changes
    if (req.body.productImages !== undefined) {
      const oldImages = (currentItem.productImages as string[]) || [];
      const newImages = req.body.productImages || [];

      // Find removed images
      const removedImages = oldImages.filter(img => !newImages.includes(img));

      // Delete removed images from Cloudinary
      for (const imageUrl of removedImages) {
        if (isCloudinaryUrl(imageUrl)) {
          console.log('[OrderItems] Deleting removed image from Cloudinary:', imageUrl);
          await deleteFromCloudinary(imageUrl);
        }
      }
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    // Update all fields if provided
    // trackingCode จะไม่เปลี่ยนเมื่อแก้ไข - ใช้รหัสเดิมตลอด
    if (req.body.sequenceNumber !== undefined) {
      updateData.sequenceNumber = parseInt(req.body.sequenceNumber);
    }

    // productCode can be manually updated by admin (e.g., SKU from JP store)
    if (req.body.productCode !== undefined) updateData.productCode = req.body.productCode;
    if (req.body.itemCode !== undefined) updateData.itemCode = req.body.itemCode;
    if (req.body.clickDate !== undefined) updateData.clickDate = req.body.clickDate ? new Date(req.body.clickDate) : null;
    if (req.body.clickChannel !== undefined) updateData.clickChannel = req.body.clickChannel;
    if (req.body.clickerName !== undefined) updateData.clickerName = req.body.clickerName;
    if (req.body.customerName !== undefined) updateData.customerName = req.body.customerName;
    if (req.body.productName !== undefined) updateData.productName = req.body.productName;
    if (req.body.productUrl !== undefined) updateData.productUrl = req.body.productUrl;
    if (req.body.priceYen !== undefined) updateData.priceYen = req.body.priceYen ? Math.round(parseFloat(req.body.priceYen)) : null;
    if (req.body.priceBaht !== undefined) updateData.priceBaht = req.body.priceBaht ? Math.ceil(parseFloat(req.body.priceBaht)) : null; // ปัดเศษขึ้น
    if (req.body.weight !== undefined) updateData.weight = req.body.weight ? parseFloat(req.body.weight) : null;
    if (req.body.shippingCost !== undefined) updateData.shippingCost = req.body.shippingCost ? Math.ceil(parseFloat(req.body.shippingCost)) : null; // ปัดเศษขึ้น
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

    // 🆕 Status detail fields - รายละเอียดแต่ละสถานะ
    if (req.body.jpOrderNumber !== undefined) updateData.jpOrderNumber = req.body.jpOrderNumber || null;
    if (req.body.jpOrderDate !== undefined) updateData.jpOrderDate = req.body.jpOrderDate ? new Date(req.body.jpOrderDate) : null;
    if (req.body.warehouseDate !== undefined) updateData.warehouseDate = req.body.warehouseDate ? new Date(req.body.warehouseDate) : null;
    if (req.body.shipmentBatch !== undefined) updateData.shipmentBatch = req.body.shipmentBatch || null;
    if (req.body.exportDate !== undefined) updateData.exportDate = req.body.exportDate ? new Date(req.body.exportDate) : null;
    if (req.body.arrivalDate !== undefined) updateData.arrivalDate = req.body.arrivalDate ? new Date(req.body.arrivalDate) : null;
    if (req.body.courierName !== undefined) updateData.courierName = req.body.courierName || null;
    if (req.body.deliveryDate !== undefined) updateData.deliveryDate = req.body.deliveryDate ? new Date(req.body.deliveryDate) : null;
    if (req.body.statusRemarks !== undefined) updateData.statusRemarks = req.body.statusRemarks;

    // Handle status step change with history logging
    // Only send notification if status ACTUALLY changed (not same as current)
    let statusChanged = false;
    let newStatusStep: number | undefined;
    if (req.body.statusStep !== undefined) {
      newStatusStep = parseInt(req.body.statusStep);
      updateData.statusStep = newStatusStep;
      // Check if status actually changed from current value
      statusChanged = currentItem.statusStep !== newStatusStep;

      if (statusChanged) {
        console.log(`[OrderItems] Status changed from ${currentItem.statusStep} to ${newStatusStep}`);
      }
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

      // Send LINE Flex notification to customer if they have LINE ID
      if (item.order?.customer?.lineId) {
        const customerLineId = item.order.customer.lineId;
        const customerName = item.order.customer.companyName || item.order.customer.contactPerson || 'ลูกค้า';
        const orderNumber = item.order.orderNumber;

        // Map statusStep to status key for Flex Message
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
        const statusKey = statusStepToKey[newStatusStep] || 'order_received';

        // Build items array for Flex Message
        // Use trackingCode for customer tracking, or fallback to productName/customerName
        const itemsForFlex = [{
          productCode: item.trackingCode || item.productCode || item.productName || item.customerName || 'สินค้า',
          productName: item.productName || item.customerName || undefined,
        }];

        // Build tracking URL using trackingCode
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5001';
        const trackingUrl = `${frontendUrl}/tracking/${item.trackingCode || orderNumber}`;

        // Send LINE Flex Message notification (non-blocking)
        lineService
          .sendStatusUpdateFlexMessage(
            customerLineId,
            customerName,
            statusKey,
            itemsForFlex,
            orderNumber,
            trackingUrl
          )
          .catch((err) => {
            console.error('[OrderItems] LINE Flex notification error:', err);
          });

        console.log(`[OrderItems] LINE Flex notification sent to ${customerLineId} for status ${newStatusStep}`);
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

    if (statusStep === undefined || statusStep < 1 || statusStep > 9) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'statusStep must be between 1 and 9',
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

    // Filter only items that actually have a different status
    const itemsToUpdate = items.filter(item => item.statusStep !== statusStep);
    const itemsAlreadyAtStatus = items.length - itemsToUpdate.length;

    if (itemsAlreadyAtStatus > 0) {
      console.log(`[OrderItems] ${itemsAlreadyAtStatus} items already at status ${statusStep}, skipping notification for them`);
    }

    // Update all items (even if same status, for consistency)
    await prisma.orderItem.updateMany({
      where: { id: { in: itemIds } },
      data: {
        statusStep,
        updatedAt: new Date(),
      },
    });

    // Create status history entries only for items that changed
    const changedBy = (req as any).user?.email || 'admin';
    if (itemsToUpdate.length > 0) {
      await Promise.all(
        itemsToUpdate.map((item) =>
          prisma.itemStatusHistory.create({
            data: {
              orderItemId: item.id,
              statusStep,
              statusName,
              description: `Bulk update: ${itemsToUpdate.length} items`,
              changedBy,
            },
          })
        )
      );
    }

    // Send LINE notifications if enabled AND there are items that actually changed
    let notificationsSent = 0;
    if (sendNotification && itemsToUpdate.length > 0) {
      // Map statusStep to status key for Flex Message (9 steps)
      const statusStepToKey: Record<number, string> = {
        1: 'order_received',
        2: 'first_payment',
        3: 'ordered_from_japan',
        4: 'arrived_jp_warehouse',
        5: 'shipping_round_assigned',
        6: 'shipped_from_japan',
        7: 'arrived_thailand',
        8: 'out_for_delivery',
        9: 'delivered',
      };

      // Group items by customer
      const customerNotifications = new Map<
        string,
        {
          lineId: string;
          customerName: string;
          orderNumber: string;
          items: Array<{ productCode: string; productName?: string }>;
        }
      >();

      // Group items by customer LINE ID (only items that actually changed)
      for (const item of itemsToUpdate) {
        const lineId = item.order?.customer?.lineId;
        if (lineId) {
          if (!customerNotifications.has(lineId)) {
            customerNotifications.set(lineId, {
              lineId,
              customerName: item.order?.customer?.companyName || item.order?.customer?.contactPerson || 'ลูกค้า',
              orderNumber: item.order?.orderNumber || '',
              items: [],
            });
          }
          customerNotifications.get(lineId)!.items.push({
            productCode: item.trackingCode || item.productCode || item.productName || item.customerName || 'สินค้า',
            productName: item.productName || item.customerName || undefined,
          });
        }
      }

      // Build tracking URL base
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5001';

      // Send Flex Message notification per customer
      for (const [lineId, data] of customerNotifications) {
        const statusKey = statusStepToKey[statusStep] || 'order_received';
        const trackingUrl = `${frontendUrl}/tracking/${data.orderNumber}`;

        lineService
          .sendStatusUpdateFlexMessage(
            lineId,
            data.customerName,
            statusKey,
            data.items,
            data.orderNumber,
            trackingUrl
          )
          .catch((err) => {
            console.error('[OrderItems] Bulk LINE Flex notification error:', err);
          });
        notificationsSent++;
      }
    }

    res.json({
      success: true,
      data: {
        updatedCount: items.length,
        actuallyChangedCount: itemsToUpdate.length,
        alreadyAtStatusCount: itemsAlreadyAtStatus,
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

// POST /api/v1/order-items/:id/lock-price - Lock price based on customer tier
router.post('/:id/lock-price', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { priceYen } = req.body;
    const adminEmail = (req as any).user?.email || (req as any).admin?.email || 'admin';

    // Get order item with order and customer info
    const item = await prisma.orderItem.findUnique({
      where: { id: req.params.id },
      include: {
        order: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order item not found' },
      });
    }

    // Check if already locked
    if (item.priceBahtLocked) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_LOCKED',
          message: 'Price is already locked',
          data: {
            priceBaht: item.priceBaht,
            lockedTierCode: item.lockedTierCode,
            lockedExchangeRate: item.lockedExchangeRate,
            lockedBy: item.lockedBy,
            lockedAt: item.lockedAt,
          },
        },
      });
    }

    // Get customer tier
    const customerTier = item.order?.customer?.tier || 'member';

    // Get exchange rate from CustomerTier table
    let tierInfo = await prisma.customerTier.findUnique({
      where: { tierCode: customerTier },
    });

    // Fallback to default rates if tier not found
    if (!tierInfo) {
      const defaultRates: Record<string, number> = {
        member: 0.25,
        vip: 0.24,
        vvip: 0.23,
      };
      const exchangeRate = defaultRates[customerTier] || 0.25;

      // Use provided priceYen or existing one
      const yenPrice = priceYen !== undefined ? parseFloat(priceYen) : Number(item.priceYen || 0);
      const calculatedBaht = yenPrice * exchangeRate;

      const updatedItem = await prisma.orderItem.update({
        where: { id: req.params.id },
        data: {
          priceYen: yenPrice,
          priceBaht: calculatedBaht,
          priceBahtLocked: true,
          lockedTierCode: customerTier,
          lockedExchangeRate: exchangeRate,
          lockedBy: adminEmail,
          lockedAt: new Date(),
        },
        include: {
          order: {
            include: {
              customer: true,
            },
          },
        },
      });

      return res.json({
        success: true,
        data: updatedItem,
        message: `Price locked: ¥${yenPrice} × ${exchangeRate} = ฿${calculatedBaht.toFixed(2)} (${customerTier} tier - default rate)`,
      });
    }

    const exchangeRate = Number(tierInfo.exchangeRate);
    const yenPrice = priceYen !== undefined ? parseFloat(priceYen) : Number(item.priceYen || 0);
    const calculatedBaht = yenPrice * exchangeRate;

    const updatedItem = await prisma.orderItem.update({
      where: { id: req.params.id },
      data: {
        priceYen: yenPrice,
        priceBaht: calculatedBaht,
        priceBahtLocked: true,
        lockedTierCode: customerTier,
        lockedExchangeRate: exchangeRate,
        lockedBy: adminEmail,
        lockedAt: new Date(),
      },
      include: {
        order: {
          include: {
            customer: true,
          },
        },
      },
    });

    // Recalculate order totals
    await recalculateOrderTotals(updatedItem.orderId);

    res.json({
      success: true,
      data: updatedItem,
      message: `Price locked: ¥${yenPrice} × ${exchangeRate} = ฿${calculatedBaht.toFixed(2)} (${tierInfo.tierName} tier)`,
    });
  } catch (error: any) {
    console.error('Error locking price:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOCK_PRICE_ERROR',
        message: 'Failed to lock price',
        details: error.message,
      },
    });
  }
});

// POST /api/v1/order-items/:id/unlock-price - Unlock price (admin only)
router.post('/:id/unlock-price', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const item = await prisma.orderItem.findUnique({
      where: { id: req.params.id },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order item not found' },
      });
    }

    if (!item.priceBahtLocked) {
      return res.status(400).json({
        success: false,
        error: { code: 'NOT_LOCKED', message: 'Price is not locked' },
      });
    }

    const updatedItem = await prisma.orderItem.update({
      where: { id: req.params.id },
      data: {
        priceBahtLocked: false,
        lockedTierCode: null,
        lockedExchangeRate: null,
        lockedBy: null,
        lockedAt: null,
      },
      include: {
        order: {
          include: {
            customer: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedItem,
      message: 'Price unlocked successfully',
    });
  } catch (error: any) {
    console.error('Error unlocking price:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UNLOCK_PRICE_ERROR',
        message: 'Failed to unlock price',
        details: error.message,
      },
    });
  }
});

// POST /api/v1/order-items/bulk-lock-price - Bulk lock prices for multiple items
router.post('/bulk-lock-price', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { itemIds } = req.body;
    const adminEmail = (req as any).user?.email || (req as any).admin?.email || 'admin';

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'itemIds array is required',
        },
      });
    }

    // Get all items with customer info
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

    // Get all tiers
    const tiers = await prisma.customerTier.findMany({
      where: { isActive: true },
    });

    const tierRates: Record<string, number> = {};
    tiers.forEach(t => {
      tierRates[t.tierCode] = Number(t.exchangeRate);
    });

    // Default rates fallback
    const defaultRates: Record<string, number> = {
      member: 0.25,
      vip: 0.24,
      vvip: 0.23,
    };

    let lockedCount = 0;
    let skippedCount = 0;
    const results: any[] = [];

    for (const item of items) {
      // Skip already locked items
      if (item.priceBahtLocked) {
        skippedCount++;
        results.push({
          id: item.id,
          status: 'skipped',
          reason: 'already_locked',
        });
        continue;
      }

      // Skip items without priceYen
      if (!item.priceYen) {
        skippedCount++;
        results.push({
          id: item.id,
          status: 'skipped',
          reason: 'no_price_yen',
        });
        continue;
      }

      const customerTier = item.order?.customer?.tier || 'member';
      const exchangeRate = tierRates[customerTier] || defaultRates[customerTier] || 0.25;
      const yenPrice = Number(item.priceYen);
      const calculatedBaht = yenPrice * exchangeRate;

      await prisma.orderItem.update({
        where: { id: item.id },
        data: {
          priceBaht: calculatedBaht,
          priceBahtLocked: true,
          lockedTierCode: customerTier,
          lockedExchangeRate: exchangeRate,
          lockedBy: adminEmail,
          lockedAt: new Date(),
        },
      });

      lockedCount++;
      results.push({
        id: item.id,
        status: 'locked',
        priceYen: yenPrice,
        priceBaht: calculatedBaht,
        tier: customerTier,
        exchangeRate,
      });
    }

    res.json({
      success: true,
      data: {
        totalItems: items.length,
        lockedCount,
        skippedCount,
        results,
      },
      message: `Locked ${lockedCount} items, skipped ${skippedCount} items`,
    });
  } catch (error: any) {
    console.error('Error bulk locking prices:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BULK_LOCK_ERROR',
        message: 'Failed to bulk lock prices',
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
        if (item.productName) itemData.productName = item.productName;
        if (item.productUrl) itemData.productUrl = item.productUrl;
        if (item.priceYen) itemData.priceYen = Math.round(parseFloat(item.priceYen));
        if (item.priceBaht) itemData.priceBaht = Math.ceil(parseFloat(item.priceBaht)); // ปัดเศษขึ้น
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

export default router;
