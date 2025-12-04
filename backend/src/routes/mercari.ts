import { Router } from 'express';
import axios from 'axios';

const router = Router();

// Mercari API URL (Python service running on localhost:3000)
const MERCARI_API_URL = process.env.MERCARI_API_URL || 'http://localhost:3000';

// GET /api/v1/mercari/search - Search Mercari products
router.get('/search', async (req, res) => {
  try {
    const { q, category, price_min, price_max, sort, status } = req.query;

    const params = new URLSearchParams();
    if (q) params.append('q', q as string);
    if (category) params.append('category', category as string);
    if (price_min) params.append('price_min', price_min as string);
    if (price_max) params.append('price_max', price_max as string);
    if (sort) params.append('sort', sort as string);
    if (status) params.append('status', status as string);

    const response = await axios.get(`${MERCARI_API_URL}/api/search?${params.toString()}`, {
      timeout: 30000,
    });

    res.json(response.data);
  } catch (error: any) {
    console.error('Mercari search error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch from Mercari',
      total: 0,
      items: [],
    });
  }
});

// GET /api/v1/mercari/item - Get item details
router.get('/item', async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Item ID is required',
      });
    }

    const response = await axios.get(`${MERCARI_API_URL}/api/item?id=${id}`, {
      timeout: 30000,
    });

    res.json(response.data);
  } catch (error: any) {
    console.error('Mercari item error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch item details',
    });
  }
});

// GET /api/v1/mercari/categories - Get categories
router.get('/categories', async (req, res) => {
  try {
    const response = await axios.get(`${MERCARI_API_URL}/api/categories`, {
      timeout: 10000,
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Mercari categories error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
    });
  }
});

export default router;
