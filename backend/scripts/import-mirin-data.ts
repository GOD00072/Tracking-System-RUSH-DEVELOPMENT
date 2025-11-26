import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface CSVRow {
  sequenceNumber: number;
  clickDate: string;
  clickChannel: string;
  clickerName: string;
  customerName: string;
  productCode: string;
  productUrl: string;
  priceYen: number;
  priceBaht: number;
  itemStatus: string;
  paymentStatus: string;
  shippingRound: string;
  tracking: string;
  storePage: string;
  remarks: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Format: 2025/01/01
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // JavaScript months are 0-indexed
    const day = parseInt(parts[2]);
    return new Date(year, month, day);
  }
  return null;
}

function mapItemStatus(status: string): { itemStatus: string; statusStep: number } {
  const statusMap: Record<string, { itemStatus: string; statusStep: number }> = {
    'ของเข้าบ้านแล้ว': { itemStatus: 'ส่งมอบสำเร็จ', statusStep: 8 },
    'ของยังไม่เข้าบ้าน': { itemStatus: 'กำลังจัดส่ง', statusStep: 7 },
    'ของถึงไทย': { itemStatus: 'ของถึงไทย', statusStep: 6 },
    'ส่งออกจาก JP': { itemStatus: 'ส่งออกจาก JP', statusStep: 5 },
    'ของถึงโกดัง JP': { itemStatus: 'ของถึงโกดัง JP', statusStep: 4 },
    'สั่งซื้อจาก JP': { itemStatus: 'สั่งซื้อจาก JP', statusStep: 3 },
    'ชำระเงินงวดแรก': { itemStatus: 'ชำระเงินงวดแรก', statusStep: 2 },
    'รับออเดอร์': { itemStatus: 'รับออเดอร์', statusStep: 1 },
  };

  return statusMap[status] || { itemStatus: status || 'รับออเดอร์', statusStep: 1 };
}

function mapPaymentStatus(status: string): string {
  if (!status) return 'pending';
  if (status === 'ยกเลิก') return 'cancelled';
  if (status.includes('ชำระแล้ว') || status.includes('จ่ายแล้ว')) return 'paid';
  return 'pending';
}

async function importData() {
  console.log('Starting import...');

  // Read CSV file
  const csvPath = '/tmp/mirin_data.csv';
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter((line) => line.trim());

  // Skip first row (totals) and second row (headers)
  const dataLines = lines.slice(2);

  console.log(`Found ${dataLines.length} rows to import`);

  // Collect unique customer names
  const customerNames = new Set<string>();
  const parsedRows: CSVRow[] = [];

  for (const line of dataLines) {
    const cols = parseCSVLine(line);
    if (cols.length < 10) continue;

    const row: CSVRow = {
      sequenceNumber: parseInt(cols[0]) || 0,
      clickDate: cols[1] || '',
      clickChannel: cols[2] || '',
      clickerName: cols[3] || '',
      customerName: cols[4] || '',
      productCode: cols[5] || '',
      productUrl: cols[6] || '',
      priceYen: parseFloat(cols[7]) || 0,
      priceBaht: parseFloat(cols[8]) || 0,
      itemStatus: cols[9] || '',
      paymentStatus: cols[10] || '',
      shippingRound: cols[11] || '',
      tracking: cols[12] || '',
      storePage: cols[13] || '',
      remarks: cols[14] || '',
    };

    if (row.customerName && row.sequenceNumber > 0) {
      customerNames.add(row.customerName);
      parsedRows.push(row);
    }
  }

  console.log(`Found ${customerNames.size} unique customers`);
  console.log(`Valid rows: ${parsedRows.length}`);

  // Create customers
  const customerMap = new Map<string, string>(); // customerName -> customerId

  for (const name of customerNames) {
    // Check if customer already exists
    let customer = await prisma.customer.findFirst({
      where: {
        OR: [{ companyName: name }, { contactPerson: name }],
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          companyName: name,
          contactPerson: name,
          tier: 'regular',
        },
      });
      console.log(`Created customer: ${name}`);
    } else {
      console.log(`Customer exists: ${name}`);
    }

    customerMap.set(name, customer.id);
  }

  // Create Order for MIRIN เครื่องบิน 2025
  const orderNumber = 'MIRIN-AIR-2025';

  let order = await prisma.order.findUnique({
    where: { orderNumber },
  });

  if (!order) {
    order = await prisma.order.create({
      data: {
        orderNumber,
        shippingMethod: 'air',
        status: 'processing',
        origin: 'Japan',
        destination: 'Thailand',
        notes: 'MIRIN เครื่องบิน 2025 - Imported from Excel',
      },
    });
    console.log(`Created order: ${orderNumber}`);
  } else {
    console.log(`Order exists: ${orderNumber}`);
  }

  // Create OrderItems
  let created = 0;
  let skipped = 0;

  for (const row of parsedRows) {
    // Check if item already exists
    const existingItem = await prisma.orderItem.findFirst({
      where: {
        orderId: order.id,
        productCode: row.productCode,
        sequenceNumber: row.sequenceNumber,
      },
    });

    if (existingItem) {
      skipped++;
      continue;
    }

    const { itemStatus, statusStep } = mapItemStatus(row.itemStatus);
    const clickDate = parseDate(row.clickDate);

    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        sequenceNumber: row.sequenceNumber,
        clickDate: clickDate,
        clickChannel: row.clickChannel,
        clickerName: row.clickerName,
        customerName: row.customerName,
        productCode: row.productCode,
        productUrl: row.productUrl,
        priceYen: row.priceYen,
        priceBaht: row.priceBaht,
        itemStatus: itemStatus,
        paymentStatus: mapPaymentStatus(row.paymentStatus),
        shippingRound: row.shippingRound || null,
        trackingNumber: row.tracking || null,
        storePage: row.storePage || null,
        remarks: row.remarks || null,
        statusStep: statusStep,
      },
    });
    created++;

    if (created % 100 === 0) {
      console.log(`Created ${created} items...`);
    }
  }

  // Calculate total for order
  const totals = await prisma.orderItem.aggregate({
    where: { orderId: order.id },
    _sum: {
      priceBaht: true,
      priceYen: true,
    },
    _count: true,
  });

  // Update order with totals
  await prisma.order.update({
    where: { id: order.id },
    data: {
      estimatedCost: totals._sum.priceBaht,
      notes: `MIRIN เครื่องบิน 2025 - ${totals._count} items, ¥${totals._sum.priceYen?.toFixed(0) || 0}, ฿${totals._sum.priceBaht?.toFixed(2) || 0}`,
    },
  });

  console.log('\n=== Import Complete ===');
  console.log(`Customers created/found: ${customerNames.size}`);
  console.log(`Order items created: ${created}`);
  console.log(`Order items skipped (duplicates): ${skipped}`);
  console.log(`Total items in order: ${totals._count}`);
  console.log(`Total Yen: ¥${totals._sum.priceYen?.toFixed(0) || 0}`);
  console.log(`Total Baht: ฿${totals._sum.priceBaht?.toFixed(2) || 0}`);
}

importData()
  .catch((e) => {
    console.error('Import error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
