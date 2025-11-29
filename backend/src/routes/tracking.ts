import express from 'express';
import prisma from '../lib/prisma';

const router = express.Router();

// GET /api/v1/tracking/lookup - Public order lookup by phone/LINE ID
router.get('/lookup', async (req, res) => {
  try {
    const { phone, lineId, name } = req.query;

    if (!phone && !lineId && !name) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'กรุณาระบุเบอร์โทร, LINE ID หรือชื่อเพื่อค้นหา',
        },
      });
    }

    // Find customer by phone or LINE ID
    const whereClause: any = {
      OR: [],
    };

    if (phone) {
      whereClause.OR.push({ phone: { contains: phone as string } });
    }

    if (lineId) {
      whereClause.OR.push({ lineId: { contains: lineId as string, mode: 'insensitive' } });
    }

    if (name) {
      whereClause.OR.push(
        { companyName: { contains: name as string, mode: 'insensitive' } },
        { contactPerson: { contains: name as string, mode: 'insensitive' } }
      );
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      select: {
        id: true,
        companyName: true,
        contactPerson: true,
        phone: true,
      },
    });

    if (customers.length === 0) {
      return res.json({
        success: true,
        data: {
          customers: [],
          orders: [],
          message: 'ไม่พบข้อมูลลูกค้าในระบบ',
        },
      });
    }

    // Get orders for these customers
    const customerIds = customers.map((c) => c.id);

    const orders = await prisma.order.findMany({
      where: {
        customerId: { in: customerIds },
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        statusStep: true,
        shippingMethod: true,
        origin: true,
        destination: true,
        createdAt: true,
        customer: {
          select: {
            companyName: true,
            contactPerson: true,
          },
        },
        orderItems: {
          select: {
            id: true,
            sequenceNumber: true,
            productCode: true,
            productName: true,
            productUrl: true,
            productImages: true,
            priceYen: true,
            priceBaht: true,
            statusStep: true,
            itemStatus: true,
            trackingNumber: true,
            trackingNumberJP: true,
            trackingNumberTH: true,
            remarks: true,
            payments: {
              select: {
                amountBaht: true,
                status: true,
              },
            },
          },
          orderBy: { sequenceNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform data for public view
    const publicOrders = orders.map((order) => {
      // Calculate order-level payment status
      const totalBaht = order.orderItems.reduce((sum, i) => sum + Number(i.priceBaht || 0), 0);
      const allPayments = order.orderItems.flatMap(item => item.payments || []);
      const paidPayments = allPayments.filter(p => p.status === 'paid' || p.status === 'verified');
      const paidBaht = paidPayments.reduce((sum, p) => sum + Number(p.amountBaht || 0), 0);

      let orderPaymentStatus = 'pending';
      if (paidBaht >= totalBaht && totalBaht > 0) {
        orderPaymentStatus = 'paid';
      } else if (paidBaht > 0) {
        orderPaymentStatus = 'partial';
      }

      return {
        orderNumber: order.orderNumber,
        status: order.status,
        statusStep: order.statusStep,
        statusName: getStatusName(order.statusStep || 1),
        shippingMethod: order.shippingMethod === 'air' ? 'ทางอากาศ' : 'ทางเรือ',
        origin: order.origin,
        destination: order.destination,
        customerName: order.customer?.companyName || order.customer?.contactPerson || '-',
        createdAt: order.createdAt,
        items: order.orderItems
          .filter(item => item.productCode !== 'FEE')
          .map((item) => ({
            sequenceNumber: item.sequenceNumber,
            productCode: item.productCode,
            productName: item.productName,
            productUrl: item.productUrl,
            productImage: Array.isArray(item.productImages) && item.productImages.length > 0 ? item.productImages[0] : null,
            priceYen: item.priceYen,
            priceBaht: item.priceBaht,
            statusStep: item.statusStep,
            statusName: getStatusName(item.statusStep || 1),
            trackingNumber: item.trackingNumberTH || item.trackingNumberJP || item.trackingNumber,
          })),
        summary: {
          totalItems: order.orderItems.filter(i => i.productCode !== 'FEE').length,
        },
      };
    });

    res.json({
      success: true,
      data: {
        customerName: customers[0]?.companyName || customers[0]?.contactPerson || '-',
        orders: publicOrders,
        totalOrders: publicOrders.length,
      },
    });
  } catch (error: any) {
    console.error('Error looking up orders:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOOKUP_ERROR',
        message: 'เกิดข้อผิดพลาดในการค้นหา กรุณาลองใหม่อีกครั้ง',
      },
    });
  }
});

