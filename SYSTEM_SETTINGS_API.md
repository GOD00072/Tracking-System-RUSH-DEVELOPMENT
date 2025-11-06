# System Settings API - Complete

## ✅ สถานะ: เสร็จสมบูรณ์

## ภาพรวม
สร้าง Backend API สำหรับจัดการ System Settings (SEO, Cookie, และอื่นๆ) ด้วย key-value storage

---

## 🗄️ Database Model

### SystemSetting Table:
```prisma
model SystemSetting {
  id        String   @id @default(uuid()) @db.Uuid
  key       String   @unique @db.VarChar(255)
  value     Json     @db.JsonB
  category  String?  @db.VarChar(100)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamp()
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamp()

  @@index([category])
  @@map("system_settings")
}
```

### Fields:
- **id**: UUID (Primary Key)
- **key**: Unique key สำหรับแต่ละ setting (e.g., "seo", "cookies")
- **value**: JSON object เก็บข้อมูลทั้งหมด
- **category**: หมวดหมู่ (e.g., "seo", "privacy", "general")
- **createdAt**: เวลาที่สร้าง
- **updatedAt**: เวลาที่อัปเดตล่าสุด

---

## 🔌 API Endpoints

### 1. Get Setting by Key
```http
GET /api/v1/system-settings/:key
Authorization: Admin Token (admin_token cookie)
```

**Example:**
```bash
curl http://localhost:5000/api/v1/system-settings/seo \
  -H "Cookie: admin_token=YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "key": "seo",
    "value": {
      "siteName": "My Logistics",
      "siteDescription": "Best logistics service...",
      "gaTrackingId": "G-XXXXXXXXXX"
    },
    "category": "seo",
    "createdAt": "2025-11-05T10:00:00.000Z",
    "updatedAt": "2025-11-05T12:00:00.000Z"
  }
}
```

**Error (404):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Setting with key \"seo\" not found"
  }
}
```

---

### 2. Get All Settings (or by Category)
```http
GET /api/v1/system-settings?category=seo
Authorization: Admin Token
```

**Query Parameters:**
- `category` (optional): Filter by category

**Example:**
```bash
# Get all settings
curl http://localhost:5000/api/v1/system-settings \
  -H "Cookie: admin_token=YOUR_TOKEN"

# Get only SEO settings
curl http://localhost:5000/api/v1/system-settings?category=seo \
  -H "Cookie: admin_token=YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "key": "seo",
      "value": { ... },
      "category": "seo",
      "createdAt": "...",
      "updatedAt": "..."
    },
    {
      "id": "uuid-2",
      "key": "cookies",
      "value": { ... },
      "category": "privacy",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

### 3. Create or Update Setting (Upsert)
```http
POST /api/v1/system-settings/:key
Authorization: Admin Token
Content-Type: application/json
```

**Body:**
```json
{
  "value": {
    "siteName": "My Logistics Company",
    "siteDescription": "Professional logistics service...",
    "siteKeywords": "logistics, shipping, thailand, japan",
    "gaTrackingId": "G-XXXXXXXXXX",
    "fbPixelId": "123456789012345"
  },
  "category": "seo"
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/v1/system-settings/seo \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_token=YOUR_TOKEN" \
  -d '{
    "value": {
      "siteName": "My Logistics",
      "gaTrackingId": "G-XXXXXXXXXX"
    },
    "category": "seo"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "key": "seo",
    "value": { ... },
    "category": "seo",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "message": "Setting saved successfully"
}
```

**How Upsert Works:**
- If `key` exists → **Update** existing record
- If `key` doesn't exist → **Create** new record

---

### 4. Update Setting (Partial Update)
```http
PATCH /api/v1/system-settings/:key
Authorization: Admin Token
Content-Type: application/json
```

**Body:**
```json
{
  "value": {
    "gaTrackingId": "G-YYYYYYYYYY"
  }
}
```

**Example:**
```bash
curl -X PATCH http://localhost:5000/api/v1/system-settings/seo \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_token=YOUR_TOKEN" \
  -d '{
    "value": {
      "gaTrackingId": "G-UPDATED123"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Setting updated successfully"
}
```

**Error (404):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Setting with key \"seo\" not found"
  }
}
```

---

### 5. Delete Setting
```http
DELETE /api/v1/system-settings/:key
Authorization: Admin Token
```

**Example:**
```bash
curl -X DELETE http://localhost:5000/api/v1/system-settings/seo \
  -H "Cookie: admin_token=YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Setting deleted successfully"
}
```

---

## 🎯 Use Cases

### 1. SEO Settings
```typescript
// Save SEO settings
POST /api/v1/system-settings/seo
{
  "value": {
    "siteName": "My Logistics",
    "siteDescription": "Professional logistics service between Thailand and Japan",
    "siteKeywords": "logistics, shipping, freight, thailand, japan",
    "ogImage": "https://example.com/og-image.jpg",
    "twitterCard": "summary_large_image",
    "gaTrackingId": "G-XXXXXXXXXX",
    "fbPixelId": "123456789012345",
    "googleAdsId": "AW-XXXXXXXXXX",
    "googleSiteVerification": "xxxxxxxxxxxxxxxxxxxx",
    "structuredDataEnabled": true,
    "businessType": "Logistics",
    "businessName": "ABC Logistics Co., Ltd.",
    "businessAddress": "123 Bangkok, Thailand",
    "businessPhone": "02-xxx-xxxx",
    "businessEmail": "info@example.com",
    "robotsTxt": "User-agent: *\nAllow: /"
  },
  "category": "seo"
}

