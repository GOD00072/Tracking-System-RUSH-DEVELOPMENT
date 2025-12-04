import express from 'express';
import prisma from '../lib/prisma';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();

// GET /api/v1/portfolio - Get all portfolio items (public)
router.get('/', async (req, res) => {
  try {
    const category = req.query.category as string;
    const featured = req.query.featured === 'true';

    const where: any = {};
    if (category) where.category = category;
    if (featured) where.isFeatured = true;

    const items = await prisma.portfolioItem.findMany({
      where,
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch portfolio items' },
    });
  }
});

// GET /api/v1/portfolio/categories - Get unique categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.portfolioItem.findMany({
      where: { category: { not: null } },
      select: { category: true },
      distinct: ['category'],
    });

    res.json({
      success: true,
      data: categories.map(c => c.category).filter(Boolean),
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch categories' },
    });
  }
});

// GET /api/v1/portfolio/:id - Get single portfolio item
router.get('/:id', async (req, res) => {
  try {
    const item = await prisma.portfolioItem.findUnique({
      where: { id: req.params.id },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Portfolio item not found' },
      });
    }

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error fetching portfolio item:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch portfolio item' },
    });
  }
});

// POST /api/v1/portfolio - Create portfolio item (admin only)
router.post('/', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { title, description, imageUrl, category, isFeatured, displayOrder } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Title is required' },
      });
    }

    const item = await prisma.portfolioItem.create({
      data: {
        title,
        description: description || null,
        imageUrl: imageUrl || null,
        category: category || null,
        isFeatured: isFeatured || false,
        displayOrder: displayOrder || null,
      },
    });

    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error creating portfolio item:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_ERROR', message: 'Failed to create portfolio item' },
    });
  }
});

// PATCH /api/v1/portfolio/:id - Update portfolio item (admin only)
router.patch('/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { title, description, imageUrl, category, isFeatured, displayOrder } = req.body;

    const existing = await prisma.portfolioItem.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Portfolio item not found' },
      });
    }

    const item = await prisma.portfolioItem.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(category !== undefined && { category }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(displayOrder !== undefined && { displayOrder }),
      },
    });

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error updating portfolio item:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: 'Failed to update portfolio item' },
    });
  }
});

// DELETE /api/v1/portfolio/:id - Delete portfolio item (admin only)
router.delete('/:id', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const existing = await prisma.portfolioItem.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Portfolio item not found' },
      });
    }

    await prisma.portfolioItem.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: 'Portfolio item deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting portfolio item:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_ERROR', message: 'Failed to delete portfolio item' },
    });
  }
});

// PATCH /api/v1/portfolio/reorder - Reorder portfolio items (admin only)
router.patch('/reorder', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { items } = req.body; // Array of { id, displayOrder }

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Items array is required' },
      });
    }

    await Promise.all(
      items.map((item: { id: string; displayOrder: number }) =>
        prisma.portfolioItem.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
        })
      )
    );

    res.json({
      success: true,
      message: 'Portfolio items reordered successfully',
    });
  } catch (error) {
    console.error('Error reordering portfolio items:', error);
    res.status(500).json({
      success: false,
      error: { code: 'REORDER_ERROR', message: 'Failed to reorder portfolio items' },
    });
  }
});

export default router;
