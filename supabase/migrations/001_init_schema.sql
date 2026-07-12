-- ServeUp Database Schema
-- Run this in Supabase SQL Editor

-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom types
CREATE TYPE industry_type AS ENUM ('cafe', 'gym', 'bulk_retail', 'other');
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MERCHANTS
-- ============================================
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    industry industry_type NOT NULL DEFAULT 'other',
    subscription_plan TEXT DEFAULT 'basic',
    status subscription_status NOT NULL DEFAULT 'trialing',
    currency TEXT DEFAULT 'INR',
    primary_color TEXT DEFAULT '#0F172A',
    logo_url TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    wa_phone_number_id TEXT,
    wa_access_token TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER trg_merchants_updated_at
    BEFORE UPDATE ON merchants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CUSTOMERS (Global identity)
-- ============================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT UNIQUE NOT NULL,
    full_name TEXT,
    whatsapp_opt_in BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT valid_phone CHECK (phone_number ~ '^\+[1-9]\d{1,14}$')
);

CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_customers_phone ON customers(phone_number);
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- MERCHANT_CUSTOMERS (Tenant-isolated loyalty)
-- ============================================
CREATE TABLE merchant_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_spent NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_visits INT DEFAULT 0,
    current_cycle_visits INT DEFAULT 0,
    loyalty_points INTEGER NOT NULL DEFAULT 0,
    last_visit_at TIMESTAMPTZ,
    is_unsubscribed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(merchant_id, customer_id)
);

CREATE TRIGGER trg_mc_updated_at
    BEFORE UPDATE ON merchant_customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_mc_lookup ON merchant_customers(merchant_id, customer_id);
ALTER TABLE merchant_customers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(merchant_id, name)
);

CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_categories_merchant ON categories(merchant_id, is_active);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    base_price NUMERIC(10,2) NOT NULL,
    image_url TEXT,
    attributes JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_products_merchant_active ON products(merchant_id, is_active);
CREATE INDEX idx_products_attributes ON products USING GIN (attributes);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL,
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    order_status order_status NOT NULL DEFAULT 'pending',
    payment_status payment_status NOT NULL DEFAULT 'pending',
    subtotal NUMERIC(10,2) NOT NULL,
    discount_applied NUMERIC(10,2) DEFAULT 0.00,
    tax_amount NUMERIC(10,2) DEFAULT 0.00,
    total_amount NUMERIC(10,2) GENERATED ALWAYS AS (subtotal - discount_applied + tax_amount) STORED,
    final_payable_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    reward_consumed BOOLEAN DEFAULT false,
    loyalty_reward_used BOOLEAN DEFAULT false,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(merchant_id, order_number)
);

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_orders_merchant_status ON orders(merchant_id, order_status, created_at DESC);
CREATE INDEX idx_orders_analytics ON orders(merchant_id, order_status, created_at DESC) INCLUDE (final_payable_amount, customer_id);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- ============================================
-- ORDER ITEMS
-- ============================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name_snapshot TEXT NOT NULL,
    unit_price_snapshot NUMERIC(10,2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    selected_attributes JSONB DEFAULT '{}'::jsonb,
    line_total NUMERIC(10,2) GENERATED ALWAYS AS (unit_price_snapshot * quantity) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- LOYALTY RULES
-- ============================================
CREATE TABLE loyalty_rules (
    merchant_id UUID PRIMARY KEY REFERENCES merchants(id),
    visit_threshold INT NOT NULL DEFAULT 5,
    reward_type TEXT NOT NULL CHECK (reward_type IN ('PERCENTAGE_DISCOUNT', 'FLAT_AMOUNT')),
    reward_value NUMERIC(10,2) NOT NULL,
    max_discount_amount NUMERIC(10,2),
    is_active BOOLEAN DEFAULT true
);
ALTER TABLE loyalty_rules ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS (For Super Admin & Merchant Staff)
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'MERCHANT',
    merchant_id UUID REFERENCES merchants(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PLATFORM SUBSCRIPTIONS
-- ============================================
CREATE TABLE platform_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES merchants(id),
    amount_paid NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE platform_subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================
CREATE POLICY "merchants_public_read"
    ON merchants FOR SELECT
    TO anon, authenticated
    USING (status = 'active');

CREATE POLICY "categories_public_read"
    ON categories FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

CREATE POLICY "products_public_read"
    ON products FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

CREATE POLICY "customers_self_read"
    ON customers FOR SELECT
    TO authenticated
    USING (id = auth.uid());

CREATE POLICY "orders_self_read"
    ON orders FOR SELECT
    TO authenticated
    USING (customer_id = auth.uid());

CREATE POLICY "orders_self_insert"
    ON orders FOR INSERT
    TO authenticated
    WITH CHECK (customer_id = auth.uid());

-- ============================================
-- DATABASE FUNCTIONS FOR ANALYTICS
-- ============================================
CREATE OR REPLACE FUNCTION get_dashboard_kpis(p_merchant_id UUID, p_days INT)
RETURNS JSON AS $$
DECLARE result JSON;
BEGIN
    SELECT json_build_object(
        'total_revenue', COALESCE(SUM(final_payable_amount) FILTER (WHERE payment_status = 'paid'), 0),
        'total_orders', COUNT(id),
        'aov', COALESCE(AVG(final_payable_amount) FILTER (WHERE payment_status = 'paid'), 0),
        'unique_customers', COUNT(DISTINCT customer_id)
    ) INTO result
    FROM orders
    WHERE merchant_id = p_merchant_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_revenue_trends(p_merchant_id UUID, p_days INT)
RETURNS TABLE(date TEXT, revenue NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT TO_CHAR(DATE_TRUNC('day', created_at), 'Mon DD')::TEXT as date,
        COALESCE(SUM(final_payable_amount), 0)::NUMERIC as revenue
    FROM orders
    WHERE merchant_id = p_merchant_id AND payment_status = 'paid'
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY DATE_TRUNC('day', created_at)
    ORDER BY DATE_TRUNC('day', created_at) ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_peak_hours(p_merchant_id UUID, p_days INT)
RETURNS TABLE(hour TEXT, volume BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT (EXTRACT(HOUR FROM created_at)::INT || ' ' || CASE WHEN EXTRACT(HOUR FROM created_at) >= 12 THEN 'PM' ELSE 'AM' END)::TEXT as hour,
        COUNT(id)::BIGINT as volume
    FROM orders
    WHERE merchant_id = p_merchant_id AND payment_status = 'paid'
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY EXTRACT(HOUR FROM created_at)
    ORDER BY EXTRACT(HOUR FROM created_at) ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_system_gmv()
RETURNS NUMERIC AS $$
BEGIN
    RETURN COALESCE((SELECT SUM(final_payable_amount) FROM orders WHERE payment_status = 'paid'), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_active_merchant_count()
RETURNS INT AS $$
BEGIN
    RETURN (SELECT COUNT(*)::INT FROM merchants WHERE status = 'active');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_platform_revenue()
RETURNS NUMERIC AS $$
BEGIN
    RETURN COALESCE((SELECT SUM(amount_paid) FROM platform_subscriptions WHERE status = 'SUCCESS'), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_industry_distribution()
RETURNS TABLE(industry TEXT, count BIGINT, percentage NUMERIC) AS $$
DECLARE total BIGINT;
BEGIN
    total := (SELECT COUNT(*) FROM merchants);
    RETURN QUERY
    SELECT m.industry::TEXT, COUNT(*)::BIGINT, ROUND((COUNT(*)::NUMERIC / NULLIF(total, 0)) * 100, 1)
    FROM merchants m GROUP BY m.industry ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
