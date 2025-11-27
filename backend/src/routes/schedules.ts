import express from 'express';
import { authenticateAdmin } from '../middleware/auth';

const router = express.Router();

// All schedule routes require admin authentication
router.use(authenticateAdmin);

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: [],
  });
});

export default router;