// Load SEO settings
GET /api/v1/system-settings/seo
```

---

### 2. Cookie Settings
```typescript
// Save Cookie settings
POST /api/v1/system-settings/cookies
{
  "value": {
    "bannerEnabled": true,
    "bannerPosition": "bottom",
    "bannerMessage": "เราใช้คุกกี้เพื่อปรับปรุงประสบการณ์ของคุณ",
    "buttonText": "ยอมรับทั้งหมด",
    "declineButtonText": "ปฏิเสธทั้งหมด",
    "primaryColor": "#2563eb",
    "necessaryCookies": true,
    "analyticsCookies": false,
    "marketingCookies": false,
    "functionalCookies": false,
    "showPrivacyLink": true,
    "privacyPolicyUrl": "/privacy-policy",
    "cookiePolicyUrl": "/cookie-policy",
    "cookieLifetime": 365
  },
  "category": "privacy"
}

// Load Cookie settings
GET /api/v1/system-settings/cookies
```

---

### 3. LINE OA Settings
```typescript
// Save LINE settings (existing)
POST /api/v1/system-settings/line_oa
{
  "value": {
    "channel_token": "xxx",
    "channel_secret": "xxx",
    "webhook_url": "https://example.com/webhook/line",
    "enabled": true,
    "auto_notify_shipping_update": true,
    "notify_on_status": ["shipped", "delivered"]
  },
  "category": "integrations"
}
```

---

## 🔐 Authentication

**All endpoints require Admin authentication:**
- Cookie: `admin_token`
- OR Header: `Authorization: Bearer <token>`
- User must have `role: 'admin'`

**Handled by:** `authenticateAdmin` middleware

---

## 📊 Data Structure Examples

### SEO Settings (`key: "seo"`):
```json
{
  "siteName": "string",
  "siteDescription": "string",
  "siteKeywords": "string",
  "ogImage": "string (URL)",
  "twitterCard": "summary_large_image",
  "gaTrackingId": "string (G-XXXXXXXXXX)",
  "fbPixelId": "string",
  "googleAdsId": "string",
  "googleSiteVerification": "string",
  "structuredDataEnabled": boolean,
  "businessType": "Logistics | MovingCompany | Organization",
  "businessName": "string",
  "businessAddress": "string",
  "businessPhone": "string",
  "businessEmail": "string",
  "robotsTxt": "string"
}
```

### Cookie Settings (`key: "cookies"`):
```json
{
  "bannerEnabled": boolean,
  "bannerPosition": "top | bottom",
  "bannerMessage": "string",
  "buttonText": "string",
  "declineButtonText": "string",
  "primaryColor": "string (#hex)",
  "necessaryCookies": boolean (always true),
  "analyticsCookies": boolean,
  "marketingCookies": boolean,
  "functionalCookies": boolean,
  "showPrivacyLink": boolean,
  "privacyPolicyUrl": "string",
  "cookiePolicyUrl": "string",
  "cookieLifetime": number (days)
}
```

---

## 🛠️ Frontend Integration

### React Hook Example:
```typescript
// Load SEO settings
const loadSEOSettings = async () => {
  try {
    const response = await api.get('/system-settings/seo');
    if (response.data.success && response.data.data) {
      setSeoData({ ...seoData, ...response.data.data.value });
    }
  } catch (error) {
    console.error('Failed to load SEO settings:', error);
  }
};

