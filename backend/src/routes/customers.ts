import express from 'express';
import prisma from '../lib/prisma';
import { authenticateAdmin } from '../middleware/auth';
import { Decimal } from '@prisma/client/runtime/library';

const router = express.Router();

// Helper function to calculate tier from spending
async function calculateTierFromSpending(totalSpent: number) {
  const tiers = await prisma.customerTier.findMany({
    where: { isActive: true },
    orderBy: { minSpent: 'desc' },
  });

  const matchedTier = tiers.find(t => {
    const minSpent = Number(t.minSpent);
    const maxSpent = t.maxSpent ? Number(t.maxSpent) : Infinity;
    return totalSpent >= minSpent && totalSpent <= maxSpent;
  });

  return matchedTier || tiers.find(t => t.tierCode === 'member') || null;
}

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

      // Get verified payments total
      const verifiedPayments = await prisma.payment.aggregate({
        where: {
          orderItem: {
            order: {
              customerId: customer.id,
            },
          },
          status: 'verified',
        },
        _sum: {
          amountBaht: true,
          amountYen: true,
        },
      });

      // Get pending payments total
      const pendingPayments = await prisma.payment.aggregate({
        where: {
          orderItem: {
            order: {
              customerId: customer.id,
            },
          },
          status: 'pending',
        },
        _sum: {
          amountBaht: true,
          amountYen: true,
        },
      });

      (customer as any).stats = {
        totalOrders: customer.orders.length,
        totalItems: orderStats._count,
        totalYen: orderStats._sum.priceYen || 0,
        totalBaht: orderStats._sum.priceBaht || 0,
        // Verified payment amounts
        verifiedBaht: verifiedPayments._sum.amountBaht || 0,
        verifiedYen: verifiedPayments._sum.amountYen || 0,
        // Pending payment amounts
        pendingBaht: pendingPayments._sum.amountBaht || 0,
        pendingYen: pendingPayments._sum.amountYen || 0,
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
        // New fields
        profileImageUrl: req.body.profileImageUrl || null,
        email: req.body.email || null,
        taxId: req.body.taxId || null,
        shippingAddress: req.body.shippingAddress || null,
        billingAddress: req.body.billingAddress || null,
        province: req.body.province || null,
        postalCode: req.body.postalCode || null,
        country: req.body.country || 'Thailand',
        dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : null,
        preferredContact: req.body.preferredContact || 'line',
        referralSource: req.body.referralSource || null,
        tags: req.body.tags || [],
        tier: req.body.tier || 'member',
        discount: req.body.discount ? parseFloat(req.body.discount) : null,
        // totalSpent starts at 0 - calculated automatically from verified payments
        totalSpent: 0,
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

    // Basic fields
    if (req.body.companyName !== undefined) updateData.companyName = req.body.companyName;
    if (req.body.contactPerson !== undefined) updateData.contactPerson = req.body.contactPerson;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone;
    if (req.body.lineId !== undefined) updateData.lineId = req.body.lineId;
    if (req.body.address !== undefined) updateData.address = req.body.address;
    if (req.body.notes !== undefined) updateData.notes = req.body.notes;
    if (req.body.airtableId !== undefined) updateData.airtableId = req.body.airtableId;

    // New fields
    if (req.body.profileImageUrl !== undefined) updateData.profileImageUrl = req.body.profileImageUrl;
    if (req.body.email !== undefined) updateData.email = req.body.email;
    if (req.body.taxId !== undefined) updateData.taxId = req.body.taxId;
    if (req.body.shippingAddress !== undefined) updateData.shippingAddress = req.body.shippingAddress;
    if (req.body.billingAddress !== undefined) updateData.billingAddress = req.body.billingAddress;
    if (req.body.province !== undefined) updateData.province = req.body.province;
    if (req.body.postalCode !== undefined) updateData.postalCode = req.body.postalCode;
    if (req.body.country !== undefined) updateData.country = req.body.country;
    if (req.body.dateOfBirth !== undefined) updateData.dateOfBirth = req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : null;
    if (req.body.preferredContact !== undefined) updateData.preferredContact = req.body.preferredContact;
    if (req.body.referralSource !== undefined) updateData.referralSource = req.body.referralSource;
    if (req.body.tags !== undefined) updateData.tags = req.body.tags;
    if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;

    // Customer tier system fields
    if (req.body.tier !== undefined) {
      updateData.tier = req.body.tier;
      // Auto-set vipSince when upgrading to VIP or premium
      if ((req.body.tier === 'vip' || req.body.tier === 'vvip' || req.body.tier === 'premium') && !req.body.vipSince) {
        const customer = await prisma.customer.findUnique({
          where: { id: req.params.id },
          select: { tier: true, vipSince: true },
        });
        // Only set vipSince if upgrading from regular/member
        if (customer && (customer.tier === 'regular' || customer.tier === 'member') && !customer.vipSince) {
          updateData.vipSince = new Date();
        }
      }
    }
    if (req.body.discount !== undefined) updateData.discount = req.body.discount ? parseFloat(req.body.discount) : null;
    // totalSpent is calculated automatically from verified payments - cannot be manually edited
    // Use POST /:id/recalculate-spending to update totalSpent
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

// GET /api/v1/customers/:id/tier-info - Get customer tier info with exchange rate
router.get('/:id/tier-info', async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        tier: true,
        totalSpent: true,
        vipSince: true,
        contactPerson: true,
        companyName: true,
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Customer not found',
        },
      });
    }

    // Get tier details
    const tierInfo = await prisma.customerTier.findUnique({
      where: { tierCode: customer.tier },
    });

    // Get all tiers for progress calculation
    const allTiers = await prisma.customerTier.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Calculate progress to next tier
    const totalSpent = Number(customer.totalSpent || 0);
    const currentTierIndex = allTiers.findIndex(t => t.tierCode === customer.tier);
    const nextTier = currentTierIndex < allTiers.length - 1 ? allTiers[currentTierIndex + 1] : null;

    let progressToNext = 100;
    let amountToNext = 0;

    if (nextTier) {
      const currentMin = Number(tierInfo?.minSpent || 0);
      const nextMin = Number(nextTier.minSpent);
      progressToNext = Math.min(100, ((totalSpent - currentMin) / (nextMin - currentMin)) * 100);
      amountToNext = Math.max(0, nextMin - totalSpent);
    }

    res.json({
      success: true,
      data: {
        customer: {
          id: customer.id,
          name: customer.contactPerson || customer.companyName,
          totalSpent,
          vipSince: customer.vipSince,
        },
        currentTier: tierInfo,
        nextTier,
        progressToNext: Math.round(progressToNext * 100) / 100,
        amountToNext: Math.round(amountToNext * 100) / 100,
        allTiers,
      },
    });
  } catch (error) {
    console.error('Error fetching customer tier info:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch tier info',
      },
    });
  }
});

