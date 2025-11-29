import express from 'express';
import { middleware, WebhookEvent, MessageEvent, FollowEvent, UnfollowEvent } from '@line/bot-sdk';
import prisma from '../../lib/prisma';
import { lineService } from '../../services/lineService';

const router = express.Router();

// LINE webhook endpoint needs both raw body (for signature) and parsed JSON
router.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));

// LINE webhook endpoint
// POST /webhook/line
router.post(
  '/',
  async (req, res, next) => {
    try {
      // Get LINE settings from database
      const settings = await prisma.systemSetting.findUnique({
        where: { key: 'line_oa' },
      });

      if (!settings || !settings.value) {
        console.log('[LINE Webhook] LINE settings not found');
        return res.status(400).json({
          success: false,
          error: 'LINE settings not configured',
        });
      }

      const lineSettings = settings.value as any;

      if (!lineSettings.enabled || !lineSettings.channel_secret) {
        console.log('[LINE Webhook] LINE not enabled or missing credentials');
        return res.status(400).json({
          success: false,
          error: 'LINE not properly configured',
        });
      }

      // Create middleware with credentials
      const lineMiddleware = middleware({
        channelSecret: lineSettings.channel_secret,
      });

      lineMiddleware(req, res, next);
    } catch (error) {
      console.error('[LINE Webhook] Middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  },
  async (req, res) => {
    try {
      const events: WebhookEvent[] = req.body.events;

      console.log(`[LINE Webhook] Received ${events.length} events`);

      // Process events
      await Promise.all(events.map(handleEvent));

      res.json({
        success: true,
        message: 'OK',
      });
    } catch (error) {
      console.error('[LINE Webhook] Error processing events:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process events',
      });
    }
  }
);

// Handle individual webhook events
async function handleEvent(event: WebhookEvent) {
  console.log('[LINE Webhook] Event type:', event.type);

  try {
    switch (event.type) {
      case 'follow':
        await handleFollow(event as FollowEvent);
        break;

      case 'unfollow':
        await handleUnfollow(event as UnfollowEvent);
        break;

      case 'message':
        await handleMessage(event as MessageEvent);
        break;

      default:
        console.log(`[LINE Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('[LINE Webhook] Error handling event:', error);
  }
}

// Handle follow event (user adds bot as friend)
async function handleFollow(event: FollowEvent) {
  const userId = event.source.userId;
  if (!userId) return;

  console.log(`[LINE Webhook] User ${userId} followed the bot`);

  try {
    // Get user profile
    const profile = await lineService.getProfile(userId);

    if (profile) {
      // Check if user exists
      let user = await prisma.user.findUnique({
        where: { lineId: userId },
      });

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            lineId: userId,
            fullName: profile.displayName,
            profilePicture: profile.pictureUrl,
            role: 'customer',
          },
        });

        console.log(`[LINE Webhook] Created new user: ${user.id}`);
      } else {
        // Update existing user
        await prisma.user.update({
          where: { id: user.id },
          data: {
            fullName: profile.displayName,
            profilePicture: profile.pictureUrl,
          },
        });

        console.log(`[LINE Webhook] Updated existing user: ${user.id}`);
      }
    }

    // Send welcome message
    await lineService.sendTextMessage(
      userId,
      'ยินดีต้อนรับสู่ระบบติดตามการจัดส่ง! 🚢\n\nเราจะแจ้งเตือนคุณเมื่อมีการอัปเดทสถานะการจัดส่งของคุณ\n\nขอบคุณที่ใช้บริการ 🙏'
    );
  } catch (error) {
    console.error('[LINE Webhook] Error handling follow event:', error);
  }
}

// Handle unfollow event (user blocks or removes bot)
async function handleUnfollow(event: UnfollowEvent) {
  const userId = event.source.userId;
  if (!userId) return;

  console.log(`[LINE Webhook] User ${userId} unfollowed the bot`);

  try {
    // You might want to update user status or remove LINE ID
    const user = await prisma.user.findUnique({
      where: { lineId: userId },
    });

    if (user) {
      // Optionally: Remove LINE ID or mark as inactive
      console.log(`[LINE Webhook] User ${user.id} unfollowed`);
    }
  } catch (error) {
    console.error('[LINE Webhook] Error handling unfollow event:', error);
  }
}

// Handle message event
async function handleMessage(event: MessageEvent) {
  const userId = event.source.userId;
  if (!userId) return;

  if (event.message.type !== 'text') {
    console.log(`[LINE Webhook] Received non-text message from ${userId}`);
    return;
  }

  const messageText = event.message.text.trim().toLowerCase();
  console.log(`[LINE Webhook] Message from ${userId}: ${messageText}`);

  try {
    // Check if user has orders
    const user = await prisma.user.findUnique({
      where: { lineId: userId },
      include: {
        customers: {
          include: {
            orders: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 5,
            },
          },
        },
      },
    });

    if (!user) {
      await lineService.sendTextMessage(
        userId,
        'ไม่พบข้อมูลผู้ใช้ กรุณาติดต่อเจ้าหน้าที่'
      );
      return;
    }

    // Handle commands
    if (messageText.includes('สถานะ') || messageText.includes('status')) {
      // Get latest orders
      const customers = user.customers || [];
      const allOrders = customers.flatMap((c) => c.orders || []);

      if (allOrders.length === 0) {
        await lineService.sendTextMessage(
          userId,
          'คุณยังไม่มีคำสั่งซื้อในระบบ'
        );
        return;
      }

      // Show latest orders
      let response = '📦 คำสั่งซื้อล่าสุดของคุณ:\n\n';
      allOrders.slice(0, 3).forEach((order) => {
        response += `🔹 ${order.orderNumber}\n`;
        response += `   สถานะ: ${getStatusText(order.status)}\n`;
        response += `   ปลายทาง: ${order.destination || '-'}\n\n`;
      });

      await lineService.sendTextMessage(userId, response);
    } else if (messageText.includes('help') || messageText.includes('ช่วยเหลือ')) {
      await lineService.sendTextMessage(
        userId,
        '📖 คำสั่งที่ใช้ได้:\n\n' +
          '• "สถานะ" - ดูสถานะคำสั่งซื้อล่าสุด\n' +
          '• "help" - แสดงวิธีใช้งาน\n\n' +
          'ระบบจะแจ้งเตือนอัตโนมัติเมื่อมีการอัปเดทการจัดส่ง'
      );
    } else {
      // Default response
      await lineService.sendTextMessage(
        userId,
        'ขอบคุณสำหรับข้อความ 😊\n\nพิมพ์ "help" เพื่อดูคำสั่งที่ใช้ได้'
      );
    }
  } catch (error) {
    console.error('[LINE Webhook] Error handling message:', error);
    await lineService.sendTextMessage(
      userId,
      'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
    );
  }
}

// Helper function to get status text in Thai
function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'รอดำเนินการ',
    processing: 'กำลังดำเนินการ',
    shipped: 'กำลังจัดส่ง',
    in_transit: 'อยู่ระหว่างการขนส่ง',
    delivered: 'จัดส่งสำเร็จ',
    cancelled: 'ยกเลิก',
  };

  return statusMap[status] || status;
}

export default router;
