# SUPABASE DATABASE & MIGRATION GUIDE - TB. SUMBER AGUNG POS

Panduan ini berisi informasi struktur database, skrip migrasi SQL, kebijakan *Row Level Security* (RLS), serta data awal (*seed data*) untuk aplikasi **Point of Sale (POS) Toko Bahan Bangunan TB. Sumber Agung**.

---

## 1. File Penting

- `supabase/migrations/20260813000000_initial_schema.sql`: Skrip DDL utama untuk tabel, tipe ENUM, indeks, dan aturan RLS.
- `supabase/seed.sql`: Skrip SQL data awal (kategori material, sampel produk toko bangunan, pelanggan, dan supplier).
- `.env.example`: Template kredensial Supabase (`VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY`).

---

## 2. Cara Menjalankan Migrasi di Supabase Dashboard

1. Buka [Supabase Dashboard](https://app.supabase.com/) dan pilih project Anda.
2. Buka menu **SQL Editor** pada sidebar kiri.
3. Buka file `supabase/migrations/20260813000000_initial_schema.sql`, salin seluruh kodenya, lalu tempel (*paste*) ke SQL Editor Supabase.
4. Klik tombol **Run** untuk mengeksekusi skrip DDL.
5. Selanjutnya, buka file `supabase/seed.sql`, salin seluruh isinya, tempel ke SQL Editor Supabase, dan klik **Run**.

---

## 3. Struktur Tabel & Relasi

| Nama Tabel | Deskripsi | Kunci Utama / Relasi Utama |
| :--- | :--- | :--- |
| `profiles` | Data profil & role pengguna (`OWNER`, `ADMIN`, `CASHIER`) | `id` (FK -> `auth.users`) |
| `categories` | Kategori material (Semen, Besi, Cat, Pipa, dll) | `id` (UUID) |
| `products` | Katalog produk material bangunan & stok | `id` (UUID), `category_id` (FK) |
| `customers` | Master data pelanggan & poin member | `id` (UUID) |
| `suppliers` | Master data distributor/supplier material | `id` (UUID) |
| `sales` | Header transaksi penjualan POS | `id` (UUID), `customer_id`, `cashier_id` |
| `sale_items` | Rincian barang dalam nota transaksi | `id` (UUID), `sale_id`, `product_id` |
| `purchases` | Faktur/nota kulakan masuk dari supplier | `id` (UUID), `supplier_id` |
| `purchase_items` | Detail item barang masuk dari supplier | `id` (UUID), `purchase_id`, `product_id` |
| `stock_movements` | Histori mutasi stok (Beli, Jual, Retur, Rusak) | `id` (UUID), `product_id` |
| `cash_transactions` | Catatan kas masuk / kas keluar operasional | `id` (UUID), `cashier_id` |

---

## 4. Role & Hak Akses (Row Level Security)

1. **`OWNER`**: Akses penuh (*Full Access*) ke semua tabel, laporan finansial, manajemen pengguna, dan pengaturan toko.
2. **`ADMIN`**: Akses membaca & mengedit master data (produk, kategori, supplier, stok, pembelian, pelanggan, transaksi). Tidak dapat menghapus profil pengguna lain.
3. **`CASHIER`**: Akses khusus operasional kasir (baca katalog produk, buat transaksi penjualan, baca/tambah data pelanggan, cetak struk).

---

## 5. Menghubungkan Aplikasi ke Supabase Cloud

Di file `.env` lokal Anda:
```env
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key-supabase-anda>
```
Jika variabel di atas belum diisi, aplikasi otomatis berjalan dalam **Mode Demo / Local Standalone** sehingga tetap dapat dicoba tanpa error.
