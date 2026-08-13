import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { KasirPage } from '../pages/KasirPage';
import { ProdukPage } from '../pages/ProdukPage';
import { KategoriPage } from '../pages/KategoriPage';
import { StokPage } from '../pages/StokPage';
import { TransaksiPage } from '../pages/TransaksiPage';
import { PelangganPage } from '../pages/PelangganPage';
import { SupplierPage } from '../pages/SupplierPage';
import { PembelianPage } from '../pages/PembelianPage';
import { HutangPage } from '../pages/HutangPage';
import { LaporanPage } from '../pages/LaporanPage';
import { PenggunaPage } from '../pages/PenggunaPage';
import { PengaturanPage } from '../pages/PengaturanPage';
import { MainLayout } from '../components/layout/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Main Layout Routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/kasir" element={<KasirPage />} />
        <Route path="/produk" element={<ProdukPage />} />
        <Route path="/kategori" element={<KategoriPage />} />
        <Route path="/stok" element={<StokPage />} />
        <Route path="/transaksi" element={<TransaksiPage />} />
        <Route path="/pelanggan" element={<PelangganPage />} />
        <Route path="/supplier" element={<SupplierPage />} />
        <Route path="/pembelian" element={<PembelianPage />} />
        <Route path="/hutang" element={<HutangPage />} />
        <Route path="/laporan" element={<LaporanPage />} />
        <Route
          path="/pengguna"
          element={
            <ProtectedRoute allowedRoles={['OWNER', 'ADMIN']}>
              <PenggunaPage />
            </ProtectedRoute>
          }
        />
        <Route path="/pengaturan" element={<PengaturanPage />} />
      </Route>

      {/* Fallback Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
