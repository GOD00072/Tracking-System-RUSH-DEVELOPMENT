import express from 'express';
import prisma from '../lib/prisma';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';
import { productUpload, paymentUpload, profileUpload, deleteFromCloudinary, isCloudinaryUrl, createDynamicUpload } from '../config/cloudinary';

const router = express.Router();

// POST /api/v1/upload/cloudinary - Generic Cloudinary upload with folder support
router.post('/cloudinary', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    // Get folder from query or body, default to 'general'
    const folder = (req.query.folder as string) || (req.body?.folder as string) || 'general';

    // Validate folder name
    const allowedFolders = ['customer-profiles', 'products', 'payments', 'reviews', 'schedules', 'general'];
    const finalFolder = allowedFolders.includes(folder) ? folder : 'general';

    // Create dynamic upload handler for the specified folder
    const upload = createDynamicUpload(finalFolder);

    // Use multer middleware manually
    upload.single('file')(req, res, (err) => {
      if (err) {
        console.error('Cloudinary upload error:', err);
        return res.status(400).json({
          success: false,
          error: {
            code: 'UPLOAD_ERROR',
            message: err.message || 'Failed to upload file',
          },
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'NO_FILE',
            message: 'No file provided',
          },
        });
      }

      const imageUrl = (req.file as any).path;

      res.json({
        success: true,
        data: {
          filename: (req.file as any).filename || req.file.originalname,
          url: imageUrl,
          folder: `pakkuneko/${finalFolder}`,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
      });
    });
  } catch (error: any) {
    console.error('Error in cloudinary upload:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: error.message || 'Failed to upload file',
      },
    });
  }
});

// POST /api/v1/upload/profile - Upload customer profile image
router.post('/profile', authenticateAdmin, profileUpload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'No image file provided',
        },
      });
    }

    const imageUrl = (req.file as any).path;

    // Optionally update customer record if customerId is provided
    if (req.body.customerId) {
      await prisma.customer.update({
        where: { id: req.body.customerId },
        data: { profileImageUrl: imageUrl },
      });
    }

    res.json({
      success: true,
      data: {
        filename: (req.file as any).filename || req.file.originalname,
        url: imageUrl,
        folder: 'pakkuneko/customer-profiles',
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error: any) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: error.message || 'Failed to upload profile image',
      },
    });
  }
});

// POST /api/v1/upload/image - Simple image upload (accepts 'file' field)
router.post('/image', productUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'No image file provided',
        },
      });
    }

    // Cloudinary returns the full URL in req.file.path
    const imageUrl = (req.file as any).path;

    res.json({
      success: true,
      data: {
        filename: (req.file as any).filename || req.file.originalname,
        url: imageUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: error.message || 'Failed to upload image',
      },
    });
  }
});

// POST /api/v1/upload/product-image - Upload single product image
router.post('/product-image', authenticateAdmin, productUpload.single('image'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'No image file provided',
        },
      });
    }

    // Cloudinary returns the full URL in req.file.path
    const imageUrl = (req.file as any).path;

    res.json({
      success: true,
      data: {
        filename: (req.file as any).filename || req.file.originalname,
        url: imageUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error: any) {
    console.error('Error uploading product image:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: error.message || 'Failed to upload image',
      },
    });
  }
});

// POST /api/v1/upload/product-images - Upload multiple product images
router.post('/product-images', authenticateAdmin, productUpload.array('images', 10), async (req: AuthRequest, res) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILES',
          message: 'No image files provided',
        },
      });
    }

    // Cloudinary returns the full URL in file.path
    const images = files.map(file => ({
      filename: (file as any).filename || file.originalname,
      url: (file as any).path,
      size: file.size,
      mimetype: file.mimetype,
    }));

    res.json({
      success: true,
      data: {
        count: images.length,
        images,
      },
    });
  } catch (error: any) {
    console.error('Error uploading product images:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: error.message || 'Failed to upload images',
      },
    });
  }
});

// POST /api/v1/upload/payment-proof - Upload payment proof/slip
router.post('/payment-proof', authenticateAdmin, paymentUpload.single('proof'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'No proof file provided',
        },
      });
    }

    // Cloudinary returns the full URL in req.file.path
    const proofUrl = (req.file as any).path;

    // Optionally update payment record if paymentId is provided
    if (req.body.paymentId) {
      await prisma.payment.update({
        where: { id: req.body.paymentId },
        data: { proofImageUrl: proofUrl },
      });
    }

    res.json({
      success: true,
      data: {
        filename: (req.file as any).filename || req.file.originalname,
        url: proofUrl,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error: any) {
    console.error('Error uploading payment proof:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: error.message || 'Failed to upload payment proof',
      },
    });
  }
});

// POST /api/v1/upload/order-item-images/:orderItemId - Upload and attach images to order item
router.post('/order-item-images/:orderItemId', authenticateAdmin, productUpload.array('images', 10), async (req: AuthRequest, res) => {
  try {
    const { orderItemId } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILES',
          message: 'No image files provided',
        },
      });
    }

    // Get existing images
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      select: { productImages: true },
    });

    if (!orderItem) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Order item not found',
        },
      });
    }

    // Merge existing and new images (Cloudinary returns full URL in file.path)
    const existingImages = (orderItem.productImages as string[]) || [];
    const newImageUrls = files.map(file => (file as any).path);
    const allImages = [...existingImages, ...newImageUrls];

    // Update order item with new images
    const updated = await prisma.orderItem.update({
      where: { id: orderItemId },
      data: { productImages: allImages },
    });

    res.json({
      success: true,
      data: {
        orderItemId,
        totalImages: allImages.length,
        newImages: newImageUrls,
        allImages,
      },
    });
  } catch (error: any) {
    console.error('Error uploading order item images:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: error.message || 'Failed to upload images',
      },
    });
  }
});

// DELETE /api/v1/upload/order-item-image/:orderItemId - Remove image from order item
router.delete('/order-item-image/:orderItemId', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { orderItemId } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'imageUrl is required',
        },
      });
    }

    const orderItem = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      select: { productImages: true },
    });

    if (!orderItem) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Order item not found',
        },
      });
    }

    // Remove image from array
    const existingImages = (orderItem.productImages as string[]) || [];
    const updatedImages = existingImages.filter(img => img !== imageUrl);

    // Update order item
    await prisma.orderItem.update({
      where: { id: orderItemId },
      data: { productImages: updatedImages },
    });

    // Delete from Cloudinary if it's a Cloudinary URL
    if (isCloudinaryUrl(imageUrl)) {
      await deleteFromCloudinary(imageUrl);
    }

    res.json({
      success: true,
      message: 'Image removed successfully',
      data: {
        remainingImages: updatedImages,
      },
    });
  } catch (error) {
    console.error('Error removing image:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to remove image',
      },
    });
  }
});

export default router;
