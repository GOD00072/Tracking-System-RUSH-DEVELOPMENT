import express from 'express';

const router = express.Router();

router.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      total_orders: 1250,
      active_shipments: 45,
      delivered_this_month: 120,
      average_delivery_days: 12,
      customer_satisfaction: 4.7,
      revenue_this_month: 1500000,
    },
  });
});

export default router;
