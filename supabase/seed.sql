-- ====================================================================
-- SEED DATA FOR TB. SUMBER AGUNG POS
-- ====================================================================

-- 1. SEED CATEGORIES
INSERT INTO public.categories (id, name, description) VALUES
('c1111111-1111-1111-1111-111111111111', 'Semen & Pasir', 'Semen PCC, Portland, Pasir Pasang, Pasir Cor, Semen Putih'),
('c2222222-2222-2222-2222-222222222222', 'Besi & Logam', 'Besi Beton, Wiremesh, Kawat Bendrat, Baja Ringan, Seng'),
('c3333333-3333-3333-3333-333333333333', 'Cat & Coating', 'Cat Tembok, Cat Kayu/Besi, Thinner, Kuas, Roll Cat'),
('c4444444-4444-4444-4444-444444444444', 'Pipa & Plambing', 'Pipa PVC, Kran Air, Fitting Knee, Lem Pipa, Sanitari'),
('c5555555-5555-5555-5555-555555555555', 'Kelistrikan & Alat', 'Kabel NYM, Saklar, Stop Kontak, Lampu LED, Tang, Martil'),
('c6666666-6666-6666-6666-666666666666', 'Kayu & Triplek', 'Triplek 9mm/12mm, Kayu Meranti, Usuk, Reng'),
('c7777777-7777-7777-7777-777777777777', 'Atap & Plafon', 'Genteng Metal, Asbes, Plafon PVC, Skrup Atap'),
('c8888888-8888-8888-8888-888888888888', 'Keramik & Batu', 'Keramik Lantai 40x40, Batu Bata Merah, Batako')
ON CONFLICT (id) DO NOTHING;

-- 2. SEED PRODUCTS
INSERT INTO public.products (id, sku, barcode, name, category_id, unit, cost_price, selling_price, stock, minimum_stock) VALUES
('p1111111-1111-1111-1111-111111111111', 'SMN-GRS-40', '899123456001', 'Semen Gresik 40kg', 'c1111111-1111-1111-1111-111111111111', 'SAK', 58000, 65000, 120, 20),
('p2222222-2222-2222-2222-222222222222', 'SMN-TGR-50', '899123456002', 'Semen Tiga Roda 50kg', 'c1111111-1111-1111-1111-111111111111', 'SAK', 68000, 75000, 4, 20),
('p3333333-3333-3333-3333-333333333333', 'BSI-BTN-10', '899123456003', 'Besi Beton 10mm SNI', 'c2222222-2222-2222-2222-222222222222', 'BATANG', 65000, 75000, 85, 15),
('p4444444-4444-4444-4444-444444444444', 'PKU-KYU-03', '899123456004', 'Paku Kayu 3 inch', 'c2222222-2222-2222-2222-222222222222', 'KG', 18000, 22000, 2, 10),
('p5555555-5555-5555-5555-555555555555', 'CAT-NPP-05', '899123456005', 'Cat Tembok Nippon Paint 5kg White', 'c3333333-3333-3333-3333-333333333333', 'DOS', 115000, 135000, 18, 5),
('p6666666-6666-6666-6666-666666666666', 'PPA-WVN-34', '899123456006', 'Pipa PVC Wavin 3/4 inch (4 Meter)', 'c4444444-4444-4444-4444-444444444444', 'BATANG', 24000, 30000, 45, 10),
('p7777777-7777-7777-7777-777777777777', 'KBL-NYM-2x15', '899123456007', 'Kabel Eterna NYM 2x1.5mm 50m', 'c5555555-5555-5555-5555-555555555555', 'ROLL', 280000, 325000, 12, 3),
('p8888888-8888-8888-8888-888888888888', 'TPL-9MM-122', '899123456008', 'Triplek Meranti 9mm (122x244)', 'c6666666-6666-6666-6666-666666666666', 'LEMBAR', 92000, 110000, 30, 8),
('p9999999-9999-9999-9999-999999999999', 'KWT-BND-01', '899123456009', 'Kawat Bendrat ikat', 'c2222222-2222-2222-2222-222222222222', 'ROLL', 16000, 20000, 3, 15),
('p0000000-0000-0000-0000-000000000000', 'FTG-PVC-12', '899123456010', 'Fitting Knee PVC 1/2 inch Rucika', 'c4444444-4444-4444-4444-444444444444', 'PCS', 3500, 5000, 8, 30)
ON CONFLICT (id) DO NOTHING;

-- 3. SEED CUSTOMERS
INSERT INTO public.customers (id, name, phone, email, address, points, member_tier) VALUES
('u1111111-1111-1111-1111-111111111111', 'Pak Joko (Kontraktor)', '081234567890', 'joko.kontraktor@gmail.com', 'Jl. Raya Pemuda No. 12, Surabaya', 420, 'Gold'),
('u2222222-2222-2222-2222-222222222222', 'Mas Budi (Tukang Kayu)', '085712345678', 'budi.wood@yahoo.com', 'Kampung Nelayan RT 03/02', 150, 'Silver'),
('u3333333-3333-3333-3333-333333333333', 'Ibu Retno (Pelanggan Umut)', '081987654321', NULL, 'Perumahan Indah Asri B-4', 35, 'Regular')
ON CONFLICT (id) DO NOTHING;

-- 4. SEED SUPPLIERS
INSERT INTO public.suppliers (id, name, contact_person, phone, email, address) VALUES
('s1111111-1111-1111-1111-111111111111', 'PT. Semen Indonesia Distributor', 'Hendra Sales', '08111222333', 'sales@semenindonesia.co.id', 'Kawasan Industri Gresik'),
('s2222222-2222-2222-2222-222222222222', 'CV. Logam Perkasa Utama', 'Agus Supri', '08122334455', 'orders@logamperkasa.com', 'Jl. Margomulyo No. 45, Surabaya'),
('s3333333-3333-3333-3333-333333333333', 'Distributor Paint & Hardware', 'Santi Paint', '08133445566', 'santi@painthardware.com', 'Ruko Kertajaya Indah C-10')
ON CONFLICT (id) DO NOTHING;
