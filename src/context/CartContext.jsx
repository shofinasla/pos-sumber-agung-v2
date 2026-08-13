import { useState, useMemo, useCallback } from 'react';
import { CartContext } from './CartContextObject';

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null); // null = Pelanggan Umum
  const [cartDiscount, setCartDiscount] = useState(0); // Diskon nominal transaksi
  const [notes, setNotes] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Helper untuk menampilkan notifikasi toast sederhana
  const showToast = useCallback((message, type = 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Menambahkan produk ke keranjang
  const addToCart = useCallback((product, qtyToAdd = 1) => {
    if (!product || !product.id) return;

    const availableStock = Number(product.stock) || 0;
    
    if (availableStock <= 0) {
      showToast(`Stok "${product.name}" habis.`, 'error');
      return false;
    }

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.product_id === product.id);

      if (existingIndex > -1) {
        const currentQty = prevItems[existingIndex].quantity;
        const newQty = currentQty + qtyToAdd;

        if (newQty > availableStock) {
          showToast(`Stok tidak mencukupi. Stok tersedia: ${availableStock}, Jumlah diminta: ${newQty}`, 'error');
          return prevItems;
        }

        const updated = [...prevItems];
        const sellingPrice = Number(product.selling_price) || 0;
        const itemDiscount = updated[existingIndex].discount || 0;

        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          subtotal: Math.max(0, (sellingPrice - itemDiscount) * newQty),
        };
        showToast(`+${qtyToAdd} "${product.name}" ditambahkan ke keranjang.`, 'success');
        return updated;
      } else {
        if (qtyToAdd > availableStock) {
          showToast(`Stok tidak mencukupi. Stok tersedia: ${availableStock}, Jumlah diminta: ${qtyToAdd}`, 'error');
          return prevItems;
        }

        const sellingPrice = Number(product.selling_price) || 0;
        const costPrice = Number(product.cost_price) || 0;
        const newItem = {
          product_id: product.id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          quantity: qtyToAdd,
          unit: product.unit || 'PCS',
          cost_price: costPrice,
          selling_price: sellingPrice,
          discount: 0,
          subtotal: sellingPrice * qtyToAdd,
          stock: availableStock,
        };
        showToast(`"${product.name}" ditambahkan ke keranjang.`, 'success');
        return [...prevItems, newItem];
      }
    });

    return true;
  }, [showToast]);

  // Mengubah quantity produk secara manual
  const updateQuantity = useCallback((productId, newQty) => {
    const qty = Number(newQty);
    if (isNaN(qty) || qty <= 0) {
      // Jika quantity 0 atau negatif, hapus item dari keranjang
      setItems((prevItems) => prevItems.filter((item) => item.product_id !== productId));
      return;
    }

    setItems((prevItems) => {
      return prevItems.map((item) => {
        if (item.product_id === productId) {
          if (qty > item.stock) {
            showToast(`Stok tidak mencukupi. Stok tersedia: ${item.stock}, Jumlah diminta: ${qty}`, 'error');
            return item;
          }
          const price = item.selling_price || 0;
          const disc = item.discount || 0;
          return {
            ...item,
            quantity: qty,
            subtotal: Math.max(0, (price - disc) * qty),
          };
        }
        return item;
      });
    });
  }, [showToast]);

  // Menghapus 1 produk dari keranjang
  const removeFromCart = useCallback((productId) => {
    setItems((prevItems) => prevItems.filter((item) => item.product_id !== productId));
  }, []);

  // Mengosongkan seluruh keranjang
  const clearCart = useCallback(() => {
    setItems([]);
    setCartDiscount(0);
    setSelectedCustomer(null);
    setNotes('');
  }, []);

  // Menentukan diskon transaksi
  const updateCartDiscount = useCallback((discountAmount) => {
    const val = Math.max(0, Number(discountAmount) || 0);
    setCartDiscount(val);
  }, []);

  // Kalkulasi total
  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + (Number(item.selling_price) * Number(item.quantity)), 0);
  }, [items]);

  const itemDiscounts = useMemo(() => {
    return items.reduce((acc, item) => acc + (Number(item.discount || 0) * Number(item.quantity)), 0);
  }, [items]);

  const total = useMemo(() => {
    const calc = subtotal - itemDiscounts - cartDiscount;
    return Math.max(0, calc);
  }, [subtotal, itemDiscounts, cartDiscount]);

  const itemCount = useMemo(() => {
    return items.reduce((acc, item) => acc + Number(item.quantity), 0);
  }, [items]);

  const value = {
    items,
    selectedCustomer,
    cartDiscount,
    notes,
    subtotal,
    itemDiscounts,
    total,
    itemCount,
    toastMessage,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    setCartDiscount: updateCartDiscount,
    setSelectedCustomer,
    setNotes,
    showToast,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
