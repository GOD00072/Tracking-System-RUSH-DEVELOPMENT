import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Reorganize order items: Create individual orders per customer
 * from the bulk imported MIRIN-AIR-2025 order
 */
async function reorganizeOrders() {
  console.log('Starting order reorganization...\n');

  // Find the bulk import order
  const bulkOrder = await prisma.order.findUnique({
    where: { orderNumber: 'MIRIN-AIR-2025' },
    include: {
      orderItems: true,
    },
  });

  if (!bulkOrder) {
    console.log('Bulk order MIRIN-AIR-2025 not found. Exiting.');
    return;
  }

  console.log(`Found bulk order with ${bulkOrder.orderItems.length} items\n`);

  // Group items by customerName
  const itemsByCustomer = new Map<string, typeof bulkOrder.orderItems>();

  for (const item of bulkOrder.orderItems) {
    const customerName = item.customerName || 'UNKNOWN';
    if (!itemsByCustomer.has(customerName)) {
      itemsByCustomer.set(customerName, []);
    }
    itemsByCustomer.get(customerName)!.push(item);
  }

  console.log(`Found ${itemsByCustomer.size} unique customers\n`);

  let ordersCreated = 0;
  let itemsMoved = 0;

  // Process each customer
  for (const [customerName, items] of itemsByCustomer) {
    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: {
        OR: [{ companyName: customerName }, { contactPerson: customerName }],
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          companyName: customerName,
          contactPerson: customerName,
          tier: 'regular',
        },
      });
      console.log(`Created customer: ${customerName}`);
    }

    // Calculate totals for this customer's items
    const totals = items.reduce(
      (acc, item) => {
        acc.yen += Number(item.priceYen) || 0;
        acc.baht += Number(item.priceBaht) || 0;
        return acc;
      },
      { yen: 0, baht: 0 }
    );

    // Get the earliest date from items for this customer
    const dates = items
      .filter((item) => item.clickDate)
      .map((item) => new Date(item.clickDate!))
      .sort((a, b) => a.getTime() - b.getTime());

    const orderDate = dates[0] || new Date();

    // Generate order number based on customer name and date
    const dateStr = orderDate.toISOString().slice(0, 10).replace(/-/g, '');
    const orderNumber = `AIR-${dateStr}-${customerName.substring(0, 6).toUpperCase()}`;

    // Check if order already exists
    let order = await prisma.order.findFirst({
      where: {
        orderNumber: {
          startsWith: `AIR-${dateStr}-${customerName.substring(0, 6).toUpperCase()}`,
        },
        customerId: customer.id,
      },
    });

    if (!order) {
      // Create order for this customer
      order = await prisma.order.create({
        data: {
          orderNumber: orderNumber,
          customerId: customer.id,
          shippingMethod: 'air',
          status: determineOrderStatus(items),
          origin: 'Japan',
          destination: 'Thailand',
          estimatedCost: totals.baht,
          notes: `MIRIN เครื่องบิน 2025 - ${items.length} items, ¥${totals.yen.toLocaleString()}, ฿${totals.baht.toLocaleString()}`,
          createdAt: orderDate,
        },
      });
      ordersCreated++;
      console.log(`Created order ${orderNumber} for ${customerName} (${items.length} items)`);
    }

    // Move items to this customer's order
    for (const item of items) {
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { orderId: order.id },
      });
      itemsMoved++;
    }
  }

  // Delete the empty bulk order
  const remainingItems = await prisma.orderItem.count({
    where: { orderId: bulkOrder.id },
  });

  if (remainingItems === 0) {
    await prisma.order.delete({
      where: { id: bulkOrder.id },
    });
    console.log('\nDeleted empty bulk order MIRIN-AIR-2025');
  }

  // Update customer totalSpent
  console.log('\nUpdating customer statistics...');
  const customers = await prisma.customer.findMany();

  for (const customer of customers) {
    const stats = await prisma.orderItem.aggregate({
      where: {
        order: {
          customerId: customer.id,
        },
      },
      _sum: {
        priceBaht: true,
      },
    });

    if (stats._sum.priceBaht) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          totalSpent: stats._sum.priceBaht,
        },
      });
    }
  }

  console.log('\n=== Reorganization Complete ===');
  console.log(`Orders created: ${ordersCreated}`);
  console.log(`Items moved: ${itemsMoved}`);
  console.log(`Customers processed: ${itemsByCustomer.size}`);
}

function determineOrderStatus(items: any[]): string {
  // Check all items status to determine overall order status
  const statusCounts = items.reduce(
    (acc, item) => {
      const step = item.statusStep || 1;
      acc[step] = (acc[step] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  // If all items are delivered (step 8)
  if (statusCounts[8] === items.length) {
    return 'delivered';
  }

  // If any items are in transit (step 5-7)
  if (statusCounts[5] || statusCounts[6] || statusCounts[7]) {
    return 'shipped';
  }

  // If any items are being processed (step 2-4)
  if (statusCounts[2] || statusCounts[3] || statusCounts[4]) {
    return 'processing';
  }

  return 'pending';
}

reorganizeOrders()
  .catch((e) => {
    console.error('Reorganization error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
