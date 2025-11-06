# LINE OA Webhook Integration

## Overview
ระบบติดตามการจัดส่งมีการผสานรวมกับ LINE Official Account (OA) เพื่อ:
1. เก็บข้อมูลผู้ใช้ที่เพิ่มเพื่อนกับ LINE OA
2. ส่งการแจ้งเตือนการอัปเดทสถานะการจัดส่งอัตโนมัติ
3. ตอบกลับข้อความจากผู้ใช้ (เช่น สอบถามสถานะคำสั่งซื้อ)

## Features Implemented

### 1. LINE OA Configuration (Admin Settings)
**หน้า:** `/admin/settings`

**ฟีเจอร์:**
- ✅ เปิด/ปิดการใช้งาน LINE Notifications
- ✅ ตั้งค่า Channel Access Token
- ✅ ตั้งค่า Channel Secret
- ✅ Webhook URL พร้อมปุ่มคัดลอก
- ✅ เลือกสถานะที่ต้องการแจ้งเตือนอัตโนมัติ
  - รอดำเนินการ (pending)
  - กำลังดำเนินการ (processing)
  - จัดส่งแล้ว (shipped)
  - อยู่ระหว่างการขนส่ง (in_transit)
  - จัดส่งสำเร็จ (delivered)

### 2. LINE Webhook Endpoint
**URL:** `POST /webhook/line`

**รองรับ Events:**
- `follow` - เมื่อผู้ใช้เพิ่มเพื่อน BOT
  - สร้างหรืออัปเดตข้อมูลผู้ใช้ในระบบ
  - ส่งข้อความต้อนรับ
- `unfollow` - เมื่อผู้ใช้บล็อคหรือลบ BOT
  - บันทึกการ unfollow
- `message` - เมื่อผู้ใช้ส่งข้อความ
  - รองรับคำสั่ง: "สถานะ", "status", "help"
  - แสดงสถานะคำสั่งซื้อล่าสุด

### 3. LINE Messaging Service
**ไฟล์:** `backend/src/services/lineService.ts`

**Methods:**
```typescript
// Initialize LINE client
await lineService.initialize();

// Send text message
await lineService.sendTextMessage(userId, message);

// Send shipping update notification
await lineService.sendShippingUpdateNotification(
  userId,
  orderNumber,
  status,
  trackingNumber,
  currentLocation
);

// Get user profile
const profile = await lineService.getProfile(userId);
```

### 4. Database Models

#### SystemSetting (สำหรับเก็บ LINE config)
```prisma
model SystemSetting {
  id        String   @id @default(uuid())
  key       String   @unique
  value     Json     // LINE settings stored here
  category  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt()
}
```

**LINE Settings Structure:**
```json
{
  "enabled": true,
  "channel_access_token": "YOUR_CHANNEL_ACCESS_TOKEN",
  "channel_secret": "YOUR_CHANNEL_SECRET",
  "webhook_url": "https://your-domain.com/webhook/line",
  "auto_notify_shipping_update": true,
  "notify_on_status": ["shipped", "in_transit", "delivered"]
}
```

## Setup Instructions

