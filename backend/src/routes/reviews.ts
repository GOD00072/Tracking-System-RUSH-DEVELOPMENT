import express from 'express';
import prisma from '../lib/prisma';

const router = express.Router();

// GET /api/v1/reviews - Get all reviews
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const isApproved = req.query.approved === 'true' ? true : req.query.approved === 'false' ? false : undefined;

    const where = isApproved !== undefined ? { isApproved } : {};

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: {
            select: {
              id: true,
              companyName: true,
              contactPerson: true,
            },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.review.count({ where }),
    ]);

    res.json({
      success: true,
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch reviews',
      },
    });
  }
});

// GET /api/v1/reviews/:id - Get single review
router.get('/:id', async (req, res) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        order: true,
      },
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Review not found',
        },
      });
    }

    res.json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch review',
      },
    });
  }
});

// POST /api/v1/reviews - Create review
router.post('/', async (req, res) => {
  try {
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // UUID validation regex
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Clean up UUIDs - convert empty strings or invalid UUIDs to null
    const cleanCustomerId = req.body.customerId && req.body.customerId.trim() !== '' && uuidRegex.test(req.body.customerId)
      ? req.body.customerId
      : null;
    const cleanOrderId = req.body.orderId && req.body.orderId.trim() !== '' && uuidRegex.test(req.body.orderId)
      ? req.body.orderId
      : null;
    const cleanCustomerImage = req.body.customerImage && req.body.customerImage.trim() !== ''
      ? req.body.customerImage
      : null;

    console.log('Cleaned customerId:', cleanCustomerId);
    console.log('Cleaned orderId:', cleanOrderId);

    const review = await prisma.review.create({
      data: {
        customerId: cleanCustomerId,
        customerName: req.body.customerName,
        customerImage: cleanCustomerImage,
        orderId: cleanOrderId,
        rating: req.body.rating,
        comment: req.body.comment,
        isApproved: req.body.isApproved || false,
        isFeatured: req.body.isFeatured || false,
      },
      include: {
        customer: true,
        order: true,
      },
    });

    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: 'Failed to create review',
      },
    });
  }
});

// PATCH /api/v1/reviews/:id - Update review
router.patch('/:id', async (req, res) => {
  try {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (req.body.customerName !== undefined) updateData.customerName = req.body.customerName;
    if (req.body.customerImage !== undefined) updateData.customerImage = req.body.customerImage;
    if (req.body.rating !== undefined) updateData.rating = req.body.rating;
    if (req.body.comment !== undefined) updateData.comment = req.body.comment;
    if (req.body.isApproved !== undefined) updateData.isApproved = req.body.isApproved;
    if (req.body.isFeatured !== undefined) updateData.isFeatured = req.body.isFeatured;

    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        customer: true,
        order: true,
      },
    });

    res.json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update review',
      },
    });
  }
});

// DELETE /api/v1/reviews/:id - Delete review
router.delete('/:id', async (req, res) => {
  try {
    await prisma.review.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to delete review',
      },
    });
  }
});

export default router;
