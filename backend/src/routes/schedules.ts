import express from 'express';
import prisma from '../lib/prisma';
import { authenticateAdmin } from '../middleware/auth';
import { scheduleUpload, deleteFromCloudinary, isCloudinaryUrl } from '../config/cloudinary';

const router = express.Router();

// =====================================================
// PUBLIC ROUTES - ไม่ต้อง login
// =====================================================

// GET /api/v1/schedules/public - Get active schedules for public
router.get('/public', async (req, res) => {
  try {
    const { type, month, year } = req.query;

    const where: any = { isActive: true };
    if (type) where.type = type;
    if (month) where.month = parseInt(month as string);
    if (year) where.year = parseInt(year as string);

    const schedules = await prisma.scheduleImage.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        imageUrl: true,
        month: true,
        year: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    console.error('Error fetching public schedules:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch schedules',
      },
    });
  }
});

// GET /api/v1/schedules/public/latest - Get latest schedule for each type
router.get('/public/latest', async (req, res) => {
  try {
    // Get latest ship schedule
    const latestShip = await prisma.scheduleImage.findFirst({
      where: { type: 'ship', isActive: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        imageUrl: true,
        month: true,
        year: true,
        createdAt: true,
      },
    });

    // Get latest air schedule
    const latestAir = await prisma.scheduleImage.findFirst({
      where: { type: 'air', isActive: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        imageUrl: true,
        month: true,
        year: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: {
        ship: latestShip,
        air: latestAir,
      },
    });
  } catch (error) {
    console.error('Error fetching latest schedules:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch latest schedules',
      },
    });
  }
});

// GET /api/v1/schedules/notifications - Get active web notifications
router.get('/notifications', async (req, res) => {
  try {
    const now = new Date();

    const notifications = await prisma.webNotification.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch notifications',
      },
    });
  }
});

// =====================================================
// ADMIN ROUTES - ต้อง login
// =====================================================

// GET /api/v1/schedules - Get all schedules (admin)
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { type, isActive } = req.query;

    const where: any = {};
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const schedules = await prisma.scheduleImage.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
    });

    res.json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch schedules',
      },
    });
  }
});

// POST /api/v1/schedules - Create new schedule (admin)
router.post('/', authenticateAdmin, scheduleUpload.single('image'), async (req, res) => {
  try {
    const { type, title, description, month, year } = req.body;
    const adminEmail = (req as any).admin?.email || 'admin';

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_IMAGE',
          message: 'Schedule image is required',
        },
      });
    }

    if (!type || !title || !month || !year) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'type, title, month, and year are required',
        },
      });
    }

    // Cloudinary returns the full URL in req.file.path
    const imageUrl = (req.file as any).path;

    const schedule = await prisma.scheduleImage.create({
      data: {
        type,
        title,
        description: description || null,
        imageUrl,
        month: parseInt(month),
        year: parseInt(year),
        uploadedBy: adminEmail,
      },
    });

    // Create web notification for the new schedule
    const monthNames = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const typeLabel = type === 'ship' ? 'เรือ' : 'เครื่องบิน';
    const notificationTitle = `ตารางรอบ${typeLabel}ใหม่`;
    const notificationMessage = `ตารางรอบ${typeLabel}ประจำเดือน${monthNames[parseInt(month)]} ${year} พร้อมให้ดูแล้ว`;

    // Delete existing duplicate notifications with same title and message
    await prisma.webNotification.deleteMany({
      where: {
        type: 'schedule_update',
        title: notificationTitle,
        message: notificationMessage,
      },
    });

    await prisma.webNotification.create({
      data: {
        type: 'schedule_update',
        title: notificationTitle,
        message: notificationMessage,
        linkUrl: '/schedule',
        imageUrl,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Expires in 30 days
      },
    });

    // Mark schedule as notified
    await prisma.scheduleImage.update({
      where: { id: schedule.id },
      data: {
        isNotified: true,
        notifiedAt: new Date(),
      },
    });

    res.status(201).json({
      success: true,
      data: schedule,
      message: 'Schedule created and notification sent',
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: 'Failed to create schedule',
      },
    });
  }
});

// PATCH /api/v1/schedules/:id - Update schedule (admin)
router.patch('/:id', authenticateAdmin, scheduleUpload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { type, title, description, month, year, isActive } = req.body;

    const existing = await prisma.scheduleImage.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Schedule not found',
        },
      });
    }

    const updateData: any = {};
    if (type !== undefined) updateData.type = type;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (month !== undefined) updateData.month = parseInt(month);
    if (year !== undefined) updateData.year = parseInt(year);
    if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;

    // Handle image update
    if (req.file) {
      // Delete old image from Cloudinary
      if (existing.imageUrl && isCloudinaryUrl(existing.imageUrl)) {
        await deleteFromCloudinary(existing.imageUrl);
      }
      // Cloudinary returns the full URL in req.file.path
      updateData.imageUrl = (req.file as any).path;
    }

    const schedule = await prisma.scheduleImage.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update schedule',
      },
    });
  }
});

// DELETE /api/v1/schedules/:id - Delete schedule (admin)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.scheduleImage.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Schedule not found',
        },
      });
    }

    // Delete image from Cloudinary
    if (existing.imageUrl && isCloudinaryUrl(existing.imageUrl)) {
      await deleteFromCloudinary(existing.imageUrl);
    }

    await prisma.scheduleImage.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Schedule deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to delete schedule',
      },
    });
  }
});

// =====================================================
// NOTIFICATION ADMIN ROUTES
// =====================================================

// GET /api/v1/schedules/admin/notifications - Get all notifications (admin)
router.get('/admin/notifications', authenticateAdmin, async (req, res) => {
  try {
    const notifications = await prisma.webNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch notifications',
      },
    });
  }
});

// DELETE /api/v1/schedules/admin/notifications/:id - Delete notification (admin)
router.delete('/admin/notifications/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.webNotification.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to delete notification',
      },
    });
  }
});

// PATCH /api/v1/schedules/admin/notifications/:id - Update notification (admin)
router.patch('/admin/notifications/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const notification = await prisma.webNotification.update({
      where: { id },
      data: { isActive },
    });

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update notification',
      },
    });
  }
});

// POST /api/v1/schedules/admin/notifications/cleanup - Remove duplicate notifications (admin)
router.post('/admin/notifications/cleanup', authenticateAdmin, async (req, res) => {
  try {
    // Get all notifications grouped by title+message
    const notifications = await prisma.webNotification.findMany({
      where: { type: 'schedule_update' },
      orderBy: { createdAt: 'desc' },
    });

    // Group by title+message
    const groups = new Map<string, typeof notifications>();
    for (const n of notifications) {
      const key = `${n.title}|${n.message}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(n);
    }

    // Delete duplicates (keep only the newest one in each group)
    let deletedCount = 0;
    for (const [_, group] of groups) {
      if (group.length > 1) {
        // Keep the first (newest), delete the rest
        const toDelete = group.slice(1).map(n => n.id);
        await prisma.webNotification.deleteMany({
          where: { id: { in: toDelete } },
        });
        deletedCount += toDelete.length;
      }
    }

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} duplicate notifications`,
      deletedCount,
    });
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CLEANUP_ERROR',
        message: 'Failed to cleanup notifications',
      },
    });
  }
});

export default router;