// Save SEO settings
const handleSave = async () => {
  try {
    await api.post('/system-settings/seo', {
      value: seoData,
      category: 'seo',
    });
    toast.success('บันทึกการตั้งค่า SEO สำเร็จ');
  } catch (error) {
    toast.error('เกิดข้อผิดพลาด');
  }
};
```

---

## 🔍 Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `NOT_FOUND` | 404 | Setting with specified key not found |
| `VALIDATION_ERROR` | 400 | Missing required fields or invalid data |
| `UNAUTHORIZED` | 401 | Not logged in as admin |
| `FORBIDDEN` | 403 | Not admin role |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 📦 Files Created/Modified

### ✅ Created:
1. `backend/src/routes/systemSettings.ts` - System Settings API routes

### ✅ Modified:
2. `backend/src/index.ts` - Registered systemSettings router

---

## 🧪 Testing

### 1. Test GET (should return 404 initially):
```bash
curl http://localhost:5000/api/v1/system-settings/seo \
  -H "Cookie: admin_token=YOUR_TOKEN"
```

### 2. Test POST (create):
```bash
curl -X POST http://localhost:5000/api/v1/system-settings/seo \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_token=YOUR_TOKEN" \
  -d '{
    "value": {
      "siteName": "Test Site",
      "gaTrackingId": "G-TEST123"
    },
    "category": "seo"
  }'
```

### 3. Test GET (should return data):
```bash
curl http://localhost:5000/api/v1/system-settings/seo \
  -H "Cookie: admin_token=YOUR_TOKEN"
```

### 4. Test POST again (should update):
```bash
curl -X POST http://localhost:5000/api/v1/system-settings/seo \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_token=YOUR_TOKEN" \
  -d '{
    "value": {
      "siteName": "Updated Site",
      "gaTrackingId": "G-UPDATED"
    },
    "category": "seo"
  }'
```

### 5. Test DELETE:
```bash
curl -X DELETE http://localhost:5000/api/v1/system-settings/seo \
  -H "Cookie: admin_token=YOUR_TOKEN"
```

---

## 🚀 Database Migration

หาก `system_settings` table ยังไม่มี ให้รัน:

```bash
cd backend
npx prisma migrate dev --name add_system_settings
```

หรือถ้า table มีอยู่แล้ว:
```bash
npx prisma generate
npx prisma db push
```

---

## 📊 Performance

### Indexing:
- ✅ `key` - Unique index (auto)
- ✅ `category` - Index for filtering

### Caching (Optional):
```typescript
// Cache in Redis or memory
const settingsCache = new Map();

router.get('/:key', authenticateAdmin, async (req, res) => {
  const cached = settingsCache.get(req.params.key);
  if (cached) return res.json({ success: true, data: cached });

  // ... fetch from DB
  settingsCache.set(req.params.key, setting);
});
```

---

## ✅ Completion Status

**Implementation: 100% COMPLETE** 🎉

### Backend:
- ✅ System Settings API routes
- ✅ CRUD operations (GET, POST, PATCH, DELETE)
- ✅ Upsert functionality
- ✅ Admin authentication
- ✅ Error handling
- ✅ Category filtering
- ✅ Registered in index.ts

### Frontend Integration:
- ✅ AdminSEOPage uses this API
- ✅ AdminCookiePage uses this API
- ✅ Error handling with toast

**พร้อมใช้งาน!** 🚀

---

## 🔄 Next Steps

ตอนนี้ลอง:
1. รีสตาร์ท backend server
2. ไปที่ `/admin/seo`
3. กรอกข้อมูล SEO
4. คลิก "บันทึก"
5. ✅ ควรจะบันทึกสำเร็จ!

---

## 📝 Notes

- ใช้ **JSON** สำหรับเก็บ value ทำให้ flexible
- ใช้ **Upsert** (POST) ทำให้ไม่ต้องเช็คว่ามีหรือยัง
- ใช้ **category** ทำให้จัดกลุ่มได้ง่าย
- ใช้ **Admin auth** ทำให้ปลอดภัย

**เสร็จสมบูรณ์!** ✨
