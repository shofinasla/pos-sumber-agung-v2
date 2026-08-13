import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Search, RefreshCw, Edit2, Trash2, Award, Phone, MapPin, Mail } from 'lucide-react';
import { customerService } from '../services/customerService';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const PelangganPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCust, setSelectedCust] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '', member_tier: 'Regular', points: 0 });
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [custToDelete, setCustToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCustomers = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const res = await customerService.getCustomers(search);
    if (res.data) setCustomers(res.data);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const res = await customerService.getCustomers(search);
      if (isMounted) {
        if (res.data) setCustomers(res.data);
        setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [search]);

  const handleOpenAdd = () => {
    setSelectedCust(null);
    setFormData({ name: '', phone: '', email: '', address: '', member_tier: 'Regular', points: 0 });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (c) => {
    setSelectedCust(c);
    setFormData({
      name: c.name || '',
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      member_tier: c.member_tier || 'Regular',
      points: c.points || 0,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    let res;
    if (selectedCust) {
      res = await customerService.updateCustomer(selectedCust.id, formData);
    } else {
      res = await customerService.createCustomer(formData);
    }

    setSubmitting(false);

    if (res.error) {
      showToast(res.error.message || 'Gagal menyimpan data pelanggan.', 'error');
    } else {
      showToast(selectedCust ? 'Data pelanggan diperbarui.' : 'Pelanggan baru ditambahkan.');
      setIsFormOpen(false);
      fetchCustomers();
    }
  };

  const handleOpenDelete = (c) => {
    setCustToDelete(c);
    setIsDeleteOpen(true);
  };

  const executeDelete = async () => {
    if (!custToDelete) return;
    setDeleteLoading(true);
    const res = await customerService.deleteCustomer(custToDelete.id);
    setDeleteLoading(false);
    setIsDeleteOpen(false);

    if (res.error) {
      showToast(res.error.message || 'Gagal menghapus pelanggan.', 'error');
    } else {
      showToast('Pelanggan berhasil dihapus.');
      fetchCustomers();
    }
  };

  const getTierBadge = (tier) => {
    if (tier === 'Gold') {
      return <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-full text-[10px] uppercase">Gold Member</span>;
    }
    if (tier === 'Silver') {
      return <span className="px-2.5 py-0.5 bg-slate-200 text-slate-800 font-bold rounded-full text-[10px] uppercase">Silver Member</span>;
    }
    return <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-full text-[10px] uppercase">Regular</span>;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold text-white flex items-center space-x-2 animate-bounce ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Data Pelanggan, Tukang & Member
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Database kontak pelanggan tetap, kontraktor, serta poin loyalitas belanja
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Pelanggan</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari nama, telepon, alamat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchCustomers()}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          onClick={fetchCustomers}
          className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Customer Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center space-y-3">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">Belum Ada Pelanggan</h3>
          <p className="text-xs text-slate-500">Mulai catat pelanggan tetap atau kontraktor langganan Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c) => (
            <div
              key={c.id}
              className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{c.name}</h3>
                    <div className="mt-1">{getTierBadge(c.member_tier)}</div>
                  </div>
                  <div className="px-2.5 py-1 bg-indigo-50 text-indigo-800 rounded-xl text-[11px] font-bold flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    <span>{c.points || 0} Poin</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{c.phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{c.email || '-'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{c.address || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleOpenEdit(c)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleOpenDelete(c)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-xs flex items-center space-x-1 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {selectedCust ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap / Kontraktor *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bpk. Slamet Proyek"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. Handphone / WA</label>
                  <input
                    type="text"
                    placeholder="081234..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Member</label>
                  <select
                    value={formData.member_tier}
                    onChange={(e) => setFormData({ ...formData, member_tier: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Silver">Silver Member</option>
                    <option value="Gold">Gold Member</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email (Opsional)</label>
                <input
                  type="email"
                  placeholder="pelanggan@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Proyek / Rumah</label>
                <textarea
                  rows="2"
                  placeholder="Jl. Pemuda No..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl"
                >
                  {submitting ? 'Simpan...' : 'Simpan Pelanggan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={executeDelete}
        title="Hapus Pelanggan"
        message={`Apakah Anda yakin ingin menghapus data pelanggan "${custToDelete?.name}"?`}
        confirmText="Hapus"
        isDanger={true}
        loading={deleteLoading}
      />
    </div>
  );
};
