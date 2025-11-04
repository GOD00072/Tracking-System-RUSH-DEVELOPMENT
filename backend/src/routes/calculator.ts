import express from 'express';

const router = express.Router();

// POST /api/v1/calculator/calculate
router.post('/calculate', (req, res) => {
  const { shipping_method, weight, volume } = req.body;

  // Simple calculation demo
  const base_fee = shipping_method === 'sea' ? 1000 : 2000;
  const rate_per_kg = shipping_method === 'sea' ? 5 : 15;
  const weight_charge = parseFloat(weight) * rate_per_kg;
  const total_cost = base_fee + weight_charge;

  res.json({
    success: true,
    data: {
      shipping_method,
      weight: parseFloat(weight),
      volume: parseFloat(volume),
      base_fee,
      rate_per_kg,
      weight_charge,
      total_cost,
      estimated_days: shipping_method === 'sea' ? 14 : 3,
      currency: 'THB',
    },
  });
});

export default router;
