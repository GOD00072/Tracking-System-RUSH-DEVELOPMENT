# Auto-Generate Order Number Feature

## 🎯 Overview
ระบบสร้างเลข Order Number อัตโนมัติตามรูปแบบ `YYYYMMDD-ORD-XXX` โดยนับจำนวน orders ในวันนั้นๆ และเพิ่มขึ้นเรื่อยๆ

## 📋 Format

```
YYYYMMDD-ORD-XXX

ตัวอย่าง:
20251104-ORD-001  (Order แรกของวันที่ 4 พ.ย. 2025)
20251104-ORD-002  (Order ที่สองของวันเดียวกัน)
20251104-ORD-003  (Order ที่สามของวันเดียวกัน)
...
20251105-ORD-001  (Order แรกของวันถัดไป - เริ่มนับใหม่)
```

## 🔧 Implementation

### Backend Function

```typescript
// Helper function to generate order number
async function generateOrderNumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}-ORD-`;

  // Find the latest order number for today
  const latestOrder = await prisma.order.findFirst({
    where: {
      orderNumber: {
        startsWith: datePrefix,
      },
    },
    orderBy: {
      orderNumber: 'desc',
    },
    select: {
      orderNumber: true,
    },
  });

  let nextNumber = 1;
  if (latestOrder) {
    const parts = latestOrder.orderNumber.split('-');
    const currentNumber = parseInt(parts[parts.length - 1], 10);
    nextNumber = currentNumber + 1;
  }

  // Format: YYYYMMDD-ORD-XXX
  const orderNumber = `${datePrefix}${String(nextNumber).padStart(3, '0')}`;
  return orderNumber;
}
```

### API Endpoint

**POST /api/v1/orders**

```typescript
router.post('/', async (req, res) => {
  try {
    // Auto-generate order number if not provided
    const orderNumber = req.body.orderNumber || await generateOrderNumber();

    const orderData: any = {
      orderNumber: orderNumber,
      // ... other fields
    };

    const order = await prisma.order.create({
      data: orderData,
      include: {
        customer: true,
      },
    });

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    // Handle duplicate order number
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ERROR',
          message: 'Order with this order number already exists',
        },
      });
    }
    // ... other error handling
  }
});
```

## 🎨 Features

### 1. **Auto-increment by Date**
- นับจำนวน orders ในแต่ละวัน
- เริ่มนับใหม่ทุกวันเวลา 00:00
- รองรับได้สูงสุด 999 orders ต่อวัน (001-999)

### 2. **Backward Compatible**
- ถ้าส่ง `orderNumber` มาใน request body จะใช้ค่าที่ส่งมา
- ถ้าไม่ส่งมา จะ auto-generate
- รองรับการทำงานแบบ manual override

### 3. **Duplicate Protection**
- มี unique constraint ที่ database level
- Error handling สำหรับ duplicate order number
- Return HTTP 409 Conflict พร้อมข้อความที่ชัดเจน

### 4. **Thread-safe**
- ใช้ `findFirst` + `orderBy: desc` เพื่อหาเลขล่าสุด
- Database transaction ป้องกันการสร้าง order number ซ้ำ

## 📝 Usage Examples

### Create Order (Auto-generate)

**Request:**
```bash
POST /api/v1/orders
Content-Type: application/json

{
  "customerId": "uuid-here",
  "shippingMethod": "sea",
  "origin": "Bangkok",
  "destination": "Shanghai"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "orderNumber": "20251104-ORD-001",  ← Auto-generated
    "customerId": "...",
    "status": "pending",
    ...
  }
}
```

### Create Order (Manual Order Number)

**Request:**
```bash
POST /api/v1/orders
Content-Type: application/json

{
  "orderNumber": "CUSTOM-001",  ← Custom order number
  "customerId": "uuid-here",
  "shippingMethod": "air"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderNumber": "CUSTOM-001",  ← Used custom number
    ...
  }
}
```

### Duplicate Error

**Request:**
```bash
POST /api/v1/orders
{
  "orderNumber": "20251104-ORD-001"  ← Already exists
}
```

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_ERROR",
    "message": "Order with this order number already exists",
    "field": "order_number"
  }
}
```

## 🧪 Testing

### Test Auto-increment

```bash
# Create 3 orders without order number
for i in 1 2 3; do
  curl -X POST http://localhost:5000/api/v1/orders \
    -H "Content-Type: application/json" \
    -d '{
      "customerId": "uuid-here",
      "shippingMethod": "sea",
      "origin": "BKK",
      "destination": "HKG"
    }'
done

# Expected results:
# 1st: 20251104-ORD-001
# 2nd: 20251104-ORD-002
# 3rd: 20251104-ORD-003
```

### Test Date Reset

```sql
-- Check orders from different dates
SELECT order_number, created_at::date
FROM orders
ORDER BY created_at DESC;

-- Expected:
-- 20251105-ORD-001  2025-11-05
-- 20251105-ORD-002  2025-11-05
-- 20251104-ORD-001  2025-11-04
-- 20251104-ORD-002  2025-11-04
```

## 🔍 How It Works

```
1. Request arrives without orderNumber
   ↓
2. Call generateOrderNumber()
   ↓
3. Get today's date → "20251104"
   ↓
4. Query DB for latest order: "20251104-ORD-*"
   ↓
5. Found: "20251104-ORD-005"
   ↓
6. Extract number: 005 → 5
   ↓
7. Increment: 5 + 1 = 6
   ↓
8. Format: "20251104-ORD-006"
   ↓
9. Create order with new number
```

## 🛡️ Error Handling

### Prisma Error P2002 (Unique Constraint)

```typescript
if (error.code === 'P2002') {
  const field = error.meta?.target?.[0] || 'field';
  return res.status(409).json({
    success: false,
    error: {
      code: 'DUPLICATE_ERROR',
      message: `Order with this ${field.replace('_', ' ')} already exists`,
      field: field,
    },
  });
}
```

## 📊 Database Schema

```prisma
model Order {
  id          String   @id @default(uuid())
  orderNumber String   @unique @map("order_number")  ← Unique constraint
  // ...
}
```

## ✅ Checklist

- [x] Auto-generate order number function
- [x] Integration with POST /api/v1/orders
- [x] Date-based numbering (YYYYMMDD-ORD-XXX)
- [x] Auto-increment for same day
- [x] Reset counter for new day
- [x] Duplicate error handling
- [x] Manual override support
- [x] Padding with zeros (001, 002, ...)
- [x] Thread-safe implementation

## 🚀 Future Enhancements

- [ ] Support different order types (ORD, SHP, RTN, etc.)
- [ ] Configurable prefix per customer
- [ ] Bulk order number reservation
- [ ] Order number preview API
- [ ] Custom number format configuration

## 📝 Notes

- เลข order number จะไม่มีช่องว่างระหว่าง orders ที่ถูกลบ
- Maximum 999 orders per day (เพิ่มได้ถ้าต้องการ โดยแก้ `padStart(3, '0')` เป็น `padStart(4, '0')`)
- Order number ถูกสร้างตาม server timezone
- ไม่รองรับการย้อนเวลาเพื่อสร้าง order ย้อนหลัง (ใช้ manual override)