### 1. Create LINE Official Account
1. ไปที่ [LINE Developers Console](https://developers.line.biz/)
2. สร้าง Provider (ถ้ายังไม่มี)
3. สร้าง Messaging API Channel
4. บันทึก **Channel Access Token** และ **Channel Secret**

### 2. Configure Webhook
1. ในหน้า LINE Developers Console
2. ไปที่ Messaging API settings
3. ตั้งค่า Webhook URL: `https://your-domain.com/webhook/line`
4. เปิดใช้งาน Webhook (Use webhook)
5. ปิด Auto-reply messages (เพื่อให้ BOT ตอบแทน)

### 3. Configure in Admin Panel
1. เข้าสู่ระบบ Admin: `/admin/login`
2. ไปที่ Settings: `/admin/settings`
3. เลื่อนไปที่ **LINE OA Integration**
4. เปิดใช้งาน LINE Notifications
5. กรอก:
   - Channel Access Token
   - Channel Secret
   - Webhook URL (หรือคัดลอกที่แสดง)
6. เลือกสถานะที่ต้องการแจ้งเตือน
7. คลิก **บันทึกการตั้งค่า LINE**

### 4. Test Integration
1. Add LINE OA เป็นเพื่อน (สแกน QR Code จาก LINE Developers Console)
2. BOT จะส่งข้อความต้อนรับ
3. พิมพ์ "สถานะ" เพื่อดูคำสั่งซื้อล่าสุด
4. พิมพ์ "help" เพื่อดูคำสั่งที่ใช้ได้

## API Endpoints

### Get LINE Settings
```http
GET /api/v1/settings/line
Authorization: Admin only (uses admin_token cookie)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "channel_access_token": "...",
    "channel_secret": "...",
    "webhook_url": "...",
    "auto_notify_shipping_update": true,
    "notify_on_status": ["shipped", "in_transit", "delivered"]
  }
}
```

### Update LINE Settings
```http
PUT /api/v1/settings/line
Authorization: Admin only
Content-Type: application/json

{
  "enabled": true,
  "channel_access_token": "YOUR_TOKEN",
  "channel_secret": "YOUR_SECRET",
  "webhook_url": "https://your-domain.com/webhook/line",
  "auto_notify_shipping_update": true,
  "notify_on_status": ["shipped", "in_transit", "delivered"]
}
```

### LINE Webhook (Receive Events)
```http
POST /webhook/line
X-Line-Signature: <signature>
Content-Type: application/json

{
  "events": [...]
}
```

## Automatic Shipping Notifications

### How It Works
เมื่อมีการอัปเดทสถานะ Order ใน Admin Panel:

1. ระบบตรวจสอบว่า LINE OA เปิดใช้งานและเปิด auto notify หรือไม่
2. ตรวจสอบว่าสถานะใหม่อยู่ใน `notify_on_status` หรือไม่
3. หา LINE User ID จาก Customer → User → lineId
4. ส่งการแจ้งเตือนผ่าน LINE (asynchronously)
5. บันทึก log ใน notifications table

### Implementation (✅ COMPLETED)
**ไฟล์:** `backend/src/routes/admin/orders.ts:243-363`

**กระบวนการ:**
```typescript
// 1. Get current order status
const currentOrder = await prisma.order.findUnique({...});

// 2. Update order
const order = await prisma.order.update({
  include: {
    customer: { include: { user: true } },
    shipments: true,
  }
});

// 3. Check if status changed
const statusChanged = currentOrder && updateData.status &&
                      currentOrder.status !== updateData.status;

// 4. If status changed, check LINE settings
if (statusChanged) {
  const lineSettings = await prisma.systemSetting.findUnique({
    where: { key: 'line_oa' }
  });

  // 5. Check if should notify for this status
  if (settings.enabled &&
      settings.auto_notify_shipping_update &&
      notifyStatuses.includes(newStatus)) {

    // 6. Get customer's LINE ID
    const lineId = order.customer?.user?.lineId;

    if (lineId) {
      // 7. Send notification (async)
      await lineService.sendShippingUpdateNotification(
        lineId,
        order.orderNumber,
        newStatus,
        trackingNumber,
        currentLocation
      );
    }
  }
}
```

### Conditions for Sending Notification
การแจ้งเตือนจะถูกส่งเมื่อ:
- ✅ LINE OA enabled = true
- ✅ auto_notify_shipping_update = true
- ✅ สถานะใหม่อยู่ใน notify_on_status array
- ✅ สถานะเปลี่ยนจากสถานะเดิม (status changed)
- ✅ Customer มี User และมี lineId (เพิ่ม BOT เป็นเพื่อนแล้ว)

### Testing
1. ตั้งค่า LINE OA ใน `/admin/settings`
2. เปิดใช้งาน auto notify และเลือกสถานะที่ต้องการแจ้งเตือน
3. ให้ลูกค้า add LINE BOT เป็นเพื่อน (เพื่อสร้าง lineId)
4. ไปที่ `/admin/orders` และเปลี่ยนสถานะ Order
5. ลูกค้าควรได้รับการแจ้งเตือนทาง LINE

### Log Example
เมื่อส่งการแจ้งเตือนสำเร็จ:
```
[Order Update] LINE notification sent to U1234567890 for order 20250105-ORD-001
[LINE Service] Message sent to U1234567890
```

เมื่อลูกค้าไม่มี LINE ID:
```
[Order Update] Customer has no LINE ID, skipping notification for order 20250105-ORD-001
```

เมื่อสถานะไม่อยู่ใน notify list:
```
[Order Update] Status pending not in notify list, skipping notification
```

## Message Format Examples

### Welcome Message (on follow)
```
ยินดีต้อนรับสู่ระบบติดตามการจัดส่ง! 🚢

เราจะแจ้งเตือนคุณเมื่อมีการอัปเดทสถานะการจัดส่งของคุณ

ขอบคุณที่ใช้บริการ 🙏
```

### Shipping Update Notification
```
🚢 การอัปเดทการจัดส่ง

เลขที่คำสั่งซื้อ: 20250105-ORD-001
สถานะ: จัดส่งแล้ว
หมายเลขติดตาม: TH1234567890
สถานที่ปัจจุบัน: Bangkok

ขอบคุณที่ใช้บริการ 🙏
```

### Order Status Response
```
📦 คำสั่งซื้อล่าสุดของคุณ:

🔹 20250105-ORD-001
   สถานะ: จัดส่งแล้ว
   ปลายทาง: กรุงเทพฯ

🔹 20250104-ORD-002
   สถานะ: อยู่ระหว่างการขนส่ง
   ปลายทาง: เชียงใหม่
```

## Files Created/Modified

### Backend:
1. `backend/prisma/schema.prisma` - Added `SystemSetting` model
2. `backend/src/services/lineService.ts` - LINE messaging service
3. `backend/src/routes/webhook/line.ts` - Webhook endpoint
4. `backend/src/routes/settings.ts` - LINE settings API
5. `backend/src/index.ts` - Registered webhook route

### Frontend:
6. `frontend/src/pages/Admin/AdminSettingsPage.tsx` - Added LINE OA configuration UI

## Security Considerations

1. **Token Storage**: Currently stored in database as-is
   - TODO: Encrypt `channel_access_token` and `channel_secret`

2. **Webhook Verification**: LINE SDK middleware verifies signatures
   - Ensures requests come from LINE servers

3. **Admin Only**: All LINE settings APIs require admin authentication
   - Uses `authenticateAdmin` middleware

## Next Steps

- [✅] Add automatic notifications on order status change
- [ ] Test with real LINE OA account
- [ ] Encrypt sensitive tokens in database (security improvement)
- [ ] Add rich message templates (Flex Messages) for better UX
- [ ] Add tracking map integration in LINE messages
- [ ] Add test webhook button in admin panel
- [ ] Add notification history view in admin panel
- [ ] Add notification settings per customer (opt-in/opt-out)

## Troubleshooting

### Webhook not receiving events
1. Check webhook URL is correct and accessible from internet
2. Verify webhook is enabled in LINE Developers Console
3. Check server logs for errors
4. Test webhook with LINE's webhook test tool

### SignatureValidationFailed Error
This error occurs when LINE cannot verify the webhook signature.

**Fixed in code:**
- LINE webhook route uses special body parser with `rawBody` for signature verification
- Main app skips JSON parsing for `/webhook/line` to prevent double parsing

**If still occurs:**
1. Verify Channel Secret is correct in admin settings
2. Check LINE Developers Console for correct Channel Secret
3. Ensure webhook URL matches exactly (no trailing slash differences)
4. Test with LINE's webhook verification tool

### Notifications not sent
1. Verify LINE OA is enabled in admin settings
2. Check Channel Access Token is valid
3. Verify user has added BOT as friend (lineId exists)
4. Check notification logs in database (notifications table)

### Bot not responding to messages
1. Verify Auto-reply is disabled in LINE Console
2. Check webhook endpoint is receiving events
3. Review server logs for errors

## Support

For LINE API documentation: https://developers.line.biz/en/docs/messaging-api/
