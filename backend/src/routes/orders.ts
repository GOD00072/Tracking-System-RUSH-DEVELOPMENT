import express from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// GET /api/v1/orders/all - Get all orders (no auth, for admin/debug)
router.get('/all', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        customerId: true,
        status: true,
        origin: true,
        destination: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    res.json({
      success: true,
      data: orders,
      total: orders.length,
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch orders',
      },
    });
  }
});

// Helper function to generate order number
async function generateOrderNumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}-ORD-`;

  // Find the latest order number for today
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
    // Extract the number part from the order number (e.g., "20251104-ORD-003" -> "003")
    const parts = latestOrder.orderNumber.split('-');
    const currentNumber = parseInt(parts[parts.length - 1], 10);
    nextNumber = currentNumber + 1;
  }

  // Format: YYYYMMDD-ORD-XXX (e.g., 20251104-ORD-001)
  const orderNumber = `${datePrefix}${String(nextNumber).padStart(3, '0')}`;
  return orderNumber;
}

// GET /api/v1/orders
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Get authenticated user info
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      select: {
        id: true,
        fullName: true,
        phone: true,
        lineId: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    // Build filter based on user role
    let whereClause: any = {};

    // If user is not admin, filter orders by matching phone or LINE ID
    if (user.role !== 'admin') {
      // Find customers that match user's phone or LINE ID
      const matchingCustomers = await prisma.customer.findMany({
        where: {
          OR: [
            { phone: user.phone || undefined },
            { lineId: user.lineId || undefined },
          ],
        },
        select: {
          id: true,
        },
      });

      const customerIds = matchingCustomers.map((c) => c.id);

      // Only show orders for matching customers
      whereClause.customerId = {
        in: customerIds,
      };

      // If no matching customers, return empty result
      if (customerIds.length === 0) {
        return res.json({
          success: true,
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            total_pages: 0,
          },
        });
      }
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
              tier: true,
            },
          },
          shipments: {
            select: {
              id: true,
              trackingNumber: true,
              currentStatus: true,
              currentLocation: true,
            },
          },
          _count: {
            select: { orderItems: true },
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

// GET /api/v1/orders/:id
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Get authenticated user info
    const user = await prisma.user.findUnique({
      where: { id: req.user?.userId },
      select: {
        id: true,
        fullName: true,
        phone: true,
        lineId: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

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

    // If user is not admin, verify ownership
    if (user.role !== 'admin') {
      // Check if order's customer matches user's phone or LINE ID
      const hasAccess =
        (order.customer?.phone && order.customer.phone === user.phone) ||
        (order.customer?.lineId && order.customer.lineId === user.lineId);

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access this order',
          },
        });
      }
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

// POST /api/v1/orders
router.post('/', async (req, res) => {
  try {
    // Auto-generate order number if not provided
    const orderNumber = req.body.orderNumber || await generateOrderNumber();

    // Prepare data with proper type conversions
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

    // Convert date field - handle both date string and datetime string
    if (req.body.estimatedDelivery) {
      const dateStr = req.body.estimatedDelivery;
      // If it's just a date string (YYYY-MM-DD), convert to Date object
      orderData.estimatedDelivery = new Date(dateStr);
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

    // Handle Prisma unique constraint violation
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

    // Handle other errors
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

// PATCH /api/v1/orders/:id
router.patch('/:id', async (req, res) => {
  try {
    // Prepare update data with proper type conversions
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Copy fields from request body
    if (req.body.orderNumber !== undefined) updateData.orderNumber = req.body.orderNumber;
    if (req.body.customerId !== undefined) updateData.customerId = req.body.customerId;
    if (req.body.shippingMethod !== undefined) updateData.shippingMethod = req.body.shippingMethod;
    if (req.body.status !== undefined) updateData.status = req.body.status;
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
        customer: true,
        shipments: true,
      },
    });

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

// DELETE /api/v1/orders/:id
router.delete('/:id', async (req, res) => {
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
