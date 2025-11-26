import PDFDocument from 'pdfkit';
import prisma from '../lib/prisma';
import path from 'path';
import fs from 'fs';

// Asset paths - use process.cwd() for consistent path resolution
const THAI_FONT_PATH = path.join(process.cwd(), 'assets/fonts/Sarabun-Regular.ttf');
const LOGO_PATH = path.join(process.cwd(), 'assets/images/pakkuneko-logo.png');

// Brand colors
const COLORS = {
  primary: '#1e3a5f',      // Navy blue (from logo uniform)
  secondary: '#2563eb',    // Bright blue
  accent: '#f59e0b',       // Gold/Yellow (from logo hat badge)
  light: '#f8fafc',        // Light background
  border: '#e2e8f0',       // Light border
  text: '#1e293b',         // Dark text
  textLight: '#64748b',    // Light text
  success: '#10b981',      // Green
  white: '#ffffff',
};

interface InvoiceItem {
  no: number;
  description: string;
  priceYen?: number;
  priceBaht: number;
  weight?: number;        // น้ำหนัก (kg)
  shippingCost?: number;  // ค่าจัดส่ง
}

interface InvoiceData {
  invoiceNumber: string;
  date: Date;
  dueDate?: Date;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  items: InvoiceItem[];
  subtotal: number;           // ยอดรวมราคาสินค้า
  totalWeight: number;        // น้ำหนักรวม
  totalShipping: number;      // ค่าจัดส่งรวม
  discount?: number;
  total: number;              // ยอดรวมทั้งหมด
  notes?: string;
  bankInfo?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
  };
}

export async function generateOrderInvoice(orderId: string): Promise<Buffer> {
  // Fetch order data
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
    throw new Error('Order not found');
  }

  // Get system settings for bank info
  const bankSettings = await prisma.systemSetting.findUnique({
    where: { key: 'payment_bank' },
  });

  const bankInfo = bankSettings?.value as any;

  // Calculate totals
  const subtotal = order.orderItems.reduce((sum, item) => sum + Number(item.priceBaht || 0), 0);
  const totalWeight = order.orderItems.reduce((sum, item) => sum + Number(item.weight || 0), 0);
  const totalShipping = order.orderItems.reduce((sum, item) => sum + Number(item.shippingCost || 0), 0);
  const total = subtotal + totalShipping;

  // Prepare invoice data
  const invoiceData: InvoiceData = {
    invoiceNumber: `INV-${order.orderNumber}`,
    date: new Date(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    customerName: order.customer?.companyName || order.customer?.contactPerson || 'ลูกค้า',
    customerPhone: order.customer?.phone || undefined,
    customerAddress: order.customer?.address || undefined,
    items: order.orderItems.map((item, idx) => ({
      no: idx + 1,
      description: item.productCode || `สินค้า #${item.sequenceNumber}`,
      priceYen: item.priceYen ? Number(item.priceYen) : undefined,
      priceBaht: Number(item.priceBaht) || 0,
      weight: item.weight ? Number(item.weight) : undefined,
      shippingCost: item.shippingCost ? Number(item.shippingCost) : undefined,
    })),
    subtotal,
    totalWeight,
    totalShipping,
    total,
    notes: order.notes || undefined,
    bankInfo: bankInfo ? {
      bankName: bankInfo.bank_name,
      accountName: bankInfo.account_name,
      accountNumber: bankInfo.account_number,
    } : undefined,
  };

  return generateInvoicePDF(invoiceData);
}

