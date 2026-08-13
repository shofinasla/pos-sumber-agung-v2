// Format number to Indonesian Rupiah currency string (e.g. Rp 65.000)
export function formatCurrency(amount) {
  const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(numericAmount);
}

// Parse currency input back to plain number
export function parseCurrencyInput(value) {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const cleanStr = String(value).replace(/[^0-9,-]/g, '').replace(',', '.');
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : parsed;
}

// Format short date
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
