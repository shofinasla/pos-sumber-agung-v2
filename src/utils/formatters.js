// Format number to Indonesian Rupiah currency string
export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

// Format short date (e.g. 13 Agu 2026, 15:30)
export function formatDate(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// Format date only (e.g. 13/08/2026)
export function formatDateOnly(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

// Generate unique transaction invoice ID like TRX-20260813-0001
export function generateTransactionId(sequence) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const seqStr = String(sequence).padStart(4, '0');
  return `TRX-${year}${month}${day}-${seqStr}`;
}

// Building Material Categories for TB. Sumber Agung
export const PRODUCT_CATEGORIES = [
  'Semua',
  'Semen & Pasir',
  'Besi & Logam',
  'Cat & Coating',
  'Pipa & Plambing',
  'Kelistrikan & Alat',
  'Kayu & Triplek',
  'Atap & Plafon',
  'Keramik & Batu',
  'Lain-lain',
];

// Building Material Units (Satuan Toko Bangunan)
export const UNITS = [
  'PCS',
  'SAK',
  'BATANG',
  'KG',
  'METER',
  'LITER',
  'DOS',
  'KOTAK',
  'ROLL',
  'LEMBAR',
  'SET',
  'COLT',
  'M3'
];
