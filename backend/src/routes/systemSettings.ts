import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/system-settings/:key - Get setting by key
router.get('/:key', authenticateAdmin, async (req, res) => {
  try {
    const { key } = req.params;

    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Setting with key "${key}" not found`,
        },
      });
    }

    res.json({
      success: true,
      data: setting,
    });
  } catch (error: any) {
    console.error('Error fetching system setting:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to fetch system setting',
      },
    });
  }
});

// GET /api/v1/system-settings - Get all settings or by category
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { category } = req.query;

    const where = category ? { category: category as string } : {};

    const settings = await prisma.systemSetting.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to fetch system settings',
      },
    });
  }
});

// POST /api/v1/system-settings/:key - Create or update setting
router.post('/:key', authenticateAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, category } = req.body;

    if (!value) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Value is required',
        },
      });
    }

    // Upsert (create or update)
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      create: {
        key,
        value,
        category: category || null,
      },
      update: {
        value,
        category: category || undefined,
      },
    });

    res.json({
      success: true,
      data: setting,
      message: 'Setting saved successfully',
    });
  } catch (error: any) {
    console.error('Error saving system setting:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to save system setting',
      },
    });
  }
});

// PATCH /api/v1/system-settings/:key - Update setting
router.patch('/:key', authenticateAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, category } = req.body;

    const updateData: any = {};
    if (value !== undefined) updateData.value = value;
    if (category !== undefined) updateData.category = category;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No data to update',
        },
      });
    }

    const setting = await prisma.systemSetting.update({
      where: { key },
      data: updateData,
    });

    res.json({
      success: true,
      data: setting,
      message: 'Setting updated successfully',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Setting with key "${req.params.key}" not found`,
        },
      });
    }

    console.error('Error updating system setting:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to update system setting',
      },
    });
  }
});

// DELETE /api/v1/system-settings/:key - Delete setting
router.delete('/:key', authenticateAdmin, async (req, res) => {
  try {
    const { key } = req.params;

    await prisma.systemSetting.delete({
      where: { key },
    });

    res.json({
      success: true,
      message: 'Setting deleted successfully',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Setting with key "${req.params.key}" not found`,
        },
      });
    }

    console.error('Error deleting system setting:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to delete system setting',
      },
    });
  }
});

export default router;
