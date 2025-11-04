import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: [],
  });
});

router.post('/', (req, res) => {
  res.status(201).json({
    success: true,
    data: req.body,
  });
});

export default router;
