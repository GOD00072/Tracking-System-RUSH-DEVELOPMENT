# Calculator Settings Database Schema

## Table: calculator_settings

```sql
CREATE TABLE calculator_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Default Settings Data

### Exchange Rates
```sql
INSERT INTO calculator_settings (setting_key, setting_value, description) VALUES
('exchange_rates', '{
  "member": 0.250,
  "vip": 0.240,
  "vvip": 0.230
}'::jsonb, 'อัตราแลกเปลี่ยน ¥ → ฿ ตามระดับสมาชิก');
```

### Shipping Rates from Japan
```sql
INSERT INTO calculator_settings (setting_key, setting_value, description) VALUES
('shipping_rates_japan', '{
  "air": 700,
  "sea": 1000
}'::jsonb, 'ค่าขนส่งจากญี่ปุ่น (฿)');
```

### Courier Rates in Thailand
```sql
INSERT INTO calculator_settings (setting_key, setting_value, description) VALUES
('courier_rates_thailand', '{
  "dhl": 26,
  "best": 35,
  "lalamove": 50
}'::jsonb, 'ค่าจัดส่งในไทย (฿)');
```

### Additional Services
```sql
INSERT INTO calculator_settings (setting_key, setting_value, description) VALUES
('additional_services', '{
  "repack": 50,
  "bubble_wrap": 30,
  "insurance_percentage": 2.5
}'::jsonb, 'ค่าบริการเสริม (฿)');
```

### Product Categories Rates (AIR)
```sql
INSERT INTO calculator_settings (setting_key, setting_value, description) VALUES
('product_category_rates', '{
  "general": {"multiplier": 1.0, "name": "สินค้าทั่วไป"},
  "electronics": {"multiplier": 1.15, "name": "อิเล็กทรอนิกส์"},
  "cosmetics": {"multiplier": 1.2, "name": "เครื่องสำอาง"},
  "food": {"multiplier": 1.25, "name": "อาหาร"},
  "fragile": {"multiplier": 1.3, "name": "ของเปราะบาง"}
}'::jsonb, 'อัตราค่าขนส่งตามประเภทสินค้า');
```

### DHL Area Rates
```sql
INSERT INTO calculator_settings (setting_key, setting_value, description) VALUES
('dhl_area_rates', '{
  "bangkok": 26,
  "upcountry": 45
}'::jsonb, 'ค่า DHL ตามพื้นที่');
```

### Weight Tiers
```sql
INSERT INTO calculator_settings (setting_key, setting_value, description) VALUES
('weight_tiers', '{
  "0-5": {"rate_per_kg": 120},
  "5-10": {"rate_per_kg": 110},
  "10-20": {"rate_per_kg": 100},
  "20-50": {"rate_per_kg": 90},
  "50+": {"rate_per_kg": 80}
}'::jsonb, 'อัตราค่าขนส่งตามน้ำหนัก (฿/kg)');
```

### Volume Weight Calculation
```sql
INSERT INTO calculator_settings (setting_key, setting_value, description) VALUES
('volume_weight_config', '{
  "air_divisor": 6000,
  "sea_divisor": 3000,
  "use_greater_weight": true
}'::jsonb, 'การคำนวณน้ำหนักตามปริมาตร');
```

### Company Information
```sql
INSERT INTO calculator_settings (setting_key, setting_value, description) VALUES
('company_info', '{
  "name": "Ship Tracking Company",
  "address": "กรุงเทพมหานคร ประเทศไทย",
  "phone": "02-XXX-XXXX",
  "email": "info@shiptracking.com",
  "line_id": "@shiptracking"
}'::jsonb, 'ข้อมูลบริษัท');
```

---

## API Endpoints for Calculator Settings

### GET /api/v1/calculator/settings
Get all calculator settings

**Response**:
```json
{
  "success": true,
  "data": {
    "exchange_rates": {
      "member": 0.250,
      "vip": 0.240,
      "vvip": 0.230
    },
    "shipping_rates_japan": {
      "air": 700,
      "sea": 1000
    },
    "courier_rates_thailand": {
      "dhl": 26,
      "best": 35,
      "lalamove": 50
    },
    ...
  }
}
```

### PUT /api/v1/calculator/settings/:key
Update a specific setting (Admin only)

**Request**:
```json
{
  "value": {
    "member": 0.245,
    "vip": 0.235,
    "vvip": 0.225
  }
}
```

### POST /api/v1/calculator/calculate-advanced
Calculate shipping cost with all parameters

**Request**:
```json
{
  "user_level": "member",
  "product_price_jpy": 1000,
  "weight_kg": 2.5,
  "dimensions_cm": {"width": 30, "length": 40, "height": 20},
  "shipping_method": "air",
  "product_category": "electronics",
  "courier_service": "dhl",
  "delivery_area": "bangkok",
  "repack_service": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "product_cost_thb": 250.00,
    "shipping_from_japan": 700.00,
    "category_surcharge": 105.00,
    "courier_fee_thailand": 26.00,
    "repack_fee": 50.00,
    "subtotal": 1131.00,
    "vat": 79.17,
    "total": 1210.17,
    "currency": "THB",
    "estimated_days": 15,
    "breakdown": {
      "exchange_rate": 0.250,
      "actual_weight": 2.5,
      "volume_weight": 4.0,
      "chargeable_weight": 4.0
    }
  }
}
```

---

## Usage in Admin Panel

Admins can update these settings through:
- **Settings Page**: `/admin/settings`
- **Pricing Page**: `/admin/pricing`

Changes are immediately reflected in the public calculator.

---

**Created**: November 2, 2025
