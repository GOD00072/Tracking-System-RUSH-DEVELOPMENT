import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

// Excel file path
const EXCEL_FILE = '/home/binamon/Downloads/ข้อมูล/agency_full_system_with_expenses.xlsx';

// Tier mapping from Thai to code
const TIER_MAP: Record<string, string> = {
  'ทั่วไป': 'regular',
  'VIP': 'vip',
  'VIP2': 'vip2',
  'ลูกค้าประจำ': 'loyal',
};

interface ExcelRow {
  [key: string]: any;
}

async function createTiers() {
  console.log('🏷️  Creating Customer Tiers...');

  const tiers = [
    {
      tierCode: 'regular',
      tierName: 'Regular',
      tierNameTh: 'ทั่วไป',
      exchangeRate: 0.26,
      minSpent: 0,
      maxSpent: 10000,
      color: '#6B7280',
      icon: 'user',
      sortOrder: 1,
      isActive: true,
    },
    {
      tierCode: 'loyal',
      tierName: 'Loyal Customer',
      tierNameTh: 'ลูกค้าประจำ',
      exchangeRate: 0.25,
      minSpent: 10000,
      maxSpent: 50000,
      color: '#3B82F6',
      icon: 'heart',
      sortOrder: 2,
      isActive: true,
    },
    {
      tierCode: 'vip',
      tierName: 'VIP',
      tierNameTh: 'VIP',
      exchangeRate: 0.25,
      minSpent: 50000,
      maxSpent: 100000,
      color: '#8B5CF6',
      icon: 'star',
      sortOrder: 3,
      isActive: true,
    },
    {
      tierCode: 'vip2',
      tierName: 'VIP2',
      tierNameTh: 'VIP2',
      exchangeRate: 0.24,
      minSpent: 100000,
      maxSpent: null,
      color: '#F59E0B',
      icon: 'crown',
      sortOrder: 4,
      isActive: true,
    },
  ];

  for (const tier of tiers) {
    await prisma.customerTier.upsert({
      where: { tierCode: tier.tierCode },
      update: tier,
      create: tier,
    });
  }

  console.log('✅ Created 4 tiers: regular, loyal, vip, vip2');
}

function readExcelSheetWithHeader(workbook: XLSX.WorkBook, sheetName: string): ExcelRow[] {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    console.warn(`⚠️  Sheet "${sheetName}" not found`);
    return [];
  }

  // Read sheet as raw array
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as any[][];

  if (rawData.length < 3) return [];

  // Find the header row (first row with actual data - skip empty rows)
  let headerRowIndex = 0;
  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    const hasContent = row.some((cell: any) => cell !== null && cell !== undefined && cell !== '');
    if (hasContent) {
      headerRowIndex = i;
      break;
    }
  }

  // Extract headers from that row
  const headers = rawData[headerRowIndex].map((h: any, i: number) =>
    h ? String(h).trim() : `Column${i}`
  );

  console.log(`   Sheet "${sheetName}" header row: ${headerRowIndex}, columns: ${headers.slice(0, 5).join(', ')}...`);

  // Skip header row, convert to objects
  const rows: ExcelRow[] = [];
  for (let i = headerRowIndex + 1; i < rawData.length; i++) {
    const row: ExcelRow = {};
    let hasData = false;

    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = rawData[i][j];
      if (rawData[i][j] !== null && rawData[i][j] !== undefined && rawData[i][j] !== '') {
        hasData = true;
      }
    }

    if (hasData) {
      rows.push(row);
    }
  }

  return rows;
}

