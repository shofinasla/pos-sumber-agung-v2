import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Award, 
  Phone, 
  Mail, 
  Edit, 
  Trash2, 
  Gift, 
  X,
  CheckCircle2
} from 'lucide-react';
import { Customer } from '../types/pos';
import { formatRupiah, formatDateOnly } from '../utils/formatters';

interface CustomersTabProps {
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'points' | 'totalSpent' | 'memberTier' | 'joinedDate'>) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
}

export const CustomersTab: React.FC<CustomersTabProps> = ({
  customers,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', email: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({ name: c.name, phone: c.phone, email: c.email || '' });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Nama dan No. Telepon wajib diisi!');
      return;
    }

    if (editingCustomer) {
      onUpdateCustomer({
        ...editingCustomer,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
      });
    } else {
      onAddCustomer({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau no. HP pelanggan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
          />
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition flex items-center justify-center space-x-2 shadow-sm shadow-emerald-600/20"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pelanggan / Member</span>
        </button>
      </div>

      {/* Customer List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="font-medium text-slate-600">Belum ada pelanggan terdaftar.</p>
          </div>
        ) : (
          filteredCustomers.map((c) => {
            return (
              <div
                key={c.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-emerald-500 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{c.name}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      {c.phone}
                    </p>
                  </div>
                  
                  {/* Member Tier Badge */}
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      c.memberTier === 'Gold'
                        ? 'bg-amber-100 text-amber-800'
                        : c.memberTier === 'Silver'
                        ? 'bg-slate-200 text-slate-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    Member {c.memberTier}
                  </span>
                </div>

                {/* Loyalty Stats */}
                <div className="p-3 bg-slate-50 rounded-xl grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Poin Loyalitas</span>
                    <span className="font-black text-amber-600 text-sm flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5" />
                      {c.points} Poin
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Belanja</span>
                    <span className="font-bold text-slate-800 font-mono text-xs">
                      {formatRupiah(c.totalSpent)}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                  <span>Terdaftar: {formatDateOnly(c.joinedDate)}</span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                      title="Edit Member"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus data pelanggan "${c.name}"?`)) {
                          onDeleteCustomer(c.id);
                        }
                      }}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Hapus Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingCustomer ? 'Edit Data Pelanggan' : 'Pendaftaran Member Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Pelanggan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ibu Siti Rahmawati"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor HP / Whatsapp
                </label>
                <input
                  type="text"
                  required
                  placeholder="081234567890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Email (Opsional)
                </label>
                <input
                  type="email"
                  placeholder="email@domain.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-4 flex gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition"
                >
                  Simpan Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
