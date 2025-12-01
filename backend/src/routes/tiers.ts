import express from 'express';
import prisma from '../lib/prisma';
import { authenticateAdmin } from '../middleware/auth';
import { Decimal } from '@prisma/client/runtime/library';

const router = express.Router();

// Default tiers for initialization
const DEFAULT_TIERS = [
  {
    tierCode: 'member',
    tierName: 'Member',
    tierNameTh: 'สมาชิก',
    exchangeRate: 0.25,
    minSpent: 0,
    maxSpent: 9999,
    benefits: { freeShipping: false, prioritySupport: false },
    color: '#6B7280', // gray
    icon: 'User',
    sortOrder: 1,
  },
  {
    tierCode: 'vip',
    tierName: 'VIP',
    tierNameTh: 'วีไอพี',
    exchangeRate: 0.24,
    minSpent: 10000,
    maxSpent: 49999,
    benefits: { freeShipping: false, prioritySupport: true },
    color: '#F59E0B', // amber
    icon: 'Star',
    sortOrder: 2,
  },
  {
    tierCode: 'vvip',
    tierName: 'VVIP',
    tierNameTh: 'วีวีไอพี',
    exchangeRate: 0.23,
    minSpent: 50000,
    maxSpent: null, // unlimited
    benefits: { freeShipping: true, prioritySupport: true },
    color: '#7C3AED', // purple
    icon: 'Crown',
    sortOrder: 3,
  },
];

// GET /api/v1/tiers/public - Get tiers for calculator (public - only name and rate)
router.get('/public', async (req, res) => {
  try {
    let tiers = await prisma.customerTier.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        tierCode: true,
        tierName: true,
        tierNameTh: true,
        exchangeRate: true,
        color: true,
        icon: true,
      },
    });

    // If no tiers exist, return defaults
    if (tiers.length === 0) {
      return res.json({
        success: true,
        data: [
          { tierCode: 'member', tierName: 'Member', tierNameTh: 'สมาชิก', exchangeRate: 0.25, color: '#6B7280', icon: 'User' },
          { tierCode: 'vip', tierName: 'VIP', tierNameTh: 'วีไอพี', exchangeRate: 0.24, color: '#F59E0B', icon: 'Star' },
          { tierCode: 'vvip', tierName: 'VVIP', tierNameTh: 'วีวีไอพี', exchangeRate: 0.23, color: '#7C3AED', icon: 'Crown' },
        ],
      });
    }

    res.json({
      success: true,
      data: tiers,
    });
  } catch (error) {
    console.error('Error fetching public tiers:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch tiers',
      },
    });
  }
});

// GET /api/v1/tiers - Get all tiers (admin only)
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    let tiers = await prisma.customerTier.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    // If no tiers exist, create defaults
    if (tiers.length === 0) {
      await prisma.customerTier.createMany({
        data: DEFAULT_TIERS.map(t => ({
          ...t,
          exchangeRate: new Decimal(t.exchangeRate),
          minSpent: new Decimal(t.minSpent),
          maxSpent: t.maxSpent ? new Decimal(t.maxSpent) : null,
        })),
      });
      tiers = await prisma.customerTier.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
    }

    res.json({
      success: true,
      data: tiers,
    });
  } catch (error) {
    console.error('Error fetching tiers:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch tiers',
      },
    });
  }
});

// GET /api/v1/tiers/:tierCode - Get single tier by code
router.get('/:tierCode', async (req, res) => {
  try {
    const tier = await prisma.customerTier.findUnique({
      where: { tierCode: req.params.tierCode },
    });

    if (!tier) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Tier not found',
        },
      });
    }

    res.json({
      success: true,
      data: tier,
    });
  } catch (error) {
    console.error('Error fetching tier:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch tier',
      },
    });
  }
});

// POST /api/v1/tiers - Create new tier (admin only)
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { tierCode, tierName, tierNameTh, exchangeRate, minSpent, maxSpent, benefits, color, icon, sortOrder } = req.body;

    // Validate required fields
    if (!tierCode || !tierName || exchangeRate === undefined || minSpent === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: tierCode, tierName, exchangeRate, minSpent',
        },
      });
    }

    // Check if tier code already exists
    const existing = await prisma.customerTier.findUnique({
      where: { tierCode },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_ERROR',
          message: 'Tier code already exists',
        },
      });
    }

    const tier = await prisma.customerTier.create({
      data: {
        tierCode,
        tierName,
        tierNameTh: tierNameTh || null,
        exchangeRate: new Decimal(exchangeRate),
        minSpent: new Decimal(minSpent),
        maxSpent: maxSpent ? new Decimal(maxSpent) : null,
        benefits: benefits || null,
        color: color || null,
        icon: icon || null,
        sortOrder: sortOrder || 0,
      },
    });

    res.status(201).json({
      success: true,
      data: tier,
    });
  } catch (error) {
    console.error('Error creating tier:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: 'Failed to create tier',
      },
    });
  }
});

