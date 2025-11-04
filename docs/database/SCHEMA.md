# Database Schema - Ship Tracking System

## PostgreSQL Database Design (Supabase)

---

## Tables

### 1. users
User accounts and authentication
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(20),
  google_id VARCHAR(255) UNIQUE,
  role VARCHAR(50) DEFAULT 'customer', -- 'admin', 'customer', 'staff'
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. customers
Customer information from Airtable sync
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  airtable_id VARCHAR(255) UNIQUE,
  company_name VARCHAR(255),
  contact_person VARCHAR(255),
  phone VARCHAR(20),
  line_id VARCHAR(255),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. orders
Customer orders
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  shipping_method VARCHAR(20) NOT NULL, -- 'sea', 'air'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
  origin VARCHAR(255),
  destination VARCHAR(255),
  total_weight DECIMAL(10, 2),
  total_volume DECIMAL(10, 2),
  estimated_cost DECIMAL(10, 2),
  actual_cost DECIMAL(10, 2),
  estimated_delivery DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4. shipments
Shipment tracking information
```sql
CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  tracking_number VARCHAR(100) UNIQUE NOT NULL,
  carrier VARCHAR(255),
  vessel_name VARCHAR(255), -- For sea shipping
  flight_number VARCHAR(50), -- For air shipping
  departure_port VARCHAR(255),
  arrival_port VARCHAR(255),
  departure_date DATE,
  arrival_date DATE,
  current_status VARCHAR(100),
  current_location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 5. tracking_history
Tracking status updates
```sql
CREATE TABLE tracking_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID REFERENCES shipments(id),
  status VARCHAR(100) NOT NULL,
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  description TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 6. schedules
Ship and flight schedules
```sql
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_type VARCHAR(20) NOT NULL, -- 'sea', 'air'
  carrier VARCHAR(255),
  vessel_name VARCHAR(255),
  flight_number VARCHAR(50),
  route VARCHAR(255),
  departure_port VARCHAR(255),
  arrival_port VARCHAR(255),
  departure_date DATE,
  arrival_date DATE,
  frequency VARCHAR(50), -- 'weekly', 'biweekly', 'monthly'
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'cancelled', 'delayed'
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 7. reviews
Customer reviews and ratings
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  order_id UUID REFERENCES orders(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 8. portfolio_items
Portfolio showcase items
```sql
CREATE TABLE portfolio_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  category VARCHAR(100),
  order_id UUID REFERENCES orders(id),
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 9. rate_calculator
Shipping rate calculation settings
```sql
CREATE TABLE rate_calculator (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipping_method VARCHAR(20) NOT NULL, -- 'sea', 'air'
  origin VARCHAR(255),
  destination VARCHAR(255),
  weight_min DECIMAL(10, 2),
  weight_max DECIMAL(10, 2),
  rate_per_kg DECIMAL(10, 2),
  base_fee DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 10. notifications
Notification logs
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  customer_id UUID REFERENCES customers(id),
  type VARCHAR(50), -- 'email', 'line', 'sms'
  subject VARCHAR(255),
  message TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  sent_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 11. contact_messages
Contact form submissions
```sql
CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  subject VARCHAR(255),
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'new', -- 'new', 'read', 'replied'
  replied_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 12. statistics
System statistics cache
```sql
CREATE TABLE statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stat_type VARCHAR(100) NOT NULL,
  stat_date DATE NOT NULL,
  value DECIMAL(10, 2),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(stat_type, stat_date)
);
```

---

## Indexes

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);

-- Customers
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_airtable_id ON customers(airtable_id);

-- Orders
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);

-- Shipments
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_tracking_number ON shipments(tracking_number);

-- Tracking History
CREATE INDEX idx_tracking_history_shipment_id ON tracking_history(shipment_id);
CREATE INDEX idx_tracking_history_timestamp ON tracking_history(timestamp);

-- Reviews
CREATE INDEX idx_reviews_customer_id ON reviews(customer_id);
CREATE INDEX idx_reviews_is_approved ON reviews(is_approved);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
```

---

## Row Level Security (RLS) Policies

### Users Table
```sql
-- Users can read their own data
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = id);
```

### Orders Table
```sql
-- Customers can only see their own orders
CREATE POLICY orders_select_own ON orders
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  );

-- Admins can see all orders
CREATE POLICY orders_select_admin ON orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

---

## Relationships

```
users (1) ----< (many) customers
customers (1) ----< (many) orders
orders (1) ----< (many) shipments
shipments (1) ----< (many) tracking_history
customers (1) ----< (many) reviews
orders (1) ----< (1) reviews
orders (1) ----< (1) portfolio_items
users (1) ----< (many) notifications
```

---

## Sample Queries

### Get order with tracking information
```sql
SELECT
  o.*,
  s.tracking_number,
  s.current_status,
  s.current_location
FROM orders o
LEFT JOIN shipments s ON o.id = s.order_id
WHERE o.order_number = 'ORD-2025-001';
```

### Get tracking history for shipment
```sql
SELECT * FROM tracking_history
WHERE shipment_id = 'xxx-xxx-xxx'
ORDER BY timestamp DESC;
```

### Calculate statistics
```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_orders,
  SUM(actual_cost) as total_revenue
FROM orders
WHERE status = 'delivered'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

**Last Updated**: November 2, 2025
