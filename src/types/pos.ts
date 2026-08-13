export interface Product {
  id: string;
  code: string; // Barcode / SKU
  name: string;
  category: string;
  costPrice: number; // Harga Beli
  price: number;     // Harga Jual
  stock: number;
  minStock: number;
  unit: string;      // pcs, kg, pouch, botol, etc.
  image?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number; // Discount in Rp
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  points: number;
  totalSpent: number;
  memberTier: 'Regular' | 'Silver' | 'Gold';
  joinedDate: string;
}

export interface TransactionItem {
  productId: string;
  code: string;
  name: string;
  price: number;
  costPrice: number;
  quantity: number;
  unit: string;
  discount: number;
  subtotal: number;
}

export interface Transaction {
  id: string; // e.g. SA-20260813-0001
  date: string; // ISO string
  items: TransactionItem[];
  subtotal: number;
  discountTotal: number;
  tax: number;
  grandTotal: number;
  profit: number;
  paymentMethod: 'cash' | 'qris' | 'debit' | 'transfer';
  cashPaid: number;
  change: number;
  customerId?: string;
  customerName?: string;
  cashierName: string;
  notes?: string;
  status: 'completed' | 'voided';
}

export interface Shift {
  id: string;
  cashierName: string;
  startTime: string; // ISO string
  endTime: string | null;
  initialCash: number;
  expectedCash: number;
  actualCash: number | null;
  totalSales: number;
  totalTransactions: number;
  status: 'open' | 'closed';
}

export type ActiveTab = 'cashier' | 'inventory' | 'transactions' | 'reports' | 'customers' | 'settings';
