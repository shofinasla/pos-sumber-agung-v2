import { Product, Customer, Transaction, Shift } from '../types/pos';
import { INITIAL_PRODUCTS, INITIAL_CUSTOMERS, INITIAL_TRANSACTIONS, INITIAL_SHIFT } from '../data/initialData';

const STORAGE_KEYS = {
  PRODUCTS: 'pos_sumber_agung_products',
  CUSTOMERS: 'pos_sumber_agung_customers',
  TRANSACTIONS: 'pos_sumber_agung_transactions',
  SHIFT: 'pos_sumber_agung_shift',
  CASHIER: 'pos_sumber_agung_cashier_name',
};

export const StorageService = {
  getProducts(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return data ? JSON.parse(data) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  },

  saveProducts(products: Product[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error('Failed to save products to localStorage', e);
    }
  },

  getCustomers(): Customer[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      return data ? JSON.parse(data) : INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  },

  saveCustomers(customers: Customer[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    } catch (e) {
      console.error('Failed to save customers to localStorage', e);
    }
  },

  getTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  },

  saveTransactions(transactions: Transaction[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save transactions to localStorage', e);
    }
  },

  getShift(): Shift {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SHIFT);
      return data ? JSON.parse(data) : INITIAL_SHIFT;
    } catch {
      return INITIAL_SHIFT;
    }
  },

  saveShift(shift: Shift): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SHIFT, JSON.stringify(shift));
    } catch (e) {
      console.error('Failed to save shift to localStorage', e);
    }
  },

  getCashierName(): string {
    return localStorage.getItem(STORAGE_KEYS.CASHIER) || 'Budi (Kasir 1)';
  },

  setCashierName(name: string): void {
    localStorage.setItem(STORAGE_KEYS.CASHIER, name);
  },

  resetAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.SHIFT);
    localStorage.removeItem(STORAGE_KEYS.CASHIER);
  }
};
