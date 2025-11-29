import express from 'express';
import prisma from '../../lib/prisma';
import { authenticateAdmin, AuthRequest } from '../../middleware/auth';
import { lineService } from '../../services/lineService';

const router = express.Router();

// Helper function to generate order number
async function generateOrderNumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}-ORD-`;

  const latestOrder = await prisma.order.findFirst({
    where: {
      orderNumber: {
        startsWith: datePrefix,
      },
    },
    orderBy: {
      orderNumber: 'desc',
    },
    select: {
      orderNumber: true,
    },
  });

  let nextNumber = 1;
  if (latestOrder) {
    const parts = latestOrder.orderNumber.split('-');
    const currentNumber = parseInt(parts[parts.length - 1], 10);
    nextNumber = currentNumber + 1;
  }

  const orderNumber = `${datePrefix}${String(nextNumber).padStart(3, '0')}`;
  return orderNumber;
}

// GET /api/v1/admin/orders - Get all orders (Admin only)
router.get('/', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;
    const status = req.query.status as string;

    // Build where clause for filtering
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { origin: { contains: search, mode: 'insensitive' } },
        { destination: { contains: search, mode: 'insensitive' } },
        {
          customer: {
            OR: [
              { companyName: { contains: search, mode: 'insensitive' } },
              { contactPerson: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        skip,
        take: limit,
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
          shipments: {
            select: {
              id: true,
              trackingNumber: true,
              currentStatus: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.order.count({ where: whereClause }),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch orders',
      },
    });
  }
});

// GET /api/v1/admin/orders/:id - Get single order
router.get('/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        shipments: {
          include: {
            trackingHistory: {
              orderBy: {
                timestamp: 'desc',
              },
            },
          },
        },
        reviews: true,
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

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch order',
      },
    });
  }
});

// POST /api/v1/admin/orders - Create order
router.post('/', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    // Auto-generate order number if not provided
    const orderNumber = req.body.orderNumber || await generateOrderNumber();

    const orderData: any = {
      orderNumber: orderNumber,
      customerId: req.body.customerId,
      shippingMethod: req.body.shippingMethod,
      status: req.body.status || 'pending',
      origin: req.body.origin,
      destination: req.body.destination,
      notes: req.body.notes,
    };

    // Convert numeric fields
    if (req.body.totalWeight !== undefined) {
      orderData.totalWeight = parseFloat(req.body.totalWeight);
    }
    if (req.body.totalVolume !== undefined) {
      orderData.totalVolume = parseFloat(req.body.totalVolume);
    }
    if (req.body.estimatedCost !== undefined) {
      orderData.estimatedCost = parseFloat(req.body.estimatedCost);
    }
    if (req.body.actualCost !== undefined) {
      orderData.actualCost = parseFloat(req.body.actualCost);
    }

    // Convert date field
    if (req.body.estimatedDelivery) {
      orderData.estimatedDelivery = new Date(req.body.estimatedDelivery);
    }

    const order = await prisma.order.create({
      data: orderData,
      include: {
        customer: true,
      },
    });

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    console.error('Error creating order:', error);

    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ERROR',
          message: `Order with this ${field.replace('_', ' ')} already exists`,
          field: field,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: 'Failed to create order',
        details: error.message,
      },
    });
  }
});

// PATCH /api/v1/admin/orders/:id - Update order
router.patch('/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    // Get current order to check if status changed
    const currentOrder = await prisma.order.findUnique({
      where: { id: req.params.id },
      select: { status: true },
    });

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (req.body.orderNumber !== undefined) updateData.orderNumber = req.body.orderNumber;
    if (req.body.customerId !== undefined) updateData.customerId = req.body.customerId;
    if (req.body.shippingMethod !== undefined) updateData.shippingMethod = req.body.shippingMethod;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.statusStep !== undefined) updateData.statusStep = parseInt(req.body.statusStep);
    if (req.body.origin !== undefined) updateData.origin = req.body.origin;
    if (req.body.destination !== undefined) updateData.destination = req.body.destination;
    if (req.body.notes !== undefined) updateData.notes = req.body.notes;

    // Convert numeric fields
    if (req.body.totalWeight !== undefined) {
      updateData.totalWeight = parseFloat(req.body.totalWeight);
    }
    if (req.body.totalVolume !== undefined) {
      updateData.totalVolume = parseFloat(req.body.totalVolume);
    }
    if (req.body.estimatedCost !== undefined) {
      updateData.estimatedCost = parseFloat(req.body.estimatedCost);
    }
    if (req.body.actualCost !== undefined) {
      updateData.actualCost = parseFloat(req.body.actualCost);
    }

    // Convert date field
    if (req.body.estimatedDelivery !== undefined) {
      updateData.estimatedDelivery = req.body.estimatedDelivery
        ? new Date(req.body.estimatedDelivery)
        : null;
    }

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        customer: {
          include: {
            user: true,
          },
        },
        shipments: true,
      },
    });

    // Send LINE notification if status changed
    const statusChanged = currentOrder && updateData.status && currentOrder.status !== updateData.status;

    if (statusChanged) {
      // Check LINE settings
      const lineSettings = await prisma.systemSetting.findUnique({
        where: { key: 'line_oa' },
      });

      if (lineSettings && lineSettings.value) {
        const settings = lineSettings.value as any;

        if (settings.enabled && settings.auto_notify_shipping_update) {
          const notifyStatuses = settings.notify_on_status || [];

          // Check if this status should trigger notification
          if (notifyStatuses.includes(updateData.status)) {
            // Get customer's LINE ID
            const lineId = order.customer?.user?.lineId;

            if (lineId) {
              // Get tracking info from first shipment
              const trackingNumber = order.shipments?.[0]?.trackingNumber;
              const currentLocation = order.shipments?.[0]?.currentLocation;

              // Send notification asynchronously (don't block response)
              lineService.sendShippingUpdateNotification(
                lineId,
                order.orderNumber,
                updateData.status,
                trackingNumber,
                currentLocation
              ).then(success => {
                if (success) {
                  console.log(`[Order Update] LINE notification sent to ${lineId} for order ${order.orderNumber}`);
                } else {
                  console.error(`[Order Update] Failed to send LINE notification for order ${order.orderNumber}`);
                }
              }).catch(error => {
                console.error(`[Order Update] Error sending LINE notification:`, error);
              });
            } else {
              console.log(`[Order Update] Customer has no LINE ID, skipping notification for order ${order.orderNumber}`);
            }
          } else {
            console.log(`[Order Update] Status ${updateData.status} not in notify list, skipping notification`);
          }
        }
      }
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update order',
      },
    });
  }
});

// DELETE /api/v1/admin/orders/:id - Delete order
router.delete('/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    await prisma.order.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to delete order',
      },
    });
  }
});

export default router;
