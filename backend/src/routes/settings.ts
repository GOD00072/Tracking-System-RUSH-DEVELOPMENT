import express from 'express';
import prisma from '../lib/prisma';
import { authenticateAdmin } from '../middleware/auth';
import { lineService } from '../services/lineService';

const router = express.Router();

// Default settings
const defaultCalculatorSettings = {
  exchange_rates: {
    member: 0.250,
    vip: 0.240,
    vvip: 0.230,
  },
  shipping_rates_japan: {
    air: 700,
    sea: 1000,
  },
  courier_rates_thailand: {
    dhl: 26,
    best: 35,
    lalamove: 50,
    thaipost: 40,
    pickup: 0,
  },
  additional_services: [
    { id: '1', name: 'Repack/Bubble', price: 50, isActive: true },
  ],
  weight_price_ranges: [
    { id: '1', minWeight: 0, maxWeight: 1, price: 500 },
    { id: '2', minWeight: 1, maxWeight: 3, price: 700 },
    { id: '3', minWeight: 3, maxWeight: 5, price: 900 },
    { id: '4', minWeight: 5, maxWeight: 10, price: 1200 },
  ],
  length_price_ranges: [
    { id: '1', minLength: 0, maxLength: 30, price: 0 },
    { id: '2', minLength: 30, maxLength: 60, price: 100 },
    { id: '3', minLength: 60, maxLength: 100, price: 200 },
    { id: '4', minLength: 100, maxLength: 150, price: 400 },
  ],
  company_info: {
    name: 'Ship Tracking Company',
    address: 'กรุงเทพมหานคร ประเทศไทย',
    phone: '02-XXX-XXXX',
    email: 'info@shiptracking.com',
  },
};

const defaultLineSettings = {
  enabled: false,
  channel_access_token: '',
  channel_secret: '',
  webhook_url: '',
  auto_notify_shipping_update: true,
  notify_on_status: ['shipped', 'in_transit', 'delivered'],
};

const defaultBankSettings = {
  bankName: 'ธนาคารกสิกรไทย',
  accountName: 'บริษัท ปักกุเนโกะ จำกัด',
  accountNumber: '123-4-56789-0',
};

// Helper function to get setting
async function getSetting(key: string, defaultValue: any) {
  const setting = await prisma.systemSetting.findUnique({
    where: { key },
  });
  return setting ? setting.value : defaultValue;
}

// Helper function to update setting
async function updateSetting(key: string, value: any, category?: string) {
  return await prisma.systemSetting.upsert({
    where: { key },
    update: { value, category },
    create: { key, value, category },
  });
}

// GET /api/v1/settings/calculator
router.get('/calculator', async (req, res) => {
  try {
    const settings = await getSetting('calculator', defaultCalculatorSettings);
    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching calculator settings:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch settings',
      },
    });
  }
});

// PUT /api/v1/settings/calculator (Admin only)
router.put('/calculator', authenticateAdmin, async (req, res) => {
  try {
    const updates = req.body;
    await updateSetting('calculator', updates, 'calculator');

    res.json({
      success: true,
      data: updates,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating calculator settings:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update settings',
      },
    });
  }
});

// GET /api/v1/settings/line (Admin only)
router.get('/line', authenticateAdmin, async (req, res) => {
  try {
    const settings = await getSetting('line_oa', defaultLineSettings);
    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching LINE settings:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch LINE settings',
      },
    });
  }
});

// PUT /api/v1/settings/line (Admin only)
router.put('/line', authenticateAdmin, async (req, res) => {
  try {
    const updates = req.body;

    // Don't store sensitive data in plain text (for now, just update)
    // TODO: Encrypt channel_access_token and channel_secret
    await updateSetting('line_oa', updates, 'line');

    // Reinitialize LINE service with new settings
    if (updates.enabled && updates.channel_access_token && updates.channel_secret) {
      const initialized = await lineService.reinitialize();
      console.log('[Settings] LINE service reinitialized:', initialized);
    }

    res.json({
      success: true,
      data: updates,
      message: 'LINE settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating LINE settings:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update LINE settings',
      },
    });
  }
});

// Test LINE connection (Admin only)
router.post('/line/test', authenticateAdmin, async (req, res) => {
  try {
    const settings = await getSetting('line_oa', defaultLineSettings);

    if (!settings.enabled || !settings.channel_access_token) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'LINE_NOT_CONFIGURED',
          message: 'LINE OA is not configured or disabled',
        },
      });
    }

    // Test LINE API connection
    const testUserId = req.body.userId;
    if (!testUserId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_USER_ID',
          message: 'Please provide a LINE User ID to test',
        },
      });
    }

    // Send test message (will implement in LINE service)
    res.json({
      success: true,
      message: 'LINE connection test will be implemented with LINE messaging service',
    });
  } catch (error) {
    console.error('Error testing LINE connection:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TEST_ERROR',
        message: 'Failed to test LINE connection',
      },
    });
  }
});

// GET /api/v1/settings/bank (Admin only)
router.get('/bank', authenticateAdmin, async (req, res) => {
  try {
    const settings = await getSetting('bank_info', defaultBankSettings);
    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching bank settings:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'Failed to fetch bank settings',
      },
    });
  }
});

// PUT /api/v1/settings/bank (Admin only)
router.put('/bank', authenticateAdmin, async (req, res) => {
  try {
    const updates = req.body;
    await updateSetting('bank_info', updates, 'payment');

    res.json({
      success: true,
      data: updates,
      message: 'Bank settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating bank settings:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update bank settings',
      },
    });
  }
});

export default router;
