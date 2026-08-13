-- ====================================================================
-- MIGRATION: Initial Schema & RLS Policies for TB. SUMBER AGUNG POS
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('OWNER', 'ADMIN', 'CASHIER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('CASH', 'TRANSFER', 'QRIS', 'DEBIT', 'CREDIT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sale_status AS ENUM ('COMPLETED', 'VOIDED', 'PENDING');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stock_movement_type AS ENUM ('PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'DAMAGE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE cash_type AS ENUM ('IN', 'OUT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'CASHIER',
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT UNIQUE NOT NULL,
    barcode TEXT UNIQUE,
    name TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    unit TEXT NOT NULL DEFAULT 'PCS',
    cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    selling_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    stock NUMERIC(10,2) NOT NULL DEFAULT 0,
    minimum_stock NUMERIC(10,2) NOT NULL DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    points INT NOT NULL DEFAULT 0,
    member_tier TEXT NOT NULL DEFAULT 'Regular',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. SALES TABLE
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    cashier_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    discount NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax NUMERIC(12,2) NOT NULL DEFAULT 0,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    payment_method payment_method NOT NULL DEFAULT 'CASH',
    paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    change_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    status sale_status NOT NULL DEFAULT 'COMPLETED',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. SALE ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    cost_price NUMERIC(12,2) NOT NULL DEFAULT 0, -- Stored historical cost price
    discount NUMERIC(12,2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. PURCHASES TABLE (Kulakan/Faktur Masuk)
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_number TEXT UNIQUE NOT NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'COMPLETED',
    payment_status TEXT NOT NULL DEFAULT 'PAID', -- PAID, UNPAID, PARTIAL
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. PURCHASE ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.purchase_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. STOCK MOVEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    movement_type stock_movement_type NOT NULL,
    quantity NUMERIC(10,2) NOT NULL, -- Positive for IN, negative for OUT
    stock_before NUMERIC(10,2) NOT NULL,
    stock_after NUMERIC(10,2) NOT NULL,
    reference_id TEXT, -- E.g. sale_id, purchase_id, or adjustment note
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. CASH TRANSACTIONS TABLE (Kas Masuk / Kas Keluar Operasional)
CREATE TABLE IF NOT EXISTS public.cash_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type cash_type NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    category TEXT NOT NULL, -- E.g. Operational, Shift Opening, Petty Cash
    notes TEXT,
    cashier_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- INDEXES FOR SPEED & SEARCH OPTIMIZATION
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);

CREATE INDEX IF NOT EXISTS idx_sales_invoice_number ON public.sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON public.sales(customer_id);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON public.sale_items(product_id);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON public.stock_movements(created_at);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;

-- Helper function to fetch current user's role from profiles
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 1. PROFILES POLICIES
CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Owners and Admins can manage profiles" 
ON public.profiles FOR ALL 
TO authenticated 
USING (public.get_user_role() IN ('OWNER', 'ADMIN'));

-- 2. CATEGORIES POLICIES
CREATE POLICY "Categories viewable by authenticated" 
ON public.categories FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Categories manageable by Owner and Admin" 
ON public.categories FOR ALL 
TO authenticated 
USING (public.get_user_role() IN ('OWNER', 'ADMIN'));

-- 3. PRODUCTS POLICIES
CREATE POLICY "Products viewable by authenticated" 
ON public.products FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Products manageable by Owner and Admin" 
ON public.products FOR ALL 
TO authenticated 
USING (public.get_user_role() IN ('OWNER', 'ADMIN'));

-- 4. CUSTOMERS POLICIES
CREATE POLICY "Customers viewable by authenticated" 
ON public.customers FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Customers manageable by authenticated users" 
ON public.customers FOR ALL 
TO authenticated USING (true);

-- 5. SUPPLIERS POLICIES
CREATE POLICY "Suppliers viewable by authenticated" 
ON public.suppliers FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Suppliers manageable by Owner and Admin" 
ON public.suppliers FOR ALL 
TO authenticated 
USING (public.get_user_role() IN ('OWNER', 'ADMIN'));

-- 6. SALES POLICIES
CREATE POLICY "Sales viewable by authenticated" 
ON public.sales FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Sales created by Cashiers, Admins, Owners" 
ON public.sales FOR INSERT 
TO authenticated WITH CHECK (true);

CREATE POLICY "Sales manageable by Owner and Admin" 
ON public.sales FOR UPDATE 
TO authenticated 
USING (public.get_user_role() IN ('OWNER', 'ADMIN'));

-- 7. SALE ITEMS POLICIES
CREATE POLICY "Sale items viewable by authenticated" 
ON public.sale_items FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Sale items insertion allowed for authenticated" 
ON public.sale_items FOR INSERT 
TO authenticated WITH CHECK (true);

-- 8. PURCHASES & PURCHASE ITEMS POLICIES
CREATE POLICY "Purchases viewable by authenticated" 
ON public.purchases FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Purchases manageable by Owner and Admin" 
ON public.purchases FOR ALL 
TO authenticated 
USING (public.get_user_role() IN ('OWNER', 'ADMIN'));

CREATE POLICY "Purchase items viewable by authenticated" 
ON public.purchase_items FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Purchase items manageable by Owner and Admin" 
ON public.purchase_items FOR ALL 
TO authenticated 
USING (public.get_user_role() IN ('OWNER', 'ADMIN'));

-- 9. STOCK MOVEMENTS POLICIES
CREATE POLICY "Stock movements viewable by authenticated" 
ON public.stock_movements FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Stock movements insertable by authenticated" 
ON public.stock_movements FOR INSERT 
TO authenticated WITH CHECK (true);

-- 10. CASH TRANSACTIONS POLICIES
CREATE POLICY "Cash transactions viewable by authenticated" 
ON public.cash_transactions FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Cash transactions insertable by authenticated" 
ON public.cash_transactions FOR INSERT 
TO authenticated WITH CHECK (true);
