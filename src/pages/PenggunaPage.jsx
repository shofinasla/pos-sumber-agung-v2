import { useState, useEffect, useCallback } from 'react';
import {
  UserCog,
  Plus,
  Shield,
  CheckCircle2,
  RefreshCw,
  Edit,
  AlertCircle,
  KeyRound,
  Database,
} from 'lucide-react';
import { userService } from '../services/userService';
import { Modal } from '../components/common/Modal';

export const PenggunaPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'CASHIER',
    phone: '',
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data } = await userService.getUsers();
    setUsers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const { data } = await userService.getUsers();
      if (isMounted) {
        setUsers(data || []);
        setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenAddModal = () => {
    setSelectedUser(null);
    setErrorMsg('');
    setFormData({
      email: '',
      password: 'kasir' + Math.floor(100 + Math.random() * 900),
      full_name: '',
      role: 'CASHIER',
      phone: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (u) => {
    setSelectedUser(u);
    setErrorMsg('');
    setFormData({
      email: u.email || '',
      password: '',
      full_name: u.full_name || '',
      role: u.role || 'CASHIER',
      phone: u.phone || '',
      is_active: u.is_active ?? true,
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.email.trim() || !formData.full_name.trim()) {
      setErrorMsg('Nama lengkap dan alamat email wajib diisi.');
      return;
    }

    setSubmitting(true);

    if (selectedUser) {
      const res = await userService.updateUserRole(
        selectedUser.id,
        formData.role,
        formData.is_active
      );
      if (res?.error) {
        setErrorMsg(`Gagal memperbarui pengguna: ${res.error.message || 'Terjadi kesalahan'}`);
        setSubmitting(false);
        return;
      }
      setToastMsg(`Hak akses user ${formData.full_name} berhasil diperbarui.`);
    } else {
      const res = await userService.createUser(formData);
      if (res?.error) {
        setErrorMsg(`Gagal menambahkan pengguna: ${res.error.message || 'Terjadi kesalahan'}`);
        setSubmitting(false);
        return;
      }
      setToastMsg(
        `Pengguna ${formData.full_name} (${formData.email}) berhasil didaftarkan dan tersimpan!`
      );
    }

    setSubmitting(false);
    setIsAddModalOpen(false);
    await fetchUsers();
    setTimeout(() => setToastMsg(''), 5000);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'OWNER':
        return (
          <span className="px-2.5 py-1 bg-purple-50 text-purple-700 font-bold text-xs rounded-full border border-purple-200">
            OWNER (Pemilik Toko)
          </span>
        );
      case 'ADMIN':
        return (
          <span className="px-2.5 py-1 bg-sky-50 text-sky-700 font-bold text-xs rounded-full border border-sky-200">
            ADMIN (Pengelola)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200">
            KASIR (Kasir Toko)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg flex items-center justify-between text-sm font-semibold animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg('')} className="text-white/80 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCog className="w-7 h-7 text-slate-800" />
            Manajemen Pengguna & Hak Akses
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pengaturan akun staf, role pengguna (OWNER, ADMIN, CASHIER), dan status akses POS TB. Sumber Agung.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2.5 rounded-2xl transition shadow-xs text-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah Pengguna Baru
        </button>
      </div>

      {/* Info Notice & Database Sync Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <p className="font-bold">Keamanan & Hierarki Hak Akses System POS:</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-800">
              <li>
                <strong>OWNER:</strong> Akses penuh ke seluruh menu, laporan, pengaturan, dan user.
              </li>
              <li>
                <strong>ADMIN:</strong> Kelola produk, kategori, stok, pembelian, dan transaksi.
              </li>
              <li>
                <strong>CASHIER:</strong> Akses khusus ke Kasir POS dan Riwayat Transaksi.
              </li>
            </ul>
          </div>
        </div>

        <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 flex items-start gap-3">
          <Database className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div className="text-xs text-sky-900 leading-relaxed">
            <p className="font-bold">Sinkronisasi Database Cloud (Supabase):</p>
            <p className="mt-1 text-sky-800">
              Pengguna yang ditambahkan akan otomatis disinkronkan ke database cloud (tabel <code className="font-bold bg-white/70 px-1 py-0.5 rounded">profiles</code>) dan dicadangkan secara lokal agar staf dapat langsung login.
            </p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Daftar Staf & Akun Terdaftar ({users.length})
          </span>
          <button
            onClick={fetchUsers}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Memuat daftar pengguna...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-500">Belum ada pengguna terdaftar.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Nama Lengkap</th>
                  <th className="px-6 py-4">Email Login</th>
                  <th className="px-6 py-4">Role Akses</th>
                  <th className="px-6 py-4">No. HP</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                        {u.full_name?.charAt(0) || 'U'}
                      </div>
                      {u.full_name}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">{u.email}</td>
                    <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
                    <td className="px-6 py-4 text-xs font-mono">{u.phone || '-'}</td>
                    <td className="px-6 py-4">
                      {u.is_active !== false ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400 font-bold text-xs bg-slate-100 px-2 py-0.5 rounded-md">
                          Non-Aktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenEditModal(u)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={selectedUser ? 'Edit Hak Akses User' : 'Tambah User / Staf Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Lengkap Staf *
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Siti Kasir Utama"
              className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alamat Email (Login) *
            </label>
            <input
              type="email"
              required
              disabled={Boolean(selectedUser)}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="kasir2@sumberagung.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 disabled:opacity-60"
            />
          </div>

          {!selectedUser && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                Kata Sandi Awal Staf *
              </label>
              <input
                type="text"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="misal: kasir123"
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-sm font-mono border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Berikan kata sandi ini kepada staf untuk masuk ke akun mereka.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Role Akses Sistem *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500"
              >
                <option value="CASHIER">CASHIER (Kasir Penjualan)</option>
                <option value="ADMIN">ADMIN (Gudang & Transaksi)</option>
                <option value="OWNER">OWNER (Akses Penuh)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Handphone Staf
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="08123456789"
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500"
              />
            </div>
          </div>

          {selectedUser && (
            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded text-slate-800 focus:ring-slate-500"
                />
                Status Akun Aktif (Dapat Login ke POS)
              </label>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : selectedUser ? 'Simpan Perubahan' : 'Tambah User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PenggunaPage;
