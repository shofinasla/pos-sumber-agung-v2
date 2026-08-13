import { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  Search,
  UserCheck,
  Building,
  CheckCircle2,
  DollarSign,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { debtService } from '../services/debtService';
import { Modal } from '../components/common/Modal';

export const HutangPage = () => {
  const [activeTab, setActiveTab] = useState('piutang'); // 'piutang' or 'hutang'
  const [piutangList, setPiutangList] = useState([]);
  const [hutangList, setHutangList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Payment Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    if (activeTab === 'piutang') {
      const { data } = await debtService.getPiutangList(search);
      setPiutangList(data || []);
    } else {
      const { data } = await debtService.getHutangList(search);
      setHutangList(data || []);
    }
    setLoading(false);
  }, [activeTab, search]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (activeTab === 'piutang') {
        const { data } = await debtService.getPiutangList(search);
        if (isMounted) setPiutangList(data || []);
      } else {
        const { data } = await debtService.getHutangList(search);
        if (isMounted) setHutangList(data || []);
      }
      if (isMounted) setLoading(false);
    };
    load();
    return () => { isMounted = false; };
  }, [activeTab, search]);

  const handleOpenPayModal = (item) => {
    setSelectedItem(item);
    setPaymentAmount(item.remaining_amount || '');
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedItem || !paymentAmount || Number(paymentAmount) <= 0) return;

    setSubmitting(true);
    if (activeTab === 'piutang') {
      await debtService.payPiutang(selectedItem.id, Number(paymentAmount));
    } else {
      await debtService.payHutang(selectedItem.id, Number(paymentAmount));
    }
    setSubmitting(false);
    setSelectedItem(null);
    fetchData();
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Piutang Stats
  const totalPiutang = piutangList.reduce((acc, p) => acc + Number(p.remaining_amount || 0), 0);
  const totalPiutangLunas = piutangList.reduce((acc, p) => acc + Number(p.paid_amount || 0), 0);

  // Hutang Stats
  const totalHutang = hutangList.reduce((acc, h) => acc + Number(h.remaining_amount || 0), 0);
  const totalHutangLunas = hutangList.reduce((acc, h) => acc + Number(h.paid_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Wallet className="w-7 h-7 text-rose-600" />
            Buku Hutang & Piutang
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pencatatan piutang bon proyek/tukang dan hutang tagihan ke supplier material TB. Sumber Agung.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab('piutang');
            setSearch('');
          }}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'piutang'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Piutang Pelanggan (Bon Proyek/Tukang)
        </button>
        <button
          onClick={() => {
            setActiveTab('hutang');
            setSearch('');
          }}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'hutang'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          Hutang Supplier (Tagihan Kulakan)
        </button>
      </div>

      {/* Summary Stats */}
      {activeTab === 'piutang' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold">Total Piutang Belum Tertagih</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">{formatRupiah(totalPiutang)}</h3>
            </div>
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold">Total Piutang Terbayar (Cicilan)</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{formatRupiah(totalPiutangLunas)}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold">Jumlah Pelanggan Nge-Bon</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{piutangList.length} Catatan</h3>
            </div>
            <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold">Total Hutang Ke Supplier</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{formatRupiah(totalHutang)}</h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
              <Building className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold">Total Tagihan Lunas</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{formatRupiah(totalHutangLunas)}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold">Jumlah Tagihan Kulakan</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{hutangList.length} Faktur</h3>
            </div>
            <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === 'piutang'
                ? 'Cari nama pelanggan / proyek...'
                : 'Cari supplier / nomor faktur...'
            }
            className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
        </div>
        <button
          onClick={fetchData}
          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
          title="Refresh Data"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* List Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Memuat data...</div>
        ) : activeTab === 'piutang' ? (
          piutangList.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <UserCheck className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-semibold text-slate-800">Tidak ada catatan piutang</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Semua bon pelanggan telah lunas atau belum ada catatan piutang baru.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Pelanggan / Proyek</th>
                    <th className="px-6 py-4">Catatan Bon</th>
                    <th className="px-6 py-4">Total Bon</th>
                    <th className="px-6 py-4">Sudah Dibayar</th>
                    <th className="px-6 py-4">Sisa Piutang</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {piutangList.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {p.customer_name}
                        {p.phone && p.phone !== '-' && (
                          <span className="block text-xs font-normal text-slate-400 mt-0.5">
                            {p.phone}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">
                        {p.notes || '-'}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {formatRupiah(p.total_amount)}
                      </td>
                      <td className="px-6 py-4 text-emerald-600 font-semibold">
                        {formatRupiah(p.paid_amount)}
                      </td>
                      <td className="px-6 py-4 font-extrabold text-rose-600">
                        {formatRupiah(p.remaining_amount)}
                      </td>
                      <td className="px-6 py-4">
                        {p.remaining_amount === 0 ? (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                            LUNAS
                          </span>
                        ) : p.paid_amount > 0 ? (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
                            DICICIL
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-rose-50 text-rose-700 text-xs font-semibold rounded-full border border-rose-200">
                            BELUM BAYAR
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {p.remaining_amount > 0 && (
                          <button
                            onClick={() => handleOpenPayModal(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            Bayar Cicilan
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : hutangList.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Building className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-semibold text-slate-800">Tidak ada hutang supplier</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Semua tagihan pembelian ke supplier sudah lunas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Supplier</th>
                  <th className="px-6 py-4">No. Faktur</th>
                  <th className="px-6 py-4">Total Tagihan</th>
                  <th className="px-6 py-4">Sisa Hutang</th>
                  <th className="px-6 py-4">Jatuh Tempo</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hutangList.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900">{h.supplier_name}</td>
                    <td className="px-6 py-4 font-mono text-xs">{h.invoice_number}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {formatRupiah(h.total_amount)}
                    </td>
                    <td className="px-6 py-4 font-extrabold text-amber-600">
                      {formatRupiah(h.remaining_amount)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{h.due_date || '-'}</td>
                    <td className="px-6 py-4">
                      {h.remaining_amount === 0 ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                          LUNAS
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
                          HUTANG
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {h.remaining_amount > 0 && (
                        <button
                          onClick={() => handleOpenPayModal(h)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl transition"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          Pelunasan
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pay Modal */}
      <Modal
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        title={
          activeTab === 'piutang'
            ? `Pembayaran Piutang: ${selectedItem?.customer_name}`
            : `Pelunasan Hutang: ${selectedItem?.supplier_name}`
        }
      >
        {selectedItem && (
          <form onSubmit={handleProcessPayment} className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Nominal:</span>
                <span className="font-bold text-slate-900">
                  {formatRupiah(selectedItem.total_amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sudah Dibayar:</span>
                <span className="font-bold text-emerald-600">
                  {formatRupiah(selectedItem.paid_amount)}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="font-semibold text-slate-700">Sisa Harus Dibayar:</span>
                <span className="font-extrabold text-rose-600 text-sm">
                  {formatRupiah(selectedItem.remaining_amount)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nominal Pembayaran (Rp) *
              </label>
              <input
                type="number"
                required
                min="1000"
                max={selectedItem.remaining_amount}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-base font-bold text-slate-900 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Akan otomatis memperbarui sisa {activeTab === 'piutang' ? 'piutang' : 'hutang'}.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Pembayaran'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default HutangPage;
