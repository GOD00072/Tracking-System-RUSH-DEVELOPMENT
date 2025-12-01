import express from 'express';
import prisma from '../lib/prisma';
import { authenticateAdmin } from '../middleware/auth';
import { reviewUpload, deleteFromCloudinary, isCloudinaryUrl } from '../config/cloudinary';

const router = express.Router();

// Type for review images
interface ReviewImage {
  url: string;
  caption?: string;
}

// GET /api/v1/reviews - Get all reviews (admin only for unapproved)
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

// POST /api/v1/reviews - Create review (admin only)
// Supports multiple image uploads: 'images' field for review images, 'image' for customer avatar
router.post('/', authenticateAdmin, reviewUpload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]), async (req, res) => {
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

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Handle customer avatar image
    let customerImage: string | null = null;
    if (files?.image?.[0]) {
      customerImage = (files.image[0] as any).path;
    } else if (req.body.customerImage && req.body.customerImage.trim() !== '') {
      customerImage = req.body.customerImage;
    }

    // Handle multiple review images
    let reviewImages: ReviewImage[] = [];

    // From uploaded files
    if (files?.images) {
      reviewImages = files.images.map((file: any) => ({
        url: file.path,
        caption: ''
      }));
    }

    // From existing URLs (JSON string or comma-separated)
    if (req.body.reviewImages) {
      try {
        const existingImages = JSON.parse(req.body.reviewImages);
        if (Array.isArray(existingImages)) {
          reviewImages = [...reviewImages, ...existingImages];
        }
      } catch {
        // If not JSON, try comma-separated URLs
        const urls = req.body.reviewImages.split(',').filter((u: string) => u.trim());
        reviewImages = [...reviewImages, ...urls.map((url: string) => ({ url: url.trim(), caption: '' }))];
      }
    }

    console.log('Cleaned customerId:', cleanCustomerId);
    console.log('Cleaned orderId:', cleanOrderId);
    console.log('Customer image:', customerImage);
    console.log('Review images:', reviewImages);

    const review = await prisma.review.create({
      data: {
        customerId: cleanCustomerId,
        customerName: req.body.customerName,
        customerImage,
        reviewImages: reviewImages.length > 0 ? (reviewImages as any) : null,
        orderId: cleanOrderId,
        rating: parseInt(req.body.rating) || 5,
        comment: req.body.comment,
        isApproved: req.body.isApproved === 'true' || req.body.isApproved === true,
        isFeatured: req.body.isFeatured === 'true' || req.body.isFeatured === true,
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

// PATCH /api/v1/reviews/:id - Update review (admin only)
router.patch('/:id', authenticateAdmin, reviewUpload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]), async (req, res) => {
  try {
    const existing = await prisma.review.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Review not found',
        },
      });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (req.body.customerName !== undefined) updateData.customerName = req.body.customerName;
    if (req.body.rating !== undefined) updateData.rating = parseInt(req.body.rating);
    if (req.body.comment !== undefined) updateData.comment = req.body.comment;
    if (req.body.isApproved !== undefined) updateData.isApproved = req.body.isApproved === 'true' || req.body.isApproved === true;
    if (req.body.isFeatured !== undefined) updateData.isFeatured = req.body.isFeatured === 'true' || req.body.isFeatured === true;

    // Handle customer avatar image update
    if (files?.image?.[0]) {
      // Delete old image from Cloudinary if it exists
      if (existing.customerImage && isCloudinaryUrl(existing.customerImage)) {
        await deleteFromCloudinary(existing.customerImage);
      }
      updateData.customerImage = (files.image[0] as any).path;
    } else if (req.body.customerImage !== undefined) {
      updateData.customerImage = req.body.customerImage || null;
    }

    // Handle review images update
    if (files?.images || req.body.reviewImages !== undefined) {
      let reviewImages: ReviewImage[] = [];

      // From uploaded files (new images)
      if (files?.images) {
        reviewImages = files.images.map((file: any) => ({
          url: file.path,
          caption: ''
        }));
      }

      // From existing/updated URLs (JSON string)
      if (req.body.reviewImages) {
        try {
          const existingImages = JSON.parse(req.body.reviewImages);
          if (Array.isArray(existingImages)) {
            reviewImages = [...reviewImages, ...existingImages];
          }
        } catch {
          // If not JSON, try comma-separated URLs
          const urls = req.body.reviewImages.split(',').filter((u: string) => u.trim());
          reviewImages = [...reviewImages, ...urls.map((url: string) => ({ url: url.trim(), caption: '' }))];
        }
      }

      // Delete removed images from Cloudinary
      const existingReviewImages = (existing.reviewImages as unknown as ReviewImage[]) || [];
      const newImageUrls = reviewImages.map(img => img.url);
      for (const oldImg of existingReviewImages) {
        if (!newImageUrls.includes(oldImg.url) && isCloudinaryUrl(oldImg.url)) {
          await deleteFromCloudinary(oldImg.url);
        }
      }

      updateData.reviewImages = reviewImages.length > 0 ? reviewImages : null;
    }

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

// DELETE /api/v1/reviews/:id - Delete review (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const existing = await prisma.review.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Review not found',
        },
      });
    }

    // Delete customer avatar from Cloudinary if it exists
    if (existing.customerImage && isCloudinaryUrl(existing.customerImage)) {
      await deleteFromCloudinary(existing.customerImage);
    }

    // Delete all review images from Cloudinary
    const reviewImages = (existing.reviewImages as unknown as ReviewImage[]) || [];
    for (const img of reviewImages) {
      if (isCloudinaryUrl(img.url)) {
        await deleteFromCloudinary(img.url);
      }
    }

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