// PATCH /api/v1/tiers/:tierCode - Update tier (admin only)
router.patch('/:tierCode', authenticateAdmin, async (req, res) => {
  try {
    const { tierName, tierNameTh, exchangeRate, minSpent, maxSpent, benefits, color, icon, sortOrder, isActive } = req.body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (tierName !== undefined) updateData.tierName = tierName;
    if (tierNameTh !== undefined) updateData.tierNameTh = tierNameTh;
    if (exchangeRate !== undefined) updateData.exchangeRate = new Decimal(exchangeRate);
    if (minSpent !== undefined) updateData.minSpent = new Decimal(minSpent);
    if (maxSpent !== undefined) updateData.maxSpent = maxSpent ? new Decimal(maxSpent) : null;
    if (benefits !== undefined) updateData.benefits = benefits;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isActive !== undefined) updateData.isActive = isActive;

    const tier = await prisma.customerTier.update({
      where: { tierCode: req.params.tierCode },
      data: updateData,
    });

    res.json({
      success: true,
      data: tier,
    });
  } catch (error) {
    console.error('Error updating tier:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update tier',
      },
    });
  }
});

// DELETE /api/v1/tiers/:tierCode - Delete tier (admin only)
router.delete('/:tierCode', authenticateAdmin, async (req, res) => {
  try {
    // Prevent deletion of member tier
    if (req.params.tierCode === 'member') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PROTECTED_TIER',
          message: 'Cannot delete the default member tier',
        },
      });
    }

    // Check if any customers use this tier
    const customersWithTier = await prisma.customer.count({
      where: { tier: req.params.tierCode },
    });

    if (customersWithTier > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TIER_IN_USE',
          message: `Cannot delete tier: ${customersWithTier} customers are using this tier`,
        },
      });
    }

    await prisma.customerTier.delete({
      where: { tierCode: req.params.tierCode },
    });

    res.json({
      success: true,
      message: 'Tier deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting tier:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to delete tier',
      },
    });
  }
});

// POST /api/v1/tiers/init - Initialize default tiers (admin only)
router.post('/init', authenticateAdmin, async (req, res) => {
  try {
    // Delete existing tiers if force flag is set
    if (req.body.force) {
      await prisma.customerTier.deleteMany({});
    }

    const existingTiers = await prisma.customerTier.count();
    if (existingTiers > 0 && !req.body.force) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TIERS_EXIST',
          message: 'Tiers already exist. Use force=true to reset.',
        },
      });
    }

    await prisma.customerTier.createMany({
      data: DEFAULT_TIERS.map(t => ({
        ...t,
        exchangeRate: new Decimal(t.exchangeRate),
        minSpent: new Decimal(t.minSpent),
        maxSpent: t.maxSpent ? new Decimal(t.maxSpent) : null,
      })),
    });

    const tiers = await prisma.customerTier.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    res.json({
      success: true,
      data: tiers,
      message: 'Default tiers initialized successfully',
    });
  } catch (error) {
    console.error('Error initializing tiers:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INIT_ERROR',
        message: 'Failed to initialize tiers',
      },
    });
  }
});

// GET /api/v1/tiers/calculate/:totalSpent - Calculate tier for given spending
router.get('/calculate/:totalSpent', async (req, res) => {
  try {
    const totalSpent = parseFloat(req.params.totalSpent);

    if (isNaN(totalSpent) || totalSpent < 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_AMOUNT',
          message: 'Invalid total spent amount',
        },
      });
    }

    const tiers = await prisma.customerTier.findMany({
      where: { isActive: true },
      orderBy: { minSpent: 'desc' },
    });

    // Find the tier that matches the spending
    let matchedTier = tiers.find(t => {
      const minSpent = Number(t.minSpent);
      const maxSpent = t.maxSpent ? Number(t.maxSpent) : Infinity;
      return totalSpent >= minSpent && totalSpent <= maxSpent;
    });

    // Fallback to member tier
    if (!matchedTier) {
      matchedTier = tiers.find(t => t.tierCode === 'member') || tiers[tiers.length - 1];
    }

    // Calculate progress to next tier
    const sortedTiers = [...tiers].sort((a, b) => Number(a.minSpent) - Number(b.minSpent));
    const currentTierIndex = sortedTiers.findIndex(t => t.tierCode === matchedTier!.tierCode);
    const nextTier = currentTierIndex < sortedTiers.length - 1 ? sortedTiers[currentTierIndex + 1] : null;

    let progressToNext = 100;
    let amountToNext = 0;

    if (nextTier) {
      const currentMin = Number(matchedTier.minSpent);
      const nextMin = Number(nextTier.minSpent);
      progressToNext = Math.min(100, ((totalSpent - currentMin) / (nextMin - currentMin)) * 100);
      amountToNext = Math.max(0, nextMin - totalSpent);
    }

    res.json({
      success: true,
      data: {
        currentTier: matchedTier,
        nextTier,
        totalSpent,
        progressToNext: Math.round(progressToNext * 100) / 100,
        amountToNext: Math.round(amountToNext * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Error calculating tier:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CALCULATE_ERROR',
        message: 'Failed to calculate tier',
      },
    });
  }
});