// POST /api/v1/customers/:id/add-spending - Add spending to customer (updates totalSpent and auto-upgrade tier)
router.post('/:id/add-spending', async (req, res) => {
  try {
    const { amount, description } = req.body;
    const adminEmail = (req as any).admin?.email || 'admin';

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_AMOUNT',
          message: 'Amount must be a positive number',
        },
      });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Customer not found',
        },
      });
    }

    const currentSpent = Number(customer.totalSpent || 0);
    const newTotalSpent = currentSpent + Number(amount);

    // Calculate new tier based on spending
    const newTierData = await calculateTierFromSpending(newTotalSpent);
    const shouldUpgrade = newTierData && newTierData.tierCode !== customer.tier;

    // Update customer
    const updatedCustomer = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        totalSpent: new Decimal(newTotalSpent),
        ...(shouldUpgrade && {
          tier: newTierData!.tierCode,
          vipSince: newTierData!.tierCode !== 'member' && !customer.vipSince ? new Date() : customer.vipSince,
        }),
      },
    });

    // Record tier change if upgraded
    if (shouldUpgrade && newTierData) {
      await prisma.tierHistory.create({
        data: {
          customerId: customer.id,
          previousTier: customer.tier,
          newTier: newTierData.tierCode,
          reason: 'auto_upgrade',
          totalSpentAt: new Decimal(newTotalSpent),
          changedBy: 'system',
        },
      });
    }

    res.json({
      success: true,
      data: {
        customer: updatedCustomer,
        previousTotalSpent: currentSpent,
        newTotalSpent,
        addedAmount: Number(amount),
        tierUpgraded: shouldUpgrade,
        previousTier: customer.tier,
        newTier: updatedCustomer.tier,
        tierInfo: newTierData,
      },
      message: shouldUpgrade
        ? `Spending added and customer upgraded to ${newTierData?.tierName}!`
        : 'Spending added successfully',
    });
  } catch (error) {
    console.error('Error adding spending:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ADD_SPENDING_ERROR',
        message: 'Failed to add spending',
      },
    });
  }
});

