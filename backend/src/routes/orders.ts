import express from 'express';

const router = express.Router();

// GET /api/v1/orders
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      total_pages: 0,
    },
  });
});

// GET /api/v1/orders/:id
router.get('/:id', (req, res) => {
  res.json({
    success: true,
    data: null,
  });
});

// POST /api/v1/orders
router.post('/', (req, res) => {
  res.status(201).json({
    success: true,
    data: req.body,
  });
});

// PATCH /api/v1/orders/:id
router.patch('/:id', (req, res) => {
  res.json({
    success: true,
    data: req.body,
  });
});

// DELETE /api/v1/orders/:id
router.delete('/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Order deleted successfully',
  });
});

export default router;
