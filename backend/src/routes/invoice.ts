import express from 'express';
import prisma from '../lib/prisma';
import { authenticateAdmin, AuthRequest } from '../middleware/auth';
import { generateOrderInvoice } from '../services/invoiceService';

const router = express.Router();

// GET /api/v1/invoice/order/:orderId - Generate invoice PDF for an order
router.get('/order/:orderId', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { orderId } = req.params;

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { orderNumber: true },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Order not found',
        },
      });
    }

    // Generate PDF
    const pdfBuffer = await generateOrderInvoice(orderId);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.orderNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Error generating invoice:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GENERATION_ERROR',
        message: error.message || 'Failed to generate invoice',
      },
    });
  }
});

// GET /api/v1/invoice/preview/order/:orderId - Preview invoice data (JSON)
router.get('/preview/order/:orderId', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        orderItems: {
          orderBy: { sequenceNumber: 'asc' },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Order not found',
        },
      });
    }

    // Get bank settings
    const bankSettings = await prisma.systemSetting.findUnique({
      where: { key: 'payment_bank' },
    });

    const bankInfo = bankSettings?.value as any;

    // Prepare preview data
    const previewData = {
      invoiceNumber: `INV-${order.orderNumber}`,
      date: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      customer: {
        name: order.customer?.companyName || order.customer?.contactPerson || 'ลูกค้า',
        phone: order.customer?.phone,
        address: order.customer?.address,
      },
      items: order.orderItems.map((item, idx) => ({
        no: idx + 1,
        description: item.productCode || `สินค้า #${item.sequenceNumber}`,
        priceYen: item.priceYen ? Number(item.priceYen) : null,
        priceBaht: Number(item.priceBaht) || 0,
        quantity: 1,
      })),
      subtotal: order.orderItems.reduce((sum, item) => sum + Number(item.priceBaht || 0), 0),
      total: order.orderItems.reduce((sum, item) => sum + Number(item.priceBaht || 0), 0),
      bankInfo: bankInfo ? {
        bankName: bankInfo.bank_name,
        accountName: bankInfo.account_name,
        accountNumber: bankInfo.account_number,
      } : null,
      notes: order.notes,
    };

    res.json({
      success: true,
      data: previewData,
    });
  } catch (error: any) {
    console.error('Error getting invoice preview:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PREVIEW_ERROR',
        message: error.message || 'Failed to get invoice preview',
      },
    });
  }
});

// POST /api/v1/invoice/send/:orderId - Send invoice via LINE (future feature)
router.post('/send/:orderId', authenticateAdmin, async (req: AuthRequest, res) => {
  try {
    const { orderId } = req.params;

    // For now, just return success - actual LINE sending can be added later
    res.json({
      success: true,
      message: 'Invoice generation is ready. LINE sending feature coming soon.',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SEND_ERROR',
        message: error.message || 'Failed to send invoice',
      },
    });
  }
});

export default router;