function parseDate(value: any): Date | null {
  if (!value) return null;

  if (value instanceof Date) return value;

  // Excel serial date number
  if (typeof value === 'number') {
    const date = new Date((value - 25569) * 86400 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }

  // String date format (DD/MM/YYYY)
  if (typeof value === 'string') {
    // Try DD/MM/YYYY format
    const parts = value.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }

    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function parseNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = parseFloat(String(value).replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

function generateOrderNumber(shippingMethod: string, index: number): string {
  const prefix = shippingMethod === 'air' ? 'AIR' : shippingMethod === 'sea' ? 'SEA' : 'STR';
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${prefix}${year}${month}-${String(index).padStart(5, '0')}`;
}

async function importData() {
  console.log('📖 Reading Excel file...');
  const workbook = XLSX.readFile(EXCEL_FILE);

  console.log('📋 Available sheets:', workbook.SheetNames);

  // Read all sheets with proper headers
  const airSheet = readExcelSheetWithHeader(workbook, 'MIRIN เครื่องบิน 2025');
  const seaSheet = readExcelSheetWithHeader(workbook, 'MIRIN เรือ 2025');
  const storeSheet = readExcelSheetWithHeader(workbook, 'ออเดอร์สินค้าซื้อหน้าร้าน');

  // Payment sheet has proper headers already
  const paymentSheet = XLSX.utils.sheet_to_json(workbook.Sheets['เงินเข้า'], { defval: null }) as ExcelRow[];

  console.log(`📊 Data counts:`);
  console.log(`   - Air orders: ${airSheet.length}`);
  console.log(`   - Sea orders: ${seaSheet.length}`);
  console.log(`   - Store orders: ${storeSheet.length}`);
  console.log(`   - Payments: ${paymentSheet.length}`);

  // Show sample column headers
  if (airSheet.length > 0) {
    console.log(`   - Air columns: ${Object.keys(airSheet[0]).join(', ')}`);
  }

  // Extract unique customers with tier from order sheets
  const customerMap = new Map<string, { name: string; tier: string }>();

  const extractCustomer = (row: ExcelRow) => {
    const customerCode = row['รหัสลูกค้า'];
    const customerType = row['ประเภทลูกค้า'] || 'ทั่วไป';

    if (customerCode && !customerMap.has(String(customerCode))) {
      const tierCode = TIER_MAP[String(customerType)] || 'regular';
      customerMap.set(String(customerCode), {
        name: String(customerCode),
        tier: tierCode,
      });
    }
  };

  [...airSheet, ...seaSheet, ...storeSheet].forEach(extractCustomer);

  console.log(`\n👥 Found ${customerMap.size} unique customers`);

  // Create customers
  console.log('\n👥 Creating customers...');
  const customerIdMap = new Map<string, string>();

  let customerCount = 0;
  for (const [code, info] of customerMap) {
    try {
      const customer = await prisma.customer.create({
        data: {
          companyName: info.name,
          contactPerson: info.name,
          tier: info.tier,
          isActive: true,
        },
      });
      customerIdMap.set(code, customer.id);
      customerCount++;

      if (customerCount % 50 === 0) {
        console.log(`   Created ${customerCount} customers...`);
      }
    } catch (error) {
      console.error(`Failed to create customer ${code}:`, error);
    }
  }
  console.log(`✅ Created ${customerCount} customers`);

  // Import Orders and OrderItems
  console.log('\n📦 Creating orders and order items...');

  let orderCount = 0;
  let itemCount = 0;

  // Map to store itemCode -> orderItemId for payment linking
  const itemCodeToOrderItemId = new Map<string, string>();

  // Process Air orders - group by customer
  const airOrderGroups = new Map<string, ExcelRow[]>();
  airSheet.forEach(row => {
    const customerCode = String(row['รหัสลูกค้า'] || 'unknown');
    if (!airOrderGroups.has(customerCode)) {
      airOrderGroups.set(customerCode, []);
    }
    airOrderGroups.get(customerCode)!.push(row);
  });

  for (const [customerCode, items] of airOrderGroups) {
    const customerId = customerIdMap.get(customerCode);

    try {
      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber('air', ++orderCount),
          customerId: customerId || null,
          shippingMethod: 'air',
          status: 'processing',
          statusStep: 3,
          origin: 'Japan',
          destination: 'Thailand',
        },
      });

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemCode = item['Item Code'] ? String(item['Item Code']) : null;
        const productCode = item['รหัสสินค้า'] ? String(item['รหัสสินค้า']) : null;

        try {
          const orderItem = await prisma.orderItem.create({
            data: {
              orderId: order.id,
              sequenceNumber: i + 1,
              customerName: customerCode,
              itemCode: itemCode,
              productCode: productCode,
              productUrl: item['ลิ้งค์สินค้า'] ? String(item['ลิ้งค์สินค้า']) : null,
              priceYen: parseNumber(item['ราคา¥']),
              priceBaht: parseNumber(item['ราคาสินค้ารวมค่าบริการ']),
              itemStatus: item['สถานะของ'] ? String(item['สถานะของ']) : 'pending',
              shippingRound: item['ส่งกลับไทยรอบวันที่'] ? String(item['ส่งกลับไทยรอบวันที่']) : null,
              remarks: item['หมายเหตุ'] ? String(item['หมายเหตุ']) : null,
              statusStep: 3,
              clickDate: parseDate(item['วัน เดือน ปี']),
            },
          });

          // Store mapping for payment linking
          if (itemCode) {
            itemCodeToOrderItemId.set(itemCode, orderItem.id);
          }

          itemCount++;
        } catch (itemError: any) {
          if (!itemError.message?.includes('Unique constraint')) {
            console.error(`Failed to create air order item:`, itemError.message);
          }
        }
      }
    } catch (orderError) {
      console.error(`Failed to create air order for ${customerCode}:`, orderError);
    }
  }

  // Process Sea orders
  const seaOrderGroups = new Map<string, ExcelRow[]>();
  seaSheet.forEach(row => {
    const customerCode = String(row['รหัสลูกค้า'] || 'unknown');
    if (!seaOrderGroups.has(customerCode)) {
      seaOrderGroups.set(customerCode, []);
    }
    seaOrderGroups.get(customerCode)!.push(row);
  });

  for (const [customerCode, items] of seaOrderGroups) {
    const customerId = customerIdMap.get(customerCode);

    try {
      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber('sea', ++orderCount),
          customerId: customerId || null,
          shippingMethod: 'sea',
          status: 'processing',
          statusStep: 3,
          origin: 'Japan',
          destination: 'Thailand',
        },
      });

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemCode = item['Item Code'] ? String(item['Item Code']) : null;
        const productCode = item['รหัสสินค้า'] ? String(item['รหัสสินค้า']) : null;

        try {
          const orderItem = await prisma.orderItem.create({
            data: {
              orderId: order.id,
              sequenceNumber: i + 1,
              customerName: customerCode,
              itemCode: itemCode,
              productCode: productCode,
              productUrl: item['ลิ้งค์สินค้า'] ? String(item['ลิ้งค์สินค้า']) : null,
              priceYen: parseNumber(item['ราคา¥']),
              priceBaht: parseNumber(item['ราคาสินค้ารวมบริการ']),
              itemStatus: item['สถานะของ'] ? String(item['สถานะของ']) : 'pending',
              shippingRound: item['ส่งกลับไทยรอบวันที่'] ? String(item['ส่งกลับไทยรอบวันที่']) : null,
              remarks: item['หมายเหตุ'] ? String(item['หมายเหตุ']) : null,
              statusStep: 3,
              clickDate: parseDate(item['วัน เดือน ปี']),
            },
          });

          if (itemCode) {
            itemCodeToOrderItemId.set(itemCode, orderItem.id);
          }

          itemCount++;
        } catch (itemError: any) {
          if (!itemError.message?.includes('Unique constraint')) {
            console.error(`Failed to create sea order item:`, itemError.message);
          }
        }
      }
    } catch (orderError) {
      console.error(`Failed to create sea order for ${customerCode}:`, orderError);
    }
  }

  // Process Store orders
  const storeOrderGroups = new Map<string, ExcelRow[]>();
  storeSheet.forEach(row => {
    const customerCode = String(row['รหัสลูกค้า'] || row['ชื่อลูกค้า'] || 'unknown');
    if (!storeOrderGroups.has(customerCode)) {
      storeOrderGroups.set(customerCode, []);
    }
    storeOrderGroups.get(customerCode)!.push(row);
  });

  for (const [customerCode, items] of storeOrderGroups) {
    const customerId = customerIdMap.get(customerCode);

    try {
      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber('store', ++orderCount),
          customerId: customerId || null,
          shippingMethod: 'pickup',
          status: 'completed',
          statusStep: 9,
          origin: 'Store',
          destination: 'Store Pickup',
        },
      });

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        try {
          await prisma.orderItem.create({
            data: {
              orderId: order.id,
              sequenceNumber: i + 1,
              customerName: customerCode,
              productName: item['ชื่อสินค้า'] ? String(item['ชื่อสินค้า']) : null,
              priceYen: parseNumber(item['ราคาเยน'] || item['ราคา¥']),
              priceBaht: parseNumber(item['ราคาบาท']),
              itemStatus: 'completed',
              paymentStatus: 'paid',
              statusStep: 9,
              remarks: item['หมายเหตุ'] ? String(item['หมายเหตุ']) : null,
            },
          });
          itemCount++;
        } catch (itemError: any) {
          if (!itemError.message?.includes('Unique constraint')) {
            console.error(`Failed to create store order item:`, itemError.message);
          }
        }
      }
    } catch (orderError) {
      console.error(`Failed to create store order for ${customerCode}:`, orderError);
    }
  }

  console.log(`✅ Created ${orderCount} orders with ${itemCount} items`);
  console.log(`   Item codes mapped: ${itemCodeToOrderItemId.size}`);

  // Log sample item codes for debugging
  if (itemCodeToOrderItemId.size > 0) {
    const sampleCodes = Array.from(itemCodeToOrderItemId.keys()).slice(0, 5);
    console.log(`   Sample item codes: ${sampleCodes.join(', ')}`);
  }

  // Import Payments using Item Code matching
  console.log('\n💰 Importing payments...');
  let paymentCount = 0;
  let skippedPayments = 0;
  let noItemCode = 0;
  let noMatch = 0;
  let noAmount = 0;

  // Check payment sheet sample
  if (paymentSheet.length > 0) {
    console.log(`   Payment columns: ${Object.keys(paymentSheet[0]).join(', ')}`);
    const sampleItemCodes = paymentSheet.slice(0, 10).map(r => r['Item Code']).filter(Boolean);
    console.log(`   Sample payment Item Codes: ${sampleItemCodes.slice(0, 5).join(', ')}`);
  }

  for (const row of paymentSheet) {
    try {
      const itemCode = row['Item Code'];
      if (!itemCode) {
        noItemCode++;
        continue;
      }

      const orderItemId = itemCodeToOrderItemId.get(String(itemCode));
      if (!orderItemId) {
        noMatch++;
        continue;
      }

      const amount = parseNumber(row['ยอดเงินเข้า']) || parseNumber(row['ยอดจ่ายครั้งที่ 1']);
      if (!amount || amount <= 0) {
        noAmount++;
        continue;
      }

      // Determine payment type
      const paymentType = row['ประเภทการจ่าย (มัดจำ/เต็ม/รวมค่าส่ง)'];
      let installmentName = 'ชำระเต็มจำนวน';
      let installmentNumber = 1;

      if (paymentType) {
        const typeStr = String(paymentType);
        if (typeStr.includes('มัดจำ')) {
          installmentName = 'มัดจำ';
          installmentNumber = 1;
        } else if (typeStr.includes('เต็ม')) {
          installmentName = 'จ่ายเต็ม';
          installmentNumber = 1;
        } else if (typeStr.includes('ค่าส่ง')) {
          installmentName = 'รวมค่าส่ง';
          installmentNumber = 2;
        }
      }

      await prisma.payment.create({
        data: {
          orderItemId,
          installmentNumber,
          installmentName,
          amountBaht: amount,
          slipAmount: amount,
          status: 'verified',
          paymentMethod: row['วิธีการชำระเงิน (ธนาคาร)'] ? String(row['วิธีการชำระเงิน (ธนาคาร)']) : 'bank_transfer',
          paidAt: parseDate(row['วันที่']),
          notes: row['หมายเหตุ'] ? String(row['หมายเหตุ']) : null,
          verifiedBy: row['แอดมิน'] ? String(row['แอดมิน']) : null,
        },
      });
      paymentCount++;

      if (paymentCount % 500 === 0) {
        console.log(`   Created ${paymentCount} payments...`);
      }
    } catch (paymentError: any) {
      // Skip silently
      skippedPayments++;
    }
  }

  console.log(`✅ Created ${paymentCount} payments`);
  console.log(`   Skipped: ${noItemCode} (no item code) + ${noMatch} (no match) + ${noAmount} (no amount) + ${skippedPayments} (errors)`);
}

async function main() {
  console.log('🚀 Starting Excel Data Import\n');
  console.log('=' .repeat(50));

  try {
    // Step 1: Create Tiers
    await createTiers();

    // Step 2: Import all data
    await importData();

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Import completed successfully!');

    // Print summary
    const customerCount = await prisma.customer.count();
    const orderCount = await prisma.order.count();
    const itemCount = await prisma.orderItem.count();
    const paymentCount = await prisma.payment.count();
    const tierCount = await prisma.customerTier.count();

    console.log('\n📊 Final Summary:');
    console.log(`   - Tiers: ${tierCount}`);
    console.log(`   - Customers: ${customerCount}`);
    console.log(`   - Orders: ${orderCount}`);
    console.log(`   - Order Items: ${itemCount}`);
    console.log(`   - Payments: ${paymentCount}`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
