import React, { useState } from 'react';
import { DollarSign, Clock, CheckCircle2, AlertCircle, X, ShieldAlert } from 'lucide-react';
import { Shift } from '../types/pos';
import { formatRupiah, formatDate } from '../utils/formatters';

interface ShiftModalProps {
  shift: Shift;
  onClose: () => void;
  onUpdateShift: (shift: Shift) => void;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({ shift, onClose, onUpdateShift }) => {
  const [actualCashInput, setActualCashInput] = useState<string>(
    shift.expectedCash.toString()
  );

  const handleCloseShift = () => {
    const numericActual = Number(actualCashInput) || 0;
    const updated: Shift = {
      ...shift,
      endTime: new Date().toISOString(),
      actualCash: numericActual,
      status: 'closed',
    };
    onUpdateShift(updated);
    alert('Shift Kasir berhasil ditutup.');
    onClose();
  };

  const handleReopenShift = () => {
    const updated: Shift = {
      id: `shift-${Date.now()}`,
      cashierName: shift.cashierName,
      startTime: new Date().toISOString(),
      endTime: null,
      initialCash: 500000,
      expectedCash: 500000,
      actualCash: null,
      totalSales: 0,
      totalTransactions: 0,
      status: 'open',
    };
    onUpdateShift(updated);
    alert('Shift Kasir baru berhasil dibuka.');
    onClose();
  };

  const actualVal = Number(actualCashInput) || 0;
  const variance = actualVal - shift.expectedCash;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Kelola Shift & Kasir Register</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-slate-800">
          
          {/* Status Badge */}
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Status Shift</span>
              <span className="font-bold text-slate-900">{shift.cashierName}</span>
            </div>
            <span
              className={`px-3 py-1 rounded-full font-bold text-xs ${
                shift.status === 'open'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {shift.status === 'open' ? 'Shift Aktif / Buka' : 'Shift Ditutup'}
            </span>
          </div>

          {/* Shift Metrics */}
          <div className="space-y-2 text-xs divide-y divide-slate-100">
            <div className="flex justify-between py-1 text-slate-600">
              <span>Waktu Buka Shift</span>
              <span className="font-medium text-slate-900">{formatDate(shift.startTime)}</span>
            </div>
            {shift.endTime && (
              <div className="flex justify-between py-1 text-slate-600">
                <span>Waktu Tutup Shift</span>
                <span className="font-medium text-slate-900">{formatDate(shift.endTime)}</span>
              </div>
            )}
            <div className="flex justify-between py-1 text-slate-600">
              <span>Kas Awal (Modal Tunai)</span>
              <span className="font-semibold text-slate-900 font-mono">
                {formatRupiah(shift.initialCash)}
              </span>
            </div>
            <div className="flex justify-between py-1 text-slate-600">
              <span>Penjualan Shift Ini</span>
              <span className="font-semibold text-emerald-600 font-mono">
                {formatRupiah(shift.totalSales)} ({shift.totalTransactions} Transaksi)
              </span>
            </div>
            <div className="flex justify-between py-2 text-sm font-bold text-slate-900">
              <span>Ekspektasi Uang Kas di Laci</span>
              <span className="text-emerald-700 font-mono">
                {formatRupiah(shift.expectedCash)}
              </span>
            </div>
          </div>

          {/* Close Shift Audit Input */}
          {shift.status === 'open' ? (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hasil Hitung Uang Fisik Kas Laci (Audit)
                </label>
                <input
                  type="number"
                  value={actualCashInput}
                  onChange={(e) => setActualCashInput(e.target.value)}
                  className="w-full text-xl font-bold p-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              {/* Selisih Indicator */}
              <div
                className={`p-3 rounded-xl text-xs font-bold flex justify-between items-center ${
                  variance === 0
                    ? 'bg-emerald-50 text-emerald-800'
                    : variance < 0
                    ? 'bg-rose-50 text-rose-800'
                    : 'bg-blue-50 text-blue-800'
                }`}
              >
                <span>Selisih Fisik Kas:</span>
                <span className="font-mono text-sm">
                  {variance === 0 ? 'Sesuai (Rp 0)' : formatRupiah(variance)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCloseShift}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition shadow-md"
              >
                TUTUP SHIFT SEKARANG
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={handleReopenShift}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow-md shadow-emerald-600/20"
              >
                BUKA SHIFT BARU
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
