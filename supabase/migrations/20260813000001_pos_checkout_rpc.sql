-- ====================================================================
-- MIGRATION: Atomic POS Checkout Function (RPC)
-- ====================================================================

CREATE OR REPLACE FUNCTION public.process_pos_sale(
    p_customer_id UUID DEFAULT NULL,
    p_cashier_id UUID DEFAULT NULL,
    p_subtotal NUMERIC DEFAULT 0,
    p_discount NUMERIC DEFAULT 0,
    p_tax NUMERIC DEFAULT 0,
    p_total NUMERIC DEFAULT 0,
    p_payment_method payment_method DEFAULT 'CASH',
    p_paid_amount NUMERIC DEFAULT 0,
    p_change_amount NUMERIC DEFAULT 0,
    p_notes TEXT DEFAULT NULL,
    p_items JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_today_str TEXT;
    v_count INT;
    v_invoice_number TEXT;
    v_sale_id UUID;
    v_item RECORD;
    v_product_id UUID;
    v_quantity NUMERIC;
    v_unit_price NUMERIC;
    v_cost_price NUMERIC;
    v_item_discount NUMERIC;
    v_item_subtotal NUMERIC;
    v_current_stock NUMERIC;
    v_product_name TEXT;
    v_new_stock NUMERIC;
BEGIN
    -- 1. Format Tanggal Hari Ini (YYYYMMDD)
    v_today_str := to_char(NOW() AT TIME ZONE 'Asia/Jakarta', 'YYYYMMDD');
    
    -- 2. Hitung jumlah transaksi hari ini untuk nomor urut invoice atomic
    SELECT COUNT(*) + 1 INTO v_count 
    FROM public.sales 
    WHERE to_char(created_at AT TIME ZONE 'Asia/Jakarta', 'YYYYMMDD') = v_today_str;
    
    v_invoice_number := 'TRX-' || v_today_str || '-' || lpad(v_count::text, 4, '0');

    -- 3. Validasi & Lock Stok Produk terlebih dahulu
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        product_id UUID,
        quantity NUMERIC,
        unit_price NUMERIC,
        cost_price NUMERIC,
        discount NUMERIC,
        subtotal NUMERIC
    )
    LOOP
        v_product_id := v_item.product_id;
        v_quantity := v_item.quantity;

        SELECT name, stock INTO v_product_name, v_current_stock
        FROM public.products
        WHERE id = v_product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Produk dengan ID % tidak ditemukan.', v_product_id;
        END IF;

        IF v_current_stock < v_quantity THEN
            RAISE EXCEPTION 'Stok % tidak mencukupi. Stok tersedia: %, diminta: %', 
                v_product_name, v_current_stock, v_quantity;
        END IF;
    END LOOP;

    -- 4. Insert ke tabel sales
    INSERT INTO public.sales (
        invoice_number,
        customer_id,
        cashier_id,
        subtotal,
        discount,
        tax,
        total,
        payment_method,
        paid_amount,
        change_amount,
        status,
        notes,
        created_at,
        updated_at
    ) VALUES (
        v_invoice_number,
        p_customer_id,
        p_cashier_id,
        p_subtotal,
        p_discount,
        p_tax,
        p_total,
        p_payment_method,
        p_paid_amount,
        p_change_amount,
        'COMPLETED',
        p_notes,
        NOW(),
        NOW()
    ) RETURNING id INTO v_sale_id;

    -- 5. Loop insert sale_items, kurangi stok, & catat stock_movements
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        product_id UUID,
        quantity NUMERIC,
        unit_price NUMERIC,
        cost_price NUMERIC,
        discount NUMERIC,
        subtotal NUMERIC
    )
    LOOP
        v_product_id := v_item.product_id;
        v_quantity := v_item.quantity;
        v_unit_price := COALESCE(v_item.unit_price, 0);
        v_cost_price := COALESCE(v_item.cost_price, 0);
        v_item_discount := COALESCE(v_item.discount, 0);
        v_item_subtotal := COALESCE(v_item.subtotal, (v_unit_price - v_item_discount) * v_quantity);

        -- Insert Sale Item
        INSERT INTO public.sale_items (
            sale_id,
            product_id,
            quantity,
            unit_price,
            cost_price,
            discount,
            subtotal,
            created_at
        ) VALUES (
            v_sale_id,
            v_product_id,
            v_quantity,
            v_unit_price,
            v_cost_price,
            v_item_discount,
            v_item_subtotal,
            NOW()
        );

        -- Get stock sebelum update
        SELECT stock INTO v_current_stock FROM public.products WHERE id = v_product_id;
        v_new_stock := v_current_stock - v_quantity;

        -- Update Stock
        UPDATE public.products
        SET stock = v_new_stock,
            updated_at = NOW()
        WHERE id = v_product_id;

        -- Insert Stock Movement
        INSERT INTO public.stock_movements (
            product_id,
            movement_type,
            quantity,
            stock_before,
            stock_after,
            reference_id,
            notes,
            created_by,
            created_at
        ) VALUES (
            v_product_id,
            'SALE',
            -v_quantity,
            v_current_stock,
            v_new_stock,
            v_sale_id::text,
            'Penjualan Kasir Invoice: ' || v_invoice_number,
            p_cashier_id,
            NOW()
        );
    END LOOP;

    -- Return JSON result
    RETURN jsonb_build_object(
        'success', true,
        'sale_id', v_sale_id,
        'invoice_number', v_invoice_number,
        'total', p_total,
        'paid_amount', p_paid_amount,
        'change_amount', p_change_amount,
        'created_at', NOW()
    );
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION '%', SQLERRM;
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.process_pos_sale TO authenticated;
