import express from 'express';
import prisma from '../lib/prisma';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();

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

    // Search in multiple fields
    if (search) {
      whereClause.OR = [
        { productCode: { contains: search, mode: 'insensitive' } },
        { productUrl: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { clickerName: { contains: search, mode: 'insensitive' } },
        { trackingNumber: { contains: search, mode: 'insensitive' } },
      ];
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

// GET /api/v1/order-items/:id - Get single order item
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
    if (req.body.itemStatus) itemData.itemStatus = req.body.itemStatus;
    if (req.body.paymentStatus) itemData.paymentStatus = req.body.paymentStatus;
    if (req.body.shippingRound) itemData.shippingRound = req.body.shippingRound;
    if (req.body.trackingNumber) itemData.trackingNumber = req.body.trackingNumber;
    if (req.body.storePage) itemData.storePage = req.body.storePage;
    if (req.body.remarks) itemData.remarks = req.body.remarks;

    const item = await prisma.orderItem.create({
      data: itemData,
      include: {
        order: {
          include: {
            customer: true,
          },
        },
      },
    });

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
    if (req.body.itemStatus !== undefined) updateData.itemStatus = req.body.itemStatus;
    if (req.body.paymentStatus !== undefined) updateData.paymentStatus = req.body.paymentStatus;
    if (req.body.shippingRound !== undefined) updateData.shippingRound = req.body.shippingRound;
    if (req.body.trackingNumber !== undefined) updateData.trackingNumber = req.body.trackingNumber;
    if (req.body.storePage !== undefined) updateData.storePage = req.body.storePage;
    if (req.body.remarks !== undefined) updateData.remarks = req.body.remarks;

    const item = await prisma.orderItem.update({
      where: { id: req.params.id },
      data: updateData,
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
    await prisma.orderItem.delete({
      where: { id: req.params.id },
    });

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

export default router;
