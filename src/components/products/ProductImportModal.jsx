import { useState } from 'react';
import { FileText, Upload, AlertCircle, CheckCircle2, Loader2, Download, Table } from 'lucide-react';
import { Modal } from '../common/Modal';
import { formatCurrency } from '../../utils/formatCurrency';

export const ProductImportModal = ({ isOpen, onClose, onImport, categories = [] }) => {
  const [step, setStep] = useState('upload'); // 'upload', 'preview', 'summary'
  const [file, setFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importSummary, setImportSummary] = useState(null);

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setParsedRows([]);
    setParseErrors([]);
    setLoading(false);
    setImportSummary(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Helper to parse CSV line with ';' delimiter
  const parseCSVContent = (text) => {
    const lines = text.split(/\r\n|\n/).filter((l) => l.trim() !== '');
    if (lines.length < 2) {
      throw new Error('File CSV kosong atau tidak memiliki baris data.');
    }

    // Determine delimiter (default ;)
    const headerLine = lines[0];
    const delimiter = headerLine.includes(';') ? ';' : ',';

    const headers = headerLine.split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''));

    const rows = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ''));
      const rowObj = {};

      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] !== undefined ? values[idx] : '';
      });

      const productName = rowObj['Produk'] || rowObj['Nama Produk'] || rowObj['name'];
      if (!productName) {
        errors.push(`Baris ${i + 1}: Nama Produk kosong`);
      }

      rows.push(rowObj);
    }

    return { rows, errors };
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const { rows, errors } = parseCSVContent(text);
        setParsedRows(rows);
        setParseErrors(errors);
        setStep('preview');
      } catch (err) {
        setParseErrors([err.message || 'Gagal membaca berkas CSV.']);
      }
    };

    reader.readAsText(selectedFile);
  };

  const handleExecuteImport = async () => {
    setLoading(true);

    // Build category mapping (lowercase category name -> id)
    const categoryMap = {};
    categories.forEach((c) => {
      categoryMap[c.name.trim().toLowerCase()] = c.id;
    });

    const summary = await onImport(parsedRows, categoryMap);

    setImportSummary(summary);
    setLoading(false);
    setStep('summary');
  };

  const downloadSampleTemplate = () => {
    const header = 'Produk;Harga Pokok;Harga Jual;Stok;Grup Produk;Satuan;Barcode;Kode Produk;Non Stok\n';
    const sampleRows = [
      'Semen Gresik 40kg;58000;65000;100;Semen & Pasir;SAK;899123456101;SMN-GRS-40;Tidak',
      'Besi Beton 10mm SNI;65000;75000;50;Besi & Logam;BATANG;899123456102;BSI-BTN-10;Tidak',
      'Cat Nippon Paint 5kg;115000;135000;20;Cat & Coating;DOS;899123456103;CAT-NPP-05;Tidak',
    ].join('\n');

    const blob = new Blob([header + sampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_import_produk_sumber_agung.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Katalog Produk dari Berkas CSV"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs">
          <div className="flex items-center space-x-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                step === 'upload' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              1
            </span>
            <span className="font-semibold text-slate-800">Unggah CSV</span>
          </div>

          <div className="w-8 h-px bg-slate-300" />

          <div className="flex items-center space-x-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                step === 'preview' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              2
            </span>
            <span className="font-semibold text-slate-800">Pratinjau & Validasi</span>
          </div>

          <div className="w-8 h-px bg-slate-300" />

          <div className="flex items-center space-x-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                step === 'summary' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              3
            </span>
            <span className="font-semibold text-slate-800">Ringkasan Hasil</span>
          </div>
        </div>

        {/* STEP 1: UPLOAD */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Format Berkas CSV
                </h4>
                <p className="text-[11px] text-slate-500">
                  Gunakan pemisah titik koma (<code className="font-bold text-slate-800">;</code>) dengan kolom:
                  <br />
                  <code className="text-[10px] text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded">
                    Produk;Harga Pokok;Harga Jual;Stok;Grup Produk;Satuan;Barcode;Kode Produk
                  </code>
                </p>
              </div>

              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Template CSV</span>
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/30 rounded-3xl p-8 text-center transition cursor-pointer relative">
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="w-12 h-12 bg-white text-emerald-600 rounded-2xl shadow-xs flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <h5 className="font-bold text-slate-900 text-sm">Pilih atau Seret Berkas CSV ke Sini</h5>
              <p className="text-xs text-slate-500 mt-1">Format file .csv (Maksimal 2.000 baris per import)</p>
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW & VALIDATION */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="text-xs">
                <span className="font-bold text-slate-900">{parsedRows.length} Produk</span> ditemukan dalam file{' '}
                <span className="font-semibold text-emerald-700">{file?.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Ganti Berkas
              </button>
            </div>

            {parseErrors.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Peringatan Validasi Awal:</span>
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                  {parseErrors.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {parseErrors.length > 5 && (
                    <li>...dan {parseErrors.length - 5} kesalahan lainnya.</li>
                  )}
                </ul>
              </div>
            )}

            {/* Table Preview */}
            <div className="border border-slate-200 rounded-2xl overflow-x-auto max-h-60 custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="p-2.5">No</th>
                    <th className="p-2.5">SKU</th>
                    <th className="p-2.5">Nama Produk</th>
                    <th className="p-2.5">Kategori</th>
                    <th className="p-2.5">Stok</th>
                    <th className="p-2.5">Harga Pokok</th>
                    <th className="p-2.5">Harga Jual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.slice(0, 15).map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-2.5 font-mono font-bold text-slate-800">
                        {row['Kode Produk'] || row['SKU'] || '-'}
                      </td>
                      <td className="p-2.5 font-semibold text-slate-900">
                        {row['Produk'] || row['Nama Produk'] || '-'}
                      </td>
                      <td className="p-2.5 text-slate-600">{row['Grup Produk'] || row['Kategori'] || '-'}</td>
                      <td className="p-2.5 font-mono text-slate-900">{row['Stok'] || 0}</td>
                      <td className="p-2.5 font-mono text-slate-600">
                        {formatCurrency(row['Harga Pokok'] || 0)}
                      </td>
                      <td className="p-2.5 font-mono font-bold text-emerald-700">
                        {formatCurrency(row['Harga Jual'] || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedRows.length > 15 && (
                <div className="p-2 bg-slate-50 text-center text-[11px] text-slate-500 font-medium">
                  Menampilkan 15 dari {parsedRows.length} produk...
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={loading || parsedRows.length === 0}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses Import Data...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Konfirmasi Import ({parsedRows.length} Produk)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUMMARY */}
        {step === 'summary' && importSummary && (
          <div className="space-y-4">
            <div className="text-center space-y-2 py-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Proses Import Selesai</h4>
              <p className="text-xs text-slate-500">
                Berikut adalah ringkasan hasil pemprosesan file CSV produk Anda.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <span className="block text-2xl font-black text-emerald-700 font-mono">
                  {importSummary.successCount}
                </span>
                <span className="text-[11px] font-bold text-emerald-800">Berhasil Dibuat</span>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                <span className="block text-2xl font-black text-amber-700 font-mono">
                  {importSummary.duplicateCount}
                </span>
                <span className="text-[11px] font-bold text-amber-800">Duplikat Dilewati</span>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl">
                <span className="block text-2xl font-black text-rose-700 font-mono">
                  {importSummary.failCount}
                </span>
                <span className="text-[11px] font-bold text-rose-800">Gagal / Invalid</span>
              </div>
            </div>

            {importSummary.errors.length > 0 && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <h5 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-slate-600" />
                  Rincian Error / Catatan Baris:
                </h5>
                <div className="max-h-36 overflow-y-auto space-y-1 text-[11px] text-slate-600 pr-2">
                  {importSummary.errors.map((err, i) => (
                    <div key={i} className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="font-semibold text-slate-900">Baris {err.row}</span>
                      <span className="text-rose-600 font-medium">{err.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