// POST /api/v1/customers/:id/recalculate-spending - Recalculate total spending from orders
router.post('/:id/recalculate-spending', async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Customer not found',
        },
      });
    }

    // Calculate total from verified payments
    const paymentsTotal = await prisma.payment.aggregate({
      where: {
        orderItem: {
          order: {
            customerId: req.params.id,
          },
        },
        status: 'verified',
      },
      _sum: {
        amountBaht: true,
      },
    });

    const calculatedTotal = Number(paymentsTotal._sum.amountBaht || 0);
    const previousTotal = Number(customer.totalSpent || 0);

    // Calculate new tier
    const newTierData = await calculateTierFromSpending(calculatedTotal);
    const shouldUpdate = newTierData && newTierData.tierCode !== customer.tier;

    // Update customer
    const updatedCustomer = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        totalSpent: new Decimal(calculatedTotal),
        ...(shouldUpdate && {
          tier: newTierData!.tierCode,
          vipSince: newTierData!.tierCode !== 'member' && !customer.vipSince ? new Date() : customer.vipSince,
        }),
      },
    });

    // Record tier change if changed
    if (shouldUpdate && newTierData) {
      await prisma.tierHistory.create({
        data: {
          customerId: customer.id,
          previousTier: customer.tier,
          newTier: newTierData.tierCode,
          reason: 'recalculation',
          totalSpentAt: new Decimal(calculatedTotal),
          changedBy: 'system',
        },
      });
    }

    res.json({
      success: true,
      data: {
        customer: updatedCustomer,
        previousTotalSpent: previousTotal,
        calculatedTotalSpent: calculatedTotal,
        difference: calculatedTotal - previousTotal,
        tierChanged: shouldUpdate,
        previousTier: customer.tier,
        newTier: updatedCustomer.tier,
        tierInfo: newTierData,
      },
      message: shouldUpdate
        ? `Total recalculated and tier updated to ${newTierData?.tierName}`
        : 'Total spending recalculated successfully',
    });
  } catch (error) {
    console.error('Error recalculating spending:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'RECALCULATE_ERROR',
        message: 'Failed to recalculate spending',
      },
    });
  }
});

// GET /api/v1/customers/by-tier/:tierCode - Get customers by tier
router.get('/by-tier/:tierCode', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where: { tier: req.params.tierCode },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              lineId: true,
            },
          },
        },
        orderBy: [
          { totalSpent: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.customer.count({
        where: { tier: req.params.tierCode },
      }),
    ]);

    // Get tier info
    const tierInfo = await prisma.customerTier.findUnique({
      where: { tierCode: req.params.tierCode },
    });

    res.json({
      success: true,
      data: {
        customers,
        tierInfo,
      },
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching customers by tier:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch customers',
      },
    });
  }
});

// GET /api/v1/customers/stats/tier-summary - Get tier statistics summary
router.get('/stats/tier-summary', async (req, res) => {
  try {
    // Get all tiers
    const tiers = await prisma.customerTier.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Get customer count and total spent per tier
    const tierStats = await Promise.all(
      tiers.map(async tier => {
        const stats = await prisma.customer.aggregate({
          where: { tier: tier.tierCode },
          _count: true,
          _sum: { totalSpent: true },
          _avg: { totalSpent: true },
        });

        return {
          tier,
          customerCount: stats._count,
          totalSpent: Number(stats._sum.totalSpent || 0),
          averageSpent: Number(stats._avg.totalSpent || 0),
        };
      })
    );

    // Overall statistics
    const overallStats = await prisma.customer.aggregate({
      _count: true,
      _sum: { totalSpent: true },
      _avg: { totalSpent: true },
    });

    res.json({
      success: true,
      data: {
        tierStats,
        overall: {
          totalCustomers: overallStats._count,
          totalSpent: Number(overallStats._sum.totalSpent || 0),
          averageSpent: Number(overallStats._avg.totalSpent || 0),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching tier statistics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch tier statistics',
      },
    });
  }
});

export default router;
