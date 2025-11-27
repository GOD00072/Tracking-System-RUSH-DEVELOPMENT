import express from 'express';
import prisma from '../lib/prisma';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

// All customer routes require admin authentication
router.use(authenticateAdmin);

// GET /api/v1/customers/search-line-users - Search for users with LINE User IDs
router.get('/search-line-users', async (req, res) => {
  try {
    const query = req.query.query as string;

    if (!query || query.trim() === '') {
      return res.json({
        success: true,
        data: [],
      });
    }

    const searchTerm = `%${query}%`;

    // Search for users with LINE User ID that match the query
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            lineId: {
              not: null,
            },
          },
          {
            OR: [
              {
                fullName: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                lineId: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                phone: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        lineId: true,
        profilePicture: true,
        avatarUrl: true,
        createdAt: true,
      },
      take: 20,
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error searching LINE users:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: 'Failed to search LINE users',
      },
    });
  }
});

// GET /api/v1/customers - Get all customers
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
          orders: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
            },
            take: 5,
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.customer.count(),
    ]);

    res.json({
      success: true,
      data: customers,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch customers',
      },
    });
  }
});

// GET /api/v1/customers/:id - Get single customer with full order history
router.get('/:id', async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        orders: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            orderItems: {
              select: {
                id: true,
                productCode: true,
                customerName: true,
                priceYen: true,
                priceBaht: true,
                itemStatus: true,
                statusStep: true,
              },
            },
            _count: {
              select: { orderItems: true },
            },
          },
        },
      },
    });

    // Calculate customer statistics
    if (customer) {
      const orderStats = await prisma.orderItem.aggregate({
        where: {
          order: {
            customerId: customer.id,
          },
        },
        _sum: {
          priceYen: true,
          priceBaht: true,
        },
        _count: true,
      });

      (customer as any).stats = {
        totalOrders: customer.orders.length,
        totalItems: orderStats._count,
        totalYen: orderStats._sum.priceYen || 0,
        totalBaht: orderStats._sum.priceBaht || 0,
      };
    }

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Customer not found',
        },
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch customer',
      },
    });
  }
});

// POST /api/v1/customers - Create customer
router.post('/', async (req, res) => {
  try {
    // UUID validation regex
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Clean up userId - convert invalid UUIDs to null
    const cleanUserId = req.body.userId && req.body.userId.trim() !== '' && uuidRegex.test(req.body.userId)
      ? req.body.userId
      : null;

    const customer = await prisma.customer.create({
      data: {
        userId: cleanUserId,
        airtableId: req.body.airtableId || null,
        companyName: req.body.companyName || null,
        contactPerson: req.body.contactPerson || null,
        phone: req.body.phone || null,
        lineId: req.body.lineId || null,
        address: req.body.address || null,
        notes: req.body.notes || null,
      },
      include: {
        user: true,
      },
    });

    res.status(201).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: 'Failed to create customer',
      },
    });
  }
});

// PATCH /api/v1/customers/:id - Update customer
router.patch('/:id', async (req, res) => {
  try {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (req.body.companyName !== undefined) updateData.companyName = req.body.companyName;
    if (req.body.contactPerson !== undefined) updateData.contactPerson = req.body.contactPerson;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone;
    if (req.body.lineId !== undefined) updateData.lineId = req.body.lineId;
    if (req.body.address !== undefined) updateData.address = req.body.address;
    if (req.body.notes !== undefined) updateData.notes = req.body.notes;
    if (req.body.airtableId !== undefined) updateData.airtableId = req.body.airtableId;

    // 🆕 Customer tier system fields
    if (req.body.tier !== undefined) {
      updateData.tier = req.body.tier;
      // Auto-set vipSince when upgrading to VIP or premium
      if ((req.body.tier === 'vip' || req.body.tier === 'premium') && !req.body.vipSince) {
        const customer = await prisma.customer.findUnique({
          where: { id: req.params.id },
          select: { tier: true, vipSince: true },
        });
        // Only set vipSince if upgrading from regular
        if (customer && customer.tier === 'regular' && !customer.vipSince) {
          updateData.vipSince = new Date();
        }
      }
    }
    if (req.body.discount !== undefined) updateData.discount = req.body.discount ? parseFloat(req.body.discount) : null;
    if (req.body.totalSpent !== undefined) updateData.totalSpent = req.body.totalSpent ? parseFloat(req.body.totalSpent) : 0;
    if (req.body.vipSince !== undefined) updateData.vipSince = req.body.vipSince ? new Date(req.body.vipSince) : null;

    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        user: true,
      },
    });

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update customer',
      },
    });
  }
});

// DELETE /api/v1/customers/:id - Delete customer
router.delete('/:id', async (req, res) => {
  try {
    await prisma.customer.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to delete customer',
      },
    });
  }
});

export default router;