// GET /api/v1/tiers/history/:customerId - Get tier change history
router.get('/history/:customerId', authenticateAdmin, async (req, res) => {
  try {
    const history = await prisma.tierHistory.findMany({
      where: { customerId: req.params.customerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching tier history:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch tier history',
      },
    });
  }
});

// POST /api/v1/tiers/upgrade/:customerId - Manually upgrade customer tier (admin only)
router.post('/upgrade/:customerId', authenticateAdmin, async (req, res) => {
  try {
    const { newTier, reason } = req.body;
    const adminEmail = (req as any).admin?.email || 'admin';

    // Get current customer
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.customerId },
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

    // Verify new tier exists
    const tier = await prisma.customerTier.findUnique({
      where: { tierCode: newTier },
    });

    if (!tier) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TIER',
          message: 'Invalid tier code',
        },
      });
    }

    // Update customer tier
    const updatedCustomer = await prisma.customer.update({
      where: { id: req.params.customerId },
      data: {
        tier: newTier,
        vipSince: newTier !== 'member' && !customer.vipSince ? new Date() : customer.vipSince,
      },
    });

    // Record tier change history
    await prisma.tierHistory.create({
      data: {
        customerId: customer.id,
        previousTier: customer.tier,
        newTier,
        reason: reason || 'manual',
        totalSpentAt: customer.totalSpent,
        changedBy: adminEmail,
      },
    });

    res.json({
      success: true,
      data: {
        customer: updatedCustomer,
        tier,
      },
      message: `Customer upgraded to ${tier.tierName} successfully`,
    });
  } catch (error) {
    console.error('Error upgrading customer tier:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPGRADE_ERROR',
        message: 'Failed to upgrade customer tier',
      },
    });
  }
});

// POST /api/v1/tiers/auto-upgrade - Auto-upgrade all customers based on spending (admin only)
router.post('/auto-upgrade', authenticateAdmin, async (req, res) => {
  try {
    const tiers = await prisma.customerTier.findMany({
      where: { isActive: true },
      orderBy: { minSpent: 'desc' },
    });

    const customers = await prisma.customer.findMany({
      where: {
        totalSpent: { gt: 0 },
      },
    });

    let upgraded = 0;
    let downgraded = 0;

    for (const customer of customers) {
      const totalSpent = Number(customer.totalSpent || 0);

      // Find matching tier
      let newTier = tiers.find(t => {
        const minSpent = Number(t.minSpent);
        const maxSpent = t.maxSpent ? Number(t.maxSpent) : Infinity;
        return totalSpent >= minSpent && totalSpent <= maxSpent;
      });

      if (!newTier) {
        newTier = tiers.find(t => t.tierCode === 'member') || tiers[tiers.length - 1];
      }

      // Check if tier changed
      if (newTier && customer.tier !== newTier.tierCode) {
        const isUpgrade = Number(newTier.minSpent) > Number(tiers.find(t => t.tierCode === customer.tier)?.minSpent || 0);

        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            tier: newTier.tierCode,
            vipSince: newTier.tierCode !== 'member' && !customer.vipSince ? new Date() : customer.vipSince,
          },
        });

        await prisma.tierHistory.create({
          data: {
            customerId: customer.id,
            previousTier: customer.tier,
            newTier: newTier.tierCode,
            reason: 'auto_upgrade',
            totalSpentAt: customer.totalSpent,
            changedBy: 'system',
          },
        });

        if (isUpgrade) {
          upgraded++;
        } else {
          downgraded++;
        }
      }
    }

    res.json({
      success: true,
      data: {
        processed: customers.length,
        upgraded,
        downgraded,
        unchanged: customers.length - upgraded - downgraded,
      },
      message: `Auto-upgrade completed: ${upgraded} upgraded, ${downgraded} adjusted`,
    });
  } catch (error) {
    console.error('Error auto-upgrading tiers:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTO_UPGRADE_ERROR',
        message: 'Failed to auto-upgrade tiers',
      },
    });
  }
});

export default router;