export function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Calculate dynamic page height based on content
      const baseHeight = 480; // Header + customer info + table header
      const itemsHeight = data.items.length * 24; // Each row is 24pt
      const summaryHeight = 140; // More space for weight + shipping summary
      const bankHeight = data.bankInfo ? 100 : 0;
      const notesHeight = data.notes ? 60 : 0;
      const footerHeight = 80;
      const padding = 50;

      const calculatedHeight = baseHeight + itemsHeight + summaryHeight + bankHeight + notesHeight + footerHeight + padding;
      const pageHeight = Math.max(calculatedHeight, 650); // Minimum height 650pt

      const doc = new PDFDocument({
        size: [595.28, pageHeight], // A4 width, dynamic height
        margin: 40,
        info: {
          Title: `Invoice ${data.invoiceNumber}`,
          Author: 'PakkuNeko - Japan to Thailand Shipping',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Load Thai font (Sarabun)
      let thaiFont = 'Helvetica';
      if (fs.existsSync(THAI_FONT_PATH)) {
        try {
          doc.registerFont('Sarabun', THAI_FONT_PATH);
          thaiFont = 'Sarabun';
          console.log('[Invoice] Thai font (Sarabun) loaded successfully');
        } catch (e) {
          console.error('[Invoice] Could not load Thai font:', e);
        }
      }

      doc.font(thaiFont);

      const pageWidth = doc.page.width;
      const contentWidth = pageWidth - 80;
      const leftMargin = 40;
      const rightMargin = pageWidth - 40;

      // ==================== HEADER SECTION ====================

      // Logo
      if (fs.existsSync(LOGO_PATH)) {
        try {
          doc.image(LOGO_PATH, leftMargin, 30, { width: 70 });
        } catch (e) {
          console.error('[Invoice] Could not load logo:', e);
        }
      }

      // Company Name & Tagline
      doc.fillColor(COLORS.primary);
      doc.fontSize(22).text('PakkuNeko', 120, 40);
      doc.fontSize(10).fillColor(COLORS.textLight).text('Japan to Thailand Shipping Service', 120, 65);

      // Invoice Title Badge
      doc.roundedRect(rightMargin - 130, 35, 130, 45, 5).fill(COLORS.primary);
      doc.fillColor(COLORS.white);
      doc.fontSize(18).text('INVOICE', rightMargin - 125, 42, { width: 120, align: 'center' });
      doc.fontSize(9).text('ใบแจ้งหนี้', rightMargin - 125, 62, { width: 120, align: 'center' });

      // ==================== INVOICE INFO SECTION ====================

      // Invoice details box
      const infoBoxY = 100;
      doc.roundedRect(rightMargin - 180, infoBoxY, 180, 70, 5).fill(COLORS.light);
      doc.fillColor(COLORS.text).fontSize(9);

      doc.text('เลขที่ / Invoice No:', rightMargin - 175, infoBoxY + 10);
      doc.fontSize(11).fillColor(COLORS.primary).text(data.invoiceNumber, rightMargin - 175, infoBoxY + 22);

      doc.fontSize(9).fillColor(COLORS.text);
      doc.text('วันที่ / Date:', rightMargin - 175, infoBoxY + 40);
      doc.text(data.date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }), rightMargin - 100, infoBoxY + 40);

      if (data.dueDate) {
        doc.text('กำหนดชำระ:', rightMargin - 175, infoBoxY + 55);
        doc.fillColor(COLORS.accent).text(data.dueDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }), rightMargin - 100, infoBoxY + 55);
      }

      // ==================== CUSTOMER SECTION ====================

      const customerY = 110;
      doc.fillColor(COLORS.primary).fontSize(11).text('ลูกค้า / Bill To:', leftMargin, customerY);

      // Customer info box
      doc.roundedRect(leftMargin, customerY + 18, 220, 55, 5).lineWidth(1).strokeColor(COLORS.border).stroke();

      doc.fillColor(COLORS.text).fontSize(12).text(data.customerName, leftMargin + 10, customerY + 28);

      let customerInfoY = customerY + 45;
      doc.fontSize(9).fillColor(COLORS.textLight);
      if (data.customerPhone) {
        doc.text(`Tel: ${data.customerPhone}`, leftMargin + 10, customerInfoY);
        customerInfoY += 12;
      }
      if (data.customerAddress) {
        doc.text(data.customerAddress, leftMargin + 10, customerInfoY, { width: 200 });
      }

      // ==================== ITEMS TABLE ====================

      const tableTop = 200;
      // Updated headers with weight and shipping
      const tableHeaders = ['#', 'รายการ', 'ราคา(¥)', 'ราคา(฿)', 'น้ำหนัก', 'ค่าส่ง'];
      const columnWidths = [30, 180, 70, 70, 65, 70];

      // Table Header
      doc.roundedRect(leftMargin, tableTop, contentWidth, 28, 3).fill(COLORS.primary);

      doc.fillColor(COLORS.white).fontSize(9);
      let xPos = leftMargin;
      tableHeaders.forEach((header, i) => {
        const align = i > 1 ? 'right' : (i === 0 ? 'center' : 'left');
        doc.text(header, xPos + 5, tableTop + 9, {
          width: columnWidths[i] - 10,
          align: align as any
        });
        xPos += columnWidths[i];
      });

      // Table Rows
      let rowY = tableTop + 32;
      const rowHeight = 24;

      data.items.forEach((item, idx) => {
        // Alternate row colors
        if (idx % 2 === 0) {
          doc.rect(leftMargin, rowY, contentWidth, rowHeight).fill(COLORS.light);
        }

        doc.fillColor(COLORS.text).fontSize(9);
        xPos = leftMargin;

        // Number
        doc.text(item.no.toString(), xPos + 5, rowY + 7, { width: columnWidths[0] - 10, align: 'center' });
        xPos += columnWidths[0];

        // Description
        doc.text(item.description || '-', xPos + 5, rowY + 7, { width: columnWidths[1] - 10, ellipsis: true });
        xPos += columnWidths[1];

        // Price Yen
        doc.fillColor(COLORS.textLight);
        doc.text(item.priceYen ? `¥${item.priceYen.toLocaleString()}` : '-', xPos + 5, rowY + 7, { width: columnWidths[2] - 10, align: 'right' });
        xPos += columnWidths[2];

        // Price Baht
        doc.fillColor(COLORS.primary);
        doc.text(`฿${item.priceBaht.toLocaleString()}`, xPos + 5, rowY + 7, { width: columnWidths[3] - 10, align: 'right' });
        xPos += columnWidths[3];

        // Weight
        doc.fillColor(COLORS.text);
        doc.text(item.weight ? `${item.weight.toFixed(2)} kg` : '-', xPos + 5, rowY + 7, { width: columnWidths[4] - 10, align: 'right' });
        xPos += columnWidths[4];

        // Shipping Cost
        doc.fillColor(COLORS.secondary);
        doc.text(item.shippingCost ? `฿${item.shippingCost.toLocaleString()}` : '-', xPos + 5, rowY + 7, { width: columnWidths[5] - 10, align: 'right' });

        rowY += rowHeight;
      });

      // Table border
      doc.strokeColor(COLORS.border).lineWidth(1);
      doc.rect(leftMargin, tableTop + 28, contentWidth, rowY - tableTop - 28).stroke();

      // ==================== SUMMARY SECTION ====================

      const summaryY = rowY + 15;
      const summaryWidth = 220;
      const summaryX = rightMargin - summaryWidth;

      // Summary box background - taller for more items
      doc.roundedRect(summaryX - 10, summaryY - 5, summaryWidth + 10, 115, 5).fill(COLORS.light);

      doc.fillColor(COLORS.text).fontSize(10);

      // Subtotal (items price)
      doc.text('ยอดรวมสินค้า:', summaryX, summaryY + 5, { width: 110 });
      doc.text(`฿${data.subtotal.toLocaleString()}`, summaryX + 110, summaryY + 5, { width: 95, align: 'right' });

      let currentY = summaryY + 5;

      // Total Weight
      currentY += 18;
      doc.fillColor(COLORS.textLight);
      doc.text('น้ำหนักรวม:', summaryX, currentY, { width: 110 });
      doc.text(`${data.totalWeight.toFixed(2)} kg`, summaryX + 110, currentY, { width: 95, align: 'right' });

      // Total Shipping
      currentY += 18;
      doc.fillColor(COLORS.secondary);
      doc.text('ค่าจัดส่งรวม:', summaryX, currentY, { width: 110 });
      doc.text(`฿${data.totalShipping.toLocaleString()}`, summaryX + 110, currentY, { width: 95, align: 'right' });

      if (data.discount) {
        currentY += 18;
        doc.fillColor(COLORS.success);
        doc.text('ส่วนลด:', summaryX, currentY, { width: 110 });
        doc.text(`-฿${data.discount.toLocaleString()}`, summaryX + 110, currentY, { width: 95, align: 'right' });
      }

      // Grand Total
      currentY += 25;
      doc.roundedRect(summaryX - 10, currentY - 5, summaryWidth + 10, 28, 3).fill(COLORS.primary);
      doc.fillColor(COLORS.white).fontSize(12);
      doc.text('ยอดรวมทั้งหมด:', summaryX, currentY + 3, { width: 110 });
      doc.fontSize(14).text(`฿${data.total.toLocaleString()}`, summaryX + 110, currentY + 1, { width: 95, align: 'right' });

      // ==================== BANK INFO SECTION ====================

      if (data.bankInfo) {
        const bankY = currentY + 50;

        // Bank info box
        doc.roundedRect(leftMargin, bankY, 280, 85, 5).lineWidth(1).strokeColor(COLORS.secondary).stroke();

        // Bank header
        doc.roundedRect(leftMargin, bankY, 280, 25, 5).fill(COLORS.secondary);
        doc.fillColor(COLORS.white).fontSize(11);
        doc.text('ข้อมูลการชำระเงิน / Payment Information', leftMargin + 15, bankY + 7);

        doc.fillColor(COLORS.text).fontSize(10);
        doc.text('ธนาคาร / Bank:', leftMargin + 15, bankY + 35);
        doc.fillColor(COLORS.primary).text(data.bankInfo.bankName, leftMargin + 100, bankY + 35);

        doc.fillColor(COLORS.text);
        doc.text('ชื่อบัญชี / Name:', leftMargin + 15, bankY + 52);
        doc.fillColor(COLORS.primary).text(data.bankInfo.accountName, leftMargin + 100, bankY + 52);

        doc.fillColor(COLORS.text);
        doc.text('เลขบัญชี / Acc:', leftMargin + 15, bankY + 69);
        doc.fillColor(COLORS.primary).fontSize(12).text(data.bankInfo.accountNumber, leftMargin + 100, bankY + 68);
      }

      // ==================== NOTES SECTION ====================

      let footerStartY = data.bankInfo ? currentY + 145 : currentY + 55;

      if (data.notes) {
        doc.fillColor(COLORS.textLight).fontSize(9);
        doc.text('หมายเหตุ / Notes:', leftMargin, footerStartY);
        doc.fillColor(COLORS.text).fontSize(10);
        doc.text(data.notes, leftMargin, footerStartY + 15, { width: contentWidth });
        footerStartY += 45;
      }

      // ==================== FOOTER ====================

      // Add spacing before footer
      footerStartY += 20;

      // Divider line
      doc.moveTo(leftMargin, footerStartY).lineTo(rightMargin, footerStartY).strokeColor(COLORS.border).stroke();

      // Thank you message
      doc.fillColor(COLORS.primary).fontSize(12);
      doc.text('ขอบคุณที่ใช้บริการ PakkuNeko', leftMargin, footerStartY + 10, { width: contentWidth, align: 'center' });

      doc.fillColor(COLORS.textLight).fontSize(8);
      doc.text('Thank you for choosing PakkuNeko', leftMargin, footerStartY + 28, { width: contentWidth, align: 'center' });

      // Contact info
      doc.fontSize(8).fillColor(COLORS.textLight);
      doc.text('LINE: @pakkuneko | Facebook: PakkuNeko', leftMargin, footerStartY + 42, { width: contentWidth, align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export default {
  generateOrderInvoice,
  generateInvoicePDF,
};
