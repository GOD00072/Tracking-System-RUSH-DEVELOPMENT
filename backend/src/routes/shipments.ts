import express from 'express';

const router = express.Router();

// GET /api/v1/shipments/track/:tracking_number
router.get('/track/:tracking_number', (req, res) => {
  const { tracking_number } = req.params;

  res.json({
    success: true,
    data: {
      tracking_number,
      current_status: 'In Transit',
      current_location: 'Singapore',
      message: 'This is a demo response. Real data will be integrated soon.',
    },
  });
});

// GET /api/v1/shipments/:id/history
router.get('/:id/history', (req, res) => {
  res.json({
    success: true,
    data: [],
  });
});

export default router;
