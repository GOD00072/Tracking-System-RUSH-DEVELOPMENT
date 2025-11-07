# Order Items Feature - รายละเอียดสินค้าในแต่ละ Order

## Overview
เพิ่มระบบจัดการรายการสินค้า (Order Items) สำหรับติดตามข้อมูลสินค้าแต่ละชิ้นในแต่ละ Order อย่างละเอียด

## Database Model

### OrderItem Table (`order_items`)
```prisma
model OrderItem {
  id              String    @id @default(uuid())
  orderId         String    // เชื่อมกับ Order

  // ข้อมูลการกดสินค้า
  sequenceNumber  Int?      // ลำดับที่
  clickDate       DateTime? // วัน เดือน ปี ที่กด
  clickChannel    String?   // ช่องทางการกด (เช่น LINE, Facebook, Website)
  clickerName     String?   // ชื่อคนกด
  customerName    String?   // ชื่อลูกค้า

  // ข้อมูลสินค้า
  productCode     String?   // รหัสสินค้า
  productUrl      String?   // ลิ้งค์สินค้า
  priceYen        Decimal?  // ราคาเยน
  priceBaht       Decimal?  // ราคาบาท

  // สถานะ
  itemStatus      String?   // สถานะของสินค้า
  paymentStatus   String?   // สถานะการจ่ายเงิน

  // การจัดส่ง
  shippingRound   String?   // รอบส่งกลับ
  trackingNumber  String?   // หมายเลข Tracking
  storePage       String?   // เพจ/ร้าน

  // อื่นๆ
  remarks         String?   // หมายเหตุ
  createdAt       DateTime
  updatedAt       DateTime
}
```

## API Endpoints

### 1. Get All Order Items
```http
GET /api/v1/order-items
Authorization: Admin only
Query Parameters:
  - page: หน้าที่ต้องการ (default: 1)
  - limit: จำนวนต่อหน้า (default: 50)
  - orderId: กรองตาม Order ID
  - customerId: กรองตาม Customer ID
  - search: ค้นหาใน productCode, productUrl, customerName, clickerName, trackingNumber
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "orderId": "uuid",
      "sequenceNumber": 1,
      "clickDate": "2025-01-05T10:00:00Z",
      "clickChannel": "LINE",
      "clickerName": "John Doe",
      "customerName": "ABC Company",
      "productCode": "PROD-001",
      "productUrl": "https://example.com/product/001",
      "priceYen": 5000,
      "priceBaht": 1250,
      "itemStatus": "ordered",
      "paymentStatus": "paid",
      "shippingRound": "Round 1",
      "trackingNumber": "TH123456",
      "storePage": "Main Store",
      "remarks": "Special handling required",
      "order": {
        "id": "uuid",
        "orderNumber": "20250105-ORD-001",
        "status": "processing",
        "customer": {
          "id": "uuid",
          "companyName": "ABC Company",
          "contactPerson": "Jane"
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "total_pages": 2
  }
}
```

### 2. Get Single Order Item
```http
GET /api/v1/order-items/:id
Authorization: Admin only
```

### 3. Create Order Item
```http
POST /api/v1/order-items
Authorization: Admin only
Content-Type: application/json

{
  "orderId": "uuid",              // Required
  "sequenceNumber": 1,            // Optional
  "clickDate": "2025-01-05",      // Optional
  "clickChannel": "LINE",         // Optional
  "clickerName": "John Doe",      // Optional
  "customerName": "ABC Company",  // Optional
  "productCode": "PROD-001",      // Optional
  "productUrl": "https://...",    // Optional
  "priceYen": 5000,               // Optional
  "priceBaht": 1250,              // Optional
  "itemStatus": "ordered",        // Optional
  "paymentStatus": "paid",        // Optional
  "shippingRound": "Round 1",     // Optional
  "trackingNumber": "TH123456",   // Optional
  "storePage": "Main Store",      // Optional
  "remarks": "Notes"              // Optional
}
```

### 4. Update Order Item
```http
PATCH /api/v1/order-items/:id
Authorization: Admin only
Content-Type: application/json

{
  "itemStatus": "shipped",
  "trackingNumber": "TH123456",
  "remarks": "Updated notes"
}
```

### 5. Delete Order Item
```http
DELETE /api/v1/order-items/:id
Authorization: Admin only
```

### 6. Bulk Create Order Items
```http
POST /api/v1/order-items/bulk
Authorization: Admin only
Content-Type: application/json

{
  "orderId": "uuid",
  "items": [
    {
      "sequenceNumber": 1,
      "productCode": "PROD-001",
      "productUrl": "https://...",
      "priceYen": 5000,
      "priceBaht": 1250
    },
    {
      "sequenceNumber": 2,
      "productCode": "PROD-002",
      "productUrl": "https://...",
      "priceYen": 3000,
      "priceBaht": 750
    }
  ]
}
```

## Use Cases

### 1. ติดตามสินค้าแต่ละชิ้นในออเดอร์
```javascript
// Get all items in an order
const response = await api.get('/order-items?orderId=xxx');
```

### 2. ติดตามสินค้าของลูกค้าคนหนึ่ง
```javascript
// Get all items for a customer
const response = await api.get('/order-items?customerId=xxx');
```

### 3. ค้นหาสินค้าด้วยรหัสสินค้า
```javascript
// Search by product code
const response = await api.get('/order-items?search=PROD-001');
```

