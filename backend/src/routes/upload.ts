import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../lib/prisma';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
const productImagesDir = path.join(uploadsDir, 'products');
const paymentProofsDir = path.join(uploadsDir, 'payments');

[uploadsDir, productImagesDir, paymentProofsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer configuration for product images
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productImagesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `product-${uniqueSuffix}${ext}`);
  },
});

// Multer configuration for payment proofs
const paymentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, paymentProofsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `payment-${uniqueSuffix}${ext}`);
  },
});

// File filter for images
const imageFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
  }
};

const productUpload = multer({
  storage: productStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const paymentUpload = multer({
  storage: paymentStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for payment proofs
  },
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

    const imageUrl = `/uploads/products/${req.file.filename}`;

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
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

    const imageUrl = `/uploads/products/${req.file.filename}`;

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
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

    const images = files.map(file => ({
      filename: file.filename,
      url: `/uploads/products/${file.filename}`,
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

    const proofUrl = `/uploads/payments/${req.file.filename}`;

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
        filename: req.file.filename,
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

    // Merge existing and new images
    const existingImages = (orderItem.productImages as string[]) || [];
    const newImageUrls = files.map(file => `/uploads/products/${file.filename}`);
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

    // Try to delete the file from disk
    try {
      const filename = path.basename(imageUrl);
      const filePath = path.join(productImagesDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileErr) {
      console.warn('Could not delete file from disk:', fileErr);
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
