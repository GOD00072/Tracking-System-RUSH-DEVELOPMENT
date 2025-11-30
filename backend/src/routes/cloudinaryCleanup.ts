import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin } from '../middleware/auth';
import { cloudinary, deleteFromCloudinary, isCloudinaryUrl } from '../config/cloudinary';

const router = Router();
const prisma = new PrismaClient();

// Folder prefix for this project
const FOLDER_PREFIX = 'pakkuneko';

interface CloudinaryImage {
  public_id: string;
  url: string;
  folder: string;
  created_at: string;
  bytes: number;
  format: string;
}

interface OrphanedImage extends CloudinaryImage {
  reason: string;
}

// GET /api/v1/cloudinary-cleanup/scan - Scan and compare Cloudinary vs DB
router.get('/scan', authenticateAdmin, async (req, res) => {
  try {
    console.log('[CloudinaryCleanup] Starting scan...');

    // 1. Get all images from Cloudinary
    const cloudinaryImages: CloudinaryImage[] = [];
    const folders = ['products', 'schedules', 'reviews', 'payments'];

    for (const folder of folders) {
      try {
        const result = await cloudinary.api.resources({
          type: 'upload',
          prefix: `${FOLDER_PREFIX}/${folder}`,
          max_results: 500,
        });

        for (const resource of result.resources) {
          cloudinaryImages.push({
            public_id: resource.public_id,
            url: resource.secure_url,
            folder: folder,
            created_at: resource.created_at,
            bytes: resource.bytes,
            format: resource.format,
          });
        }
        console.log(`[CloudinaryCleanup] Found ${result.resources.length} images in ${folder}`);
      } catch (error) {
        console.error(`[CloudinaryCleanup] Error scanning folder ${folder}:`, error);
      }
    }

    // 2. Get all image URLs from database
    const dbImageUrls = new Set<string>();

    // OrderItem.productImages (JSON array)
    const orderItems = await prisma.orderItem.findMany({
      where: { productImages: { not: null } },
      select: { productImages: true },
    });
    for (const item of orderItems) {
      const images = item.productImages as string[] | null;
      if (images && Array.isArray(images)) {
        images.forEach((url) => {
          if (isCloudinaryUrl(url)) dbImageUrls.add(url);
        });
      }
    }

    // Review.customerImage
    const reviews = await prisma.review.findMany({
      where: { customerImage: { not: null } },
      select: { customerImage: true },
    });
    for (const review of reviews) {
      if (review.customerImage && isCloudinaryUrl(review.customerImage)) {
        dbImageUrls.add(review.customerImage);
      }
    }

    // ScheduleImage.imageUrl
    const scheduleImages = await prisma.scheduleImage.findMany({
      select: { imageUrl: true },
    });
    for (const schedule of scheduleImages) {
      if (isCloudinaryUrl(schedule.imageUrl)) {
        dbImageUrls.add(schedule.imageUrl);
      }
    }

    // WebNotification.imageUrl
    const webNotifications = await prisma.webNotification.findMany({
      where: { imageUrl: { not: null } },
      select: { imageUrl: true },
    });
    for (const notification of webNotifications) {
      if (notification.imageUrl && isCloudinaryUrl(notification.imageUrl)) {
        dbImageUrls.add(notification.imageUrl);
      }
    }

    // Payment.proofImageUrl
    const payments = await prisma.payment.findMany({
      where: { proofImageUrl: { not: null } },
      select: { proofImageUrl: true },
    });
    for (const payment of payments) {
      if (payment.proofImageUrl && isCloudinaryUrl(payment.proofImageUrl)) {
        dbImageUrls.add(payment.proofImageUrl);
      }
    }

    // PortfolioItem.imageUrl
    const portfolioItems = await prisma.portfolioItem.findMany({
      where: { imageUrl: { not: null } },
      select: { imageUrl: true },
    });
    for (const item of portfolioItems) {
      if (item.imageUrl && isCloudinaryUrl(item.imageUrl)) {
        dbImageUrls.add(item.imageUrl);
      }
    }

    // User avatarUrl and profilePicture
    const users = await prisma.user.findMany({
      select: { avatarUrl: true, profilePicture: true },
    });
    for (const user of users) {
      if (user.avatarUrl && isCloudinaryUrl(user.avatarUrl)) {
        dbImageUrls.add(user.avatarUrl);
      }
      if (user.profilePicture && isCloudinaryUrl(user.profilePicture)) {
        dbImageUrls.add(user.profilePicture);
      }
    }

    console.log(`[CloudinaryCleanup] Found ${dbImageUrls.size} images in database`);

    // 3. Find orphaned images (in Cloudinary but not in DB)
    const orphanedImages: OrphanedImage[] = [];
    for (const cloudImg of cloudinaryImages) {
      if (!dbImageUrls.has(cloudImg.url)) {
        orphanedImages.push({
          ...cloudImg,
          reason: 'Not found in database',
        });
      }
    }

    // 4. Calculate total size
    const totalOrphanedSize = orphanedImages.reduce((acc, img) => acc + img.bytes, 0);
    const totalCloudinarySize = cloudinaryImages.reduce((acc, img) => acc + img.bytes, 0);

    console.log(`[CloudinaryCleanup] Found ${orphanedImages.length} orphaned images`);

    res.json({
      success: true,
      data: {
        cloudinaryTotal: cloudinaryImages.length,
        databaseTotal: dbImageUrls.size,
        orphanedTotal: orphanedImages.length,
        orphanedImages: orphanedImages,
        totalCloudinarySize,
        totalOrphanedSize,
        byFolder: {
          products: orphanedImages.filter((i) => i.folder === 'products').length,
          schedules: orphanedImages.filter((i) => i.folder === 'schedules').length,
          reviews: orphanedImages.filter((i) => i.folder === 'reviews').length,
          payments: orphanedImages.filter((i) => i.folder === 'payments').length,
        },
      },
    });
  } catch (error: any) {
    console.error('[CloudinaryCleanup] Scan error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SCAN_ERROR',
        message: error.message || 'Failed to scan Cloudinary storage',
      },
    });
  }
});

