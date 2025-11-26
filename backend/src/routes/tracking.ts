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
            productUrl: true,
            productImages: true,
            priceYen: true,
            priceBaht: true,
            statusStep: true,
            itemStatus: true,
            paymentStatus: true,
            trackingNumber: true,
            trackingNumberJP: true,
            trackingNumberTH: true,
            remarks: true,
          },
          orderBy: { sequenceNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform data for public view
    const publicOrders = orders.map((order) => ({
      orderNumber: order.orderNumber,
      status: order.status,
      shippingMethod: order.shippingMethod === 'air' ? 'ทางอากาศ' : 'ทางเรือ',
      origin: order.origin,
      destination: order.destination,
      customerName: order.customer?.companyName || order.customer?.contactPerson || '-',
      createdAt: order.createdAt,
      items: order.orderItems.map((item) => ({
        sequenceNumber: item.sequenceNumber,
        productCode: item.productCode,
        productUrl: item.productUrl,
        productImage: Array.isArray(item.productImages) && item.productImages.length > 0 ? item.productImages[0] : null,
        priceYen: item.priceYen,
        priceBaht: item.priceBaht,
        statusStep: item.statusStep,
        statusName: getStatusName(item.statusStep || 1),
        paymentStatus: item.paymentStatus,
        paymentStatusName: getPaymentStatusName(item.paymentStatus || 'pending'),
        trackingNumber: item.trackingNumberTH || item.trackingNumberJP || item.trackingNumber,
        remarks: item.remarks,
      })),
      summary: {
        totalItems: order.orderItems.length,
        totalYen: order.orderItems.reduce((sum, i) => sum + Number(i.priceYen || 0), 0),
        totalBaht: order.orderItems.reduce((sum, i) => sum + Number(i.priceBaht || 0), 0),
      },
    }));

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

// GET /api/v1/tracking/:orderNumber - Public order status by order number
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
            productUrl: true,
            productImages: true,
            priceYen: true,
            priceBaht: true,
            statusStep: true,
            itemStatus: true,
            paymentStatus: true,
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

    // Transform data for public view
    const publicOrder = {
      orderNumber: order.orderNumber,
      status: order.status,
      statusName: getOrderStatusName(order.status),
      shippingMethod: order.shippingMethod === 'air' ? 'ทางอากาศ' : 'ทางเรือ',
      origin: order.origin,
      destination: order.destination,
      customerName: order.customer?.companyName || order.customer?.contactPerson || '-',
      createdAt: order.createdAt,
      items: order.orderItems.map((item) => ({
        sequenceNumber: item.sequenceNumber,
        productCode: item.productCode,
        productUrl: item.productUrl,
        productImage: Array.isArray(item.productImages) && item.productImages.length > 0 ? item.productImages[0] : null,
        allImages: Array.isArray(item.productImages) ? item.productImages : [],
        priceYen: item.priceYen,
        priceBaht: item.priceBaht,
        statusStep: item.statusStep,
        statusName: getStatusName(item.statusStep || 1),
        paymentStatus: item.paymentStatus,
        paymentStatusName: getPaymentStatusName(item.paymentStatus || 'pending'),
        trackingNumber: item.trackingNumberTH || item.trackingNumberJP || item.trackingNumber,
        remarks: item.remarks,
        statusHistory: item.statusHistory,
      })),
      summary: {
        totalItems: order.orderItems.length,
        totalYen: order.orderItems.reduce((sum, i) => sum + Number(i.priceYen || 0), 0),
        totalBaht: order.orderItems.reduce((sum, i) => sum + Number(i.priceBaht || 0), 0),
      },
    };

    res.json({
      success: true,
      data: publicOrder,
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
    shipped: 'จัดส่งแล้ว',
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
