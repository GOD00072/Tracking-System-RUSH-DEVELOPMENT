import express from 'express';
import { lineOtpService } from '../../services/lineOtpService';

const router = express.Router();

// Parse JSON body for this router
router.use(express.json());

// LINE OTP Webhook - receives events from LINE OTP channel
router.post('/', async (req, res) => {
  try {
    const events = req.body.events || [];

    console.log('[LINE OTP Webhook] Received events:', JSON.stringify(events, null, 2));

    for (const event of events) {
      // Log event source for debugging
      console.log('[LINE OTP Webhook] Event type:', event.type);
      console.log('[LINE OTP Webhook] Source:', JSON.stringify(event.source));

      // If event is from a group, log the group ID
      if (event.source?.type === 'group') {
        const groupId = event.source.groupId;
        console.log('============================================');
        console.log('[LINE OTP Webhook] GROUP ID FOUND:', groupId);
        console.log('============================================');

        // Auto-set the group ID
        lineOtpService.setGroupId(groupId);

        // Reply with confirmation if it's a message event
        if (event.type === 'message' && event.message?.type === 'text') {
          const text = event.message.text.toLowerCase();

          // If message contains "setgroup" or "debug", reply with group ID
          if (text.includes('setgroup') || text.includes('debug') || text.includes('groupid')) {
            console.log(`[LINE OTP Webhook] Group ID set to: ${groupId}`);
          }
        }
      }

      // Handle join event (bot added to group)
      if (event.type === 'join' && event.source?.type === 'group') {
        const groupId = event.source.groupId;
        console.log('============================================');
        console.log('[LINE OTP Webhook] BOT JOINED GROUP:', groupId);
        console.log('============================================');
        lineOtpService.setGroupId(groupId);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[LINE OTP Webhook] Error:', error);
    res.status(500).json({ success: false, error: 'Webhook error' });
  }
});

// Debug endpoint to get current group ID
router.get('/debug', (req, res) => {
  const groupId = lineOtpService.getGroupId();
  res.json({
    success: true,
    groupId: groupId || 'Not set - send a message in the group first',
    message: groupId
      ? 'Group ID is set. Ready to send notifications.'
      : 'Please add the bot to a group and send a message to capture the group ID.',
  });
});

// Test endpoint to send a test message
router.post('/test', async (req, res) => {
  const { message } = req.body;
  const groupId = lineOtpService.getGroupId();

  if (!groupId) {
    return res.status(400).json({
      success: false,
      error: 'Group ID not set. Add bot to group and send a message first.',
    });
  }

  const success = await lineOtpService.sendTextToGroup(message || 'Test message from PakkuNeko Admin');

  res.json({
    success,
    groupId,
  });
});

// Set group ID manually
router.post('/set-group', (req, res) => {
  const { groupId } = req.body;

  if (!groupId) {
    return res.status(400).json({
      success: false,
      error: 'groupId is required',
    });
  }

  lineOtpService.setGroupId(groupId);

  res.json({
    success: true,
    groupId,
    message: 'Group ID has been set successfully',
  });
});

export default router;