// POST /api/v1/tracking/verify - Verify phone and get order details
router.post('/verify', async (req, res) => {
  try {
    const { orderNumber, phoneLast4 } = req.body;

    if (!orderNumber || !phoneLast4) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'กรุณาระบุหมายเลขออเดอร์และเบอร์โทร 4 ตัวหลัง',
        },
      });
    }

    // Find order with customer phone and payment info
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: {
          equals: orderNumber,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        statusStep: true,
        shippingMethod: true,
        origin: true,
        destination: true,
        createdAt: true,
        customer: {
          select: {
            companyName: true,
            contactPerson: true,
            phone: true,
          },
        },
        orderItems: {
          select: {
            id: true,
            sequenceNumber: true,
            productCode: true,
            productName: true,
            productUrl: true,
            productImages: true,
            priceYen: true,
            priceBaht: true,
            statusStep: true,
            itemStatus: true,
            trackingNumber: true,
            trackingNumberJP: true,
            trackingNumberTH: true,
            remarks: true,
            statusHistory: {
              select: {
                statusStep: true,
                statusName: true,
                timestamp: true,
              },
              orderBy: { timestamp: 'desc' },
              take: 5,
            },
            payments: {
              select: {
                amountBaht: true,
                status: true,
              },
            },
          },
          orderBy: { sequenceNumber: 'asc' },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'ไม่พบออเดอร์หมายเลขนี้ในระบบ',
        },
      });
    }

    // Verify phone last 4 digits
    const customerPhone = order.customer?.phone?.replace(/\D/g, '') || '';
    if (customerPhone.length >= 4) {
      const actualLast4 = customerPhone.slice(-4);
      if (phoneLast4 !== actualLast4) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'VERIFICATION_FAILED',
            message: 'เบอร์โทร 4 ตัวหลังไม่ถูกต้อง',
          },
        });
      }
    }

    // Calculate order-level payment status from payment records
    const totalBaht = order.orderItems.reduce((sum, i) => sum + Number(i.priceBaht || 0), 0);
    const allPayments = order.orderItems.flatMap(item => item.payments || []);
    const paidPayments = allPayments.filter(p => p.status === 'paid' || p.status === 'verified');
    const paidBaht = paidPayments.reduce((sum, p) => sum + Number(p.amountBaht || 0), 0);

    let orderPaymentStatus = 'pending';
    if (paidBaht >= totalBaht && totalBaht > 0) {
      orderPaymentStatus = 'paid';
    } else if (paidBaht > 0) {
      orderPaymentStatus = 'partial';
    }

    // Verification passed - return order details
    const publicOrder = {
      orderNumber: order.orderNumber,
      status: order.status,
      statusStep: order.statusStep,
      statusName: getStatusName(order.statusStep || 1),
      shippingMethod: order.shippingMethod === 'air' ? 'ทางอากาศ' : 'ทางเรือ',
      origin: order.origin,
      destination: order.destination,
      customerName: order.customer?.companyName || order.customer?.contactPerson || '-',
      createdAt: order.createdAt,
      items: order.orderItems
        .filter(item => item.productCode !== 'FEE')
        .map((item) => ({
          sequenceNumber: item.sequenceNumber,
          productCode: item.productCode,
          productName: item.productName,
          productUrl: item.productUrl,
          productImage: Array.isArray(item.productImages) && item.productImages.length > 0 ? item.productImages[0] : null,
          allImages: Array.isArray(item.productImages) ? item.productImages : [],
          priceYen: item.priceYen,
          priceBaht: item.priceBaht,
          statusStep: item.statusStep,
          statusName: getStatusName(item.statusStep || 1),
          trackingNumber: item.trackingNumberTH || item.trackingNumberJP || item.trackingNumber,
          statusHistory: item.statusHistory,
        })),
      summary: {
        totalItems: order.orderItems.filter(i => i.productCode !== 'FEE').length,
      },
    };

    res.json({
      success: true,
      data: publicOrder,
    });
  } catch (error: any) {
    console.error('Error verifying order:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'VERIFICATION_ERROR',
        message: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
      },
    });
  }
});

// GET /api/v1/tracking/:orderNumber - Check order and return masked phone for verification
router.get('/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        orderNumber: {
          equals: orderNumber,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        shippingMethod: true,
        createdAt: true,
        customer: {
          select: {
            companyName: true,
            contactPerson: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'ไม่พบออเดอร์หมายเลขนี้ในระบบ',
        },
      });
    }

    // Check if customer has phone for verification
    const customerPhone = order.customer?.phone?.replace(/\D/g, '') || '';
    const requiresVerification = customerPhone.length >= 4;

    // Mask phone number (show first 3 and last 1 digit: 095-XXX-XX17)
    let maskedPhone = '';
    if (customerPhone.length >= 4) {
      const first3 = customerPhone.slice(0, 3);
      const last1 = customerPhone.slice(-1);
      maskedPhone = `${first3}-XXX-XXX${last1}`;
    }

    res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        customerName: order.customer?.companyName || order.customer?.contactPerson || '-',
        shippingMethod: order.shippingMethod === 'air' ? 'ทางอากาศ' : 'ทางเรือ',
        createdAt: order.createdAt,
        requiresVerification,
        maskedPhone,
      },
    });
  } catch (error: any) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: 'เกิดข้อผิดพลาดในการค้นหา กรุณาลองใหม่อีกครั้ง',
      },
    });
  }
});

// Helper functions
function getStatusName(step: number): string {
  const names: Record<number, string> = {
    1: 'รับออเดอร์',
    2: 'ชำระเงินงวดแรก',
    3: 'สั่งซื้อจากญี่ปุ่น',
    4: 'ของถึงโกดังญี่ปุ่น',
    5: 'ส่งออกจากญี่ปุ่น',
    6: 'ของถึงไทย',
    7: 'กำลังจัดส่ง',
    8: 'ส่งมอบสำเร็จ',
  };
  return names[step] || `สถานะ ${step}`;
}

function getOrderStatusName(status: string): string {
  const names: Record<string, string> = {
    pending: 'รอดำเนินการ',
    processing: 'กำลังดำเนินการ',
    shipped: 'กำลังจัดส่ง',
    delivered: 'ส่งถึงแล้ว',
    cancelled: 'ยกเลิก',
  };
  return names[status] || status;
}

function getPaymentStatusName(status: string): string {
  const names: Record<string, string> = {
    pending: 'รอชำระ',
    partial: 'ชำระบางส่วน',
    paid: 'ชำระครบ',
    refunded: 'คืนเงิน',
  };
  return names[status] || status;
}

export default router;