### 4. เพิ่มสินค้าทีละชิ้น
```javascript
const response = await api.post('/order-items', {
  orderId: 'xxx',
  productCode: 'PROD-001',
  priceYen: 5000,
  itemStatus: 'ordered'
});
```

### 5. เพิ่มสินค้าหลายชิ้นพร้อมกัน
```javascript
const response = await api.post('/order-items/bulk', {
  orderId: 'xxx',
  items: [
    { productCode: 'PROD-001', priceYen: 5000 },
    { productCode: 'PROD-002', priceYen: 3000 },
    { productCode: 'PROD-003', priceYen: 2000 }
  ]
});
```

## Status Values (ค่าที่แนะนำ)

### itemStatus (สถานะของสินค้า)
- `pending` - รอดำเนินการ
- `ordered` - สั่งซื้อแล้ว
- `received` - รับสินค้าแล้ว
- `packing` - กำลังแพ็ค
- `shipped` - จัดส่งแล้ว
- `delivered` - ส่งถึงแล้ว
- `cancelled` - ยกเลิก

### paymentStatus (สถานะการจ่ายเงิน)
- `pending` - รอชำระ
- `partial` - ชำระบางส่วน
- `paid` - ชำระครบแล้ว
- `refunded` - คืนเงินแล้ว

### clickChannel (ช่องทางการกด)
- `LINE`
- `Facebook`
- `Instagram`
- `Website`
- `Email`
- `Phone`

## Integration with Customer Management

### แสดงรายการสินค้าในหน้า Customer Detail
```javascript
// In CustomerDetail component
useEffect(() => {
  // Load customer's order items
  api.get(`/order-items?customerId=${customerId}`)
    .then(response => {
      setOrderItems(response.data.data);
    });
}, [customerId]);
```

### แสดงรายการสินค้าในหน้า Order Detail
```javascript
// In OrderDetail component
useEffect(() => {
  // Load order items
  api.get(`/order-items?orderId=${orderId}`)
    .then(response => {
      setOrderItems(response.data.data);
    });
}, [orderId]);
```

## Excel Import/Export

### Import from Excel
สามารถนำเข้าข้อมูลจาก Excel ด้วยโครงสร้าง:

| ลำดับที่ | วัน เดือน ปี | ช่องทางการกด | ชื่อคนกด | ชื่อลูกค้า | รหัสสินค้า | ลิ้งค์สินค้า | ราคาเยน | ราคาบาท | สถานะของ | สถานะการจ่ายเงิน | รอบส่งกลับ | Tracking | เพจ/ร้าน | หมายเหตุ |
|----------|--------------|---------------|----------|------------|------------|--------------|---------|---------|----------|------------------|------------|----------|----------|----------|
| 1 | 2025-01-05 | LINE | John | ABC Co. | PROD-001 | https://... | 5000 | 1250 | ordered | paid | Round 1 | TH123 | Store A | Note |

### Export to Excel
ข้อมูลสามารถ export ออกมาในรูปแบบเดียวกัน

## Files Created/Modified

### Backend:
1. ✅ `backend/prisma/schema.prisma` - Added OrderItem model
2. ✅ `backend/src/routes/orderItems.ts` - Order Items API (NEW)
3. ✅ `backend/src/index.ts` - Registered orderItems route

### Database:
4. ✅ `order_items` table created

### Documentation:
5. ✅ `ORDER_ITEMS_FEATURE.md` - This documentation

## Next Steps

### Frontend (TODO):
- [ ] Create `useOrderItems` hook in `frontend/src/hooks/`
- [ ] Add Order Items section in Customer Detail page
- [ ] Add Order Items section in Order Detail page
- [ ] Create Order Item form (add/edit)
- [ ] Add Excel import feature
- [ ] Add Excel export feature
- [ ] Add inline editing for quick updates

### Features to Add:
- [ ] Image upload for products
- [ ] Price calculation automation (Yen → Baht)
- [ ] Status history tracking
- [ ] Notification when item status changes
- [ ] Barcode/QR code scanning for product code

## Testing

### Test Create Order Item:
```bash
curl -X POST http://localhost:5000/api/v1/order-items \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_token=YOUR_TOKEN" \
  -d '{
    "orderId": "ORDER_ID",
    "productCode": "TEST-001",
    "priceYen": 1000,
    "itemStatus": "ordered"
  }'
```

### Test Get Order Items:
```bash
curl http://localhost:5000/api/v1/order-items?page=1&limit=10 \
  -H "Cookie: admin_token=YOUR_TOKEN"
```

### Test Bulk Create:
```bash
curl -X POST http://localhost:5000/api/v1/order-items/bulk \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_token=YOUR_TOKEN" \
  -d '{
    "orderId": "ORDER_ID",
    "items": [
      {"productCode": "PROD-001", "priceYen": 1000},
      {"productCode": "PROD-002", "priceYen": 2000},
      {"productCode": "PROD-003", "priceYen": 3000}
    ]
  }'
```

## Completion Status

**Backend: 100% COMPLETE ✅**
- ✅ Database model
- ✅ API endpoints
- ✅ CRUD operations
- ✅ Bulk operations
- ✅ Search & filter
- ✅ Pagination

**Frontend: 0% PENDING ⏳**
- ⏳ React hooks
- ⏳ UI components
- ⏳ Forms
- ⏳ Excel import/export

**Ready for frontend integration!**