// DELETE /api/v1/cloudinary-cleanup/delete - Delete specific orphaned images
router.delete('/delete', authenticateAdmin, async (req, res) => {
  try {
    const { imageUrls } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'imageUrls array is required',
        },
      });
    }

    console.log(`[CloudinaryCleanup] Deleting ${imageUrls.length} images...`);

    const results = {
      success: [] as string[],
      failed: [] as { url: string; error: string }[],
    };

    for (const url of imageUrls) {
      try {
        const deleted = await deleteFromCloudinary(url);
        if (deleted) {
          results.success.push(url);
        } else {
          results.failed.push({ url, error: 'Delete returned false' });
        }
      } catch (error: any) {
        results.failed.push({ url, error: error.message });
      }
    }

    console.log(`[CloudinaryCleanup] Deleted ${results.success.length}/${imageUrls.length} images`);

    res.json({
      success: true,
      data: {
        deletedCount: results.success.length,
        failedCount: results.failed.length,
        results,
      },
    });
  } catch (error: any) {
    console.error('[CloudinaryCleanup] Delete error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: error.message || 'Failed to delete images',
      },
    });
  }
});

// DELETE /api/v1/cloudinary-cleanup/delete-all - Delete all orphaned images
router.delete('/delete-all', authenticateAdmin, async (req, res) => {
  try {
    // First scan to get orphaned images
    const scanResponse = await fetch(`${req.protocol}://${req.get('host')}/api/v1/cloudinary-cleanup/scan`, {
      headers: {
        Authorization: req.headers.authorization || '',
      },
    });

    // Instead, let's just re-run the scan logic here
    console.log('[CloudinaryCleanup] Starting delete-all scan...');

    const cloudinaryImages: CloudinaryImage[] = [];
    const folders = ['products', 'schedules', 'reviews', 'payments'];

    for (const folder of folders) {
      try {
        const result = await cloudinary.api.resources({
          type: 'upload',
          prefix: `${FOLDER_PREFIX}/${folder}`,
          max_results: 500,
        });

        for (const resource of result.resources) {
          cloudinaryImages.push({
            public_id: resource.public_id,
            url: resource.secure_url,
            folder: folder,
            created_at: resource.created_at,
            bytes: resource.bytes,
            format: resource.format,
          });
        }
      } catch (error) {
        console.error(`[CloudinaryCleanup] Error scanning folder ${folder}:`, error);
      }
    }

    // Get all DB URLs
    const dbImageUrls = new Set<string>();

    const orderItems = await prisma.orderItem.findMany({
      where: { productImages: { not: null } },
      select: { productImages: true },
    });
    for (const item of orderItems) {
      const images = item.productImages as string[] | null;
      if (images && Array.isArray(images)) {
        images.forEach((url) => {
          if (isCloudinaryUrl(url)) dbImageUrls.add(url);
        });
      }
    }

    const reviews = await prisma.review.findMany({
      where: { customerImage: { not: null } },
      select: { customerImage: true },
    });
    for (const review of reviews) {
      if (review.customerImage && isCloudinaryUrl(review.customerImage)) {
        dbImageUrls.add(review.customerImage);
      }
    }

    const scheduleImages = await prisma.scheduleImage.findMany({
      select: { imageUrl: true },
    });
    for (const schedule of scheduleImages) {
      if (isCloudinaryUrl(schedule.imageUrl)) {
        dbImageUrls.add(schedule.imageUrl);
      }
    }

    const webNotifications = await prisma.webNotification.findMany({
      where: { imageUrl: { not: null } },
      select: { imageUrl: true },
    });
    for (const notification of webNotifications) {
      if (notification.imageUrl && isCloudinaryUrl(notification.imageUrl)) {
        dbImageUrls.add(notification.imageUrl);
      }
    }

    const payments = await prisma.payment.findMany({
      where: { proofImageUrl: { not: null } },
      select: { proofImageUrl: true },
    });
    for (const payment of payments) {
      if (payment.proofImageUrl && isCloudinaryUrl(payment.proofImageUrl)) {
        dbImageUrls.add(payment.proofImageUrl);
      }
    }

    const portfolioItems = await prisma.portfolioItem.findMany({
      where: { imageUrl: { not: null } },
      select: { imageUrl: true },
    });
    for (const item of portfolioItems) {
      if (item.imageUrl && isCloudinaryUrl(item.imageUrl)) {
        dbImageUrls.add(item.imageUrl);
      }
    }

    const users = await prisma.user.findMany({
      select: { avatarUrl: true, profilePicture: true },
    });
    for (const user of users) {
      if (user.avatarUrl && isCloudinaryUrl(user.avatarUrl)) {
        dbImageUrls.add(user.avatarUrl);
      }
      if (user.profilePicture && isCloudinaryUrl(user.profilePicture)) {
        dbImageUrls.add(user.profilePicture);
      }
    }

    // Find orphaned
    const orphanedUrls = cloudinaryImages
      .filter((img) => !dbImageUrls.has(img.url))
      .map((img) => img.url);

    console.log(`[CloudinaryCleanup] Found ${orphanedUrls.length} orphaned images to delete`);

    if (orphanedUrls.length === 0) {
      return res.json({
        success: true,
        data: {
          deletedCount: 0,
          message: 'No orphaned images found',
        },
      });
    }

    // Delete all orphaned
    const results = {
      success: [] as string[],
      failed: [] as { url: string; error: string }[],
    };

    for (const url of orphanedUrls) {
      try {
        const deleted = await deleteFromCloudinary(url);
        if (deleted) {
          results.success.push(url);
        } else {
          results.failed.push({ url, error: 'Delete returned false' });
        }
      } catch (error: any) {
        results.failed.push({ url, error: error.message });
      }
    }

    console.log(`[CloudinaryCleanup] Deleted ${results.success.length}/${orphanedUrls.length} orphaned images`);

    res.json({
      success: true,
      data: {
        deletedCount: results.success.length,
        failedCount: results.failed.length,
        freedBytes: cloudinaryImages
          .filter((img) => results.success.includes(img.url))
          .reduce((acc, img) => acc + img.bytes, 0),
        results,
      },
    });
  } catch (error: any) {
    console.error('[CloudinaryCleanup] Delete-all error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ALL_ERROR',
        message: error.message || 'Failed to delete all orphaned images',
      },
    });
  }
});

// GET /api/v1/cloudinary-cleanup/stats - Get Cloudinary storage stats
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const usage = await cloudinary.api.usage();

    res.json({
      success: true,
      data: {
        plan: usage.plan,
        credits: {
          usage: usage.credits?.usage || 0,
          limit: usage.credits?.limit || 0,
          usedPercent: usage.credits?.used_percent || 0,
        },
        storage: {
          usage: usage.storage?.usage || 0,
          limit: usage.storage?.limit || 0,
          usedPercent: usage.storage?.used_percent || 0,
        },
        bandwidth: {
          usage: usage.bandwidth?.usage || 0,
          limit: usage.bandwidth?.limit || 0,
          usedPercent: usage.bandwidth?.used_percent || 0,
        },
        transformations: {
          usage: usage.transformations?.usage || 0,
          limit: usage.transformations?.limit || 0,
          usedPercent: usage.transformations?.used_percent || 0,
        },
        resources: usage.resources || 0,
        derivedResources: usage.derived_resources || 0,
      },
    });
  } catch (error: any) {
    console.error('[CloudinaryCleanup] Stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'STATS_ERROR',
        message: error.message || 'Failed to get Cloudinary stats',
      },
    });
  }
});

export default router;
