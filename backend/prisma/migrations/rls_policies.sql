-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- สำหรับ Supabase
-- ============================================

-- เปิด RLS สำหรับ tables หลัก
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Admin สามารถดูและแก้ไข users ทั้งหมด
CREATE POLICY "admin_all_users" ON users
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Users สามารถดูและแก้ไขเฉพาะข้อมูลของตัวเอง
CREATE POLICY "users_own_data" ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ไม่รวมข้อมูลที่ถูก soft delete
CREATE POLICY "exclude_deleted_users" ON users
  FOR SELECT
  USING (deleted_at IS NULL);

-- ============================================
-- CUSTOMERS TABLE POLICIES
-- ============================================

-- Admin สามารถดูและแก้ไข customers ทั้งหมด
CREATE POLICY "admin_all_customers" ON customers
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Users สามารถดูเฉพาะ customer ที่เชื่อมกับตัวเอง
CREATE POLICY "users_own_customer" ON customers
  FOR SELECT
  USING (user_id = auth.uid());

-- ไม่รวมข้อมูลที่ถูก soft delete
CREATE POLICY "exclude_deleted_customers" ON customers
  FOR SELECT
  USING (deleted_at IS NULL);

-- ============================================
-- ORDERS TABLE POLICIES
-- ============================================

-- Admin สามารถดูและแก้ไข orders ทั้งหมด
CREATE POLICY "admin_all_orders" ON orders
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Users สามารถดูเฉพาะ orders ของ customer ที่เชื่อมกับตัวเอง
CREATE POLICY "users_own_orders" ON orders
  FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

-- ไม่รวมข้อมูลที่ถูก soft delete
CREATE POLICY "exclude_deleted_orders" ON orders
  FOR SELECT
  USING (deleted_at IS NULL);

-- ============================================
-- ORDER_ITEMS TABLE POLICIES
-- ============================================

-- Admin สามารถดูและแก้ไข order_items ทั้งหมด
CREATE POLICY "admin_all_order_items" ON order_items
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Users สามารถดูเฉพาะ order_items ของ orders ของตัวเอง
CREATE POLICY "users_own_order_items" ON order_items
  FOR SELECT
  USING (
    order_id IN (
      SELECT o.id FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- ไม่รวมข้อมูลที่ถูก soft delete
CREATE POLICY "exclude_deleted_order_items" ON order_items
  FOR SELECT
  USING (deleted_at IS NULL);

-- ============================================
-- PAYMENTS TABLE POLICIES
-- ============================================

-- Admin สามารถดูและแก้ไข payments ทั้งหมด
CREATE POLICY "admin_all_payments" ON payments
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Users สามารถดูเฉพาะ payments ของ orders ของตัวเอง
CREATE POLICY "users_own_payments" ON payments
  FOR SELECT
  USING (
    order_item_id IN (
      SELECT oi.id FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN customers c ON o.customer_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- ไม่รวมข้อมูลที่ถูก soft delete
CREATE POLICY "exclude_deleted_payments" ON payments
  FOR SELECT
  USING (deleted_at IS NULL);

-- ============================================
-- AUDIT & SECURITY TABLES POLICIES
-- เฉพาะ Admin เท่านั้น
-- ============================================

-- Login History - Admin only
CREATE POLICY "admin_only_login_history" ON login_history
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Admin Audit Logs - Admin only (read)
CREATE POLICY "admin_read_audit_logs" ON admin_audit_logs
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- System insert only for audit logs (no manual edit)
CREATE POLICY "system_insert_audit_logs" ON admin_audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Security Alerts - Admin only
CREATE POLICY "admin_only_security_alerts" ON security_alerts
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Data Access Logs - Admin only (read)
CREATE POLICY "admin_read_data_access" ON data_access_logs
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- System insert only for data access logs
CREATE POLICY "system_insert_data_access" ON data_access_logs
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- PUBLIC TABLES (ไม่มี sensitive data)
-- ============================================

-- Reviews - อนุญาตให้ทุกคนดู approved reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_approved_reviews" ON reviews
  FOR SELECT
  USING (is_approved = true);

CREATE POLICY "admin_all_reviews" ON reviews
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Schedule Images - อนุญาตให้ทุกคนดู
ALTER TABLE schedule_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_schedule_images" ON schedule_images
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "admin_all_schedule_images" ON schedule_images
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Web Notifications - อนุญาตให้ทุกคนดู
ALTER TABLE web_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_web_notifications" ON web_notifications
  FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "admin_all_web_notifications" ON web_notifications
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function ตรวจสอบว่าเป็น admin หรือไม่
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() ->> 'role') = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function ตรวจสอบว่า user เป็นเจ้าของ customer หรือไม่
CREATE OR REPLACE FUNCTION is_customer_owner(customer_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = customer_id AND c.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INDEXES สำหรับ Performance
-- ============================================

-- Indexes สำหรับ soft delete queries
CREATE INDEX IF NOT EXISTS idx_users_deleted ON users(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_deleted ON customers(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_orders_deleted ON orders(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_deleted ON order_items(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payments_deleted ON payments(deleted_at) WHERE deleted_at IS NULL;

-- Composite indexes สำหรับ common queries
CREATE INDEX IF NOT EXISTS idx_orders_customer_status ON orders(customer_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_order_status ON order_items(order_id, status_step) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payments_item_status ON payments(order_item_id, status) WHERE deleted_at IS NULL;

-- ============================================
-- NOTES:
-- 1. ใช้คำสั่ง: psql -d your_database -f rls_policies.sql
-- 2. หรือรันผ่าน Supabase SQL Editor
-- 3. ตรวจสอบว่า auth.jwt() และ auth.uid() ทำงานถูกต้องกับ Supabase Auth
-- 4. ทดสอบ policies ก่อน deploy production
-- ============================================
