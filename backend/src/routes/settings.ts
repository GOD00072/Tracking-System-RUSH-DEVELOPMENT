import express from 'express';

const router = express.Router();

// In-memory storage (replace with database later)
let calculatorSettings = {
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
  },
  additional_services: {
    repack: 50,
  },
  company_info: {
    name: 'Ship Tracking Company',
    address: 'กรุงเทพมหานคร ประเทศไทย',
    phone: '02-XXX-XXXX',
    email: 'info@shiptracking.com',
  },
};

// GET /api/v1/settings/calculator
router.get('/calculator', (req, res) => {
  res.json({
    success: true,
    data: calculatorSettings,
  });
});

// PUT /api/v1/settings/calculator
router.put('/calculator', (req, res) => {
  const updates = req.body;

  // Update settings
  calculatorSettings = {
    ...calculatorSettings,
    ...updates,
  };

  res.json({
    success: true,
    data: calculatorSettings,
    message: 'Settings updated successfully',
  });
});

// PUT /api/v1/settings/calculator/:key
router.put('/calculator/:key', (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  if (calculatorSettings.hasOwnProperty(key)) {
    (calculatorSettings as any)[key] = value;
    res.json({
      success: true,
      data: calculatorSettings,
      message: `${key} updated successfully`,
    });
  } else {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Setting key not found',
      },
    });
  }
});

export default router;
