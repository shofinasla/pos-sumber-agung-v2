import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Barcode, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  UserPlus, 
  CreditCard, 
  QrCode, 
  Banknote, 
  ArrowRight, 
  AlertCircle,
  Tag,
  Check,
  Package,
  X
} from 'lucide-react';
import { Product, CartItem, Customer, Transaction } from '../types/pos';
import { PRODUCT_CATEGORIES, formatRupiah, generateTransactionId } from '../utils/formatters';

interface CashierTabProps {
  products: Product[];
  customers: Customer[];
  cashierName: string;
  onCompleteSale: (transaction: Transaction) => void;
  onOpenReceipt: (transaction: Transaction) => void;
}

export const CashierTab: React.FC<CashierTabProps> = ({
  products,
  customers,
  cashierName,
  onCompleteSale,
  onOpenReceipt,
}) => {
  // State for Catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [barcodeInput, setBarcodeInput] = useState('');

  // State for Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // State for Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'debit' | 'transfer'>('cash');
  const [cashPaidInput, setCashPaidInput] = useState<string>('');

  // Filter products by category and search term
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchesCategory =
        selectedCategory === 'Semua' || prod.category === selectedCategory;
      const matchesQuery =
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [cart]);

  const totalDiscount = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.discount || 0), 0);
  }, [cart]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - totalDiscount);
  }, [subtotal, totalDiscount]);

  const totalItemsCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  // Add Product to Cart
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;

    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex((item) => item.product.id === product.id);
      if (existingIdx > -1) {
        const existingItem = prevCart[existingIdx];
        if (existingItem.quantity >= product.stock) {
          return prevCart; // Exceeded stock
        }
        const updated = [...prevCart];
        updated[existingIdx] = {
          ...existingItem,
          quantity: existingItem.quantity + 1,
        };
        return updated;
      }
      return [...prevCart, { product, quantity: 1, discount: 0 }];
    });
  };

  // Update Item Quantity
  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock) return item; // Exceed stock limit
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // Update Item Discount
  const updateDiscount = (productId: string, discountRp: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId
          ? { ...item, discount: Math.max(0, discountRp) }
          : item
      )
    );
  };

  // Remove Item
  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  // Barcode Scanner Handler
  const handleBarcodeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const match = products.find(
      (p) => p.code.toLowerCase() === barcodeInput.trim().toLowerCase()
    );
    if (match) {
      addToCart(match);
      setBarcodeInput('');
    } else {
      alert(`Produk dengan barcode "${barcodeInput}" tidak ditemukan.`);
    }
  };

  // Quick Random Barcode Scan Simulator
  const simulateBarcodeScan = () => {
    if (products.length === 0) return;
    const randomProd = products[Math.floor(Math.random() * products.length)];
    addToCart(randomProd);
  };

  // Open Payment Modal
  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setCashPaidInput(grandTotal.toString());
    setIsPaymentModalOpen(true);
  };

  // Complete Payment & Process Sale
  const handleFinalizeSale = () => {
    const numericCashPaid = Number(cashPaidInput) || 0;
    if (paymentMethod === 'cash' && numericCashPaid < grandTotal) {
      alert('Uang yang dibayarkan kurang dari Total Belanja!');
      return;
    }

    const selectedCust = customers.find((c) => c.id === selectedCustomerId);

    // Calculate profit
    let totalProfit = 0;
    const transactionItems = cart.map((item) => {
      const itemSubtotal = item.product.price * item.quantity - item.discount;
      const itemCostTotal = item.product.costPrice * item.quantity;
      totalProfit += itemSubtotal - itemCostTotal;

      return {
        productId: item.product.id,
        code: item.product.code,
        name: item.product.name,
        price: item.product.price,
        costPrice: item.product.costPrice,
        quantity: item.quantity,
        unit: item.product.unit,
        discount: item.discount,
        subtotal: itemSubtotal,
      };
    });

    const newTransaction: Transaction = {
      id: generateTransactionId(Math.floor(1000 + Math.random() * 9000)),
      date: new Date().toISOString(),
      items: transactionItems,
      subtotal,
      discountTotal: totalDiscount,
      tax: 0,
      grandTotal,
      profit: Math.max(0, totalProfit),
      paymentMethod,
      cashPaid: paymentMethod === 'cash' ? numericCashPaid : grandTotal,
      change: paymentMethod === 'cash' ? Math.max(0, numericCashPaid - grandTotal) : 0,
      customerId: selectedCust?.id,
      customerName: selectedCust?.name,
      cashierName,
      status: 'completed',
    };

    onCompleteSale(newTransaction);
    setIsPaymentModalOpen(false);
    setCart([]);
    setSelectedCustomerId('');
    onOpenReceipt(newTransaction);
  };

  const cashPaidVal = Number(cashPaidInput) || 0;
  const changeAmount = Math.max(0, cashPaidVal - grandTotal);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6 max-w-7xl mx-auto">
      
      {/* Left Column: Product Search & Catalog Grid (7 cols) */}
      <div className="lg:col-span-7 space-y-4">
        
        {/* Search & Barcode Scan Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            
            {/* Name Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama atau barcode produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Barcode Scanner Input */}
            <form onSubmit={handleBarcodeSearch} className="flex gap-2">
              <div className="relative">
                <Barcode className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Scan Barcode..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-36 pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
              </div>
              <button
                type="button"
                onClick={simulateBarcodeScan}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-3 py-2 rounded-xl font-medium transition flex items-center space-x-1 shrink-0"
                title="Simulasi scan produk acak"
              >
                <Barcode className="w-4 h-4" />
                <span className="hidden sm:inline">Scan</span>
              </button>
            </form>

          </div>

          {/* Category Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {PRODUCT_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Catalog Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="font-medium">Produk tidak ditemukan</p>
              <p className="text-xs text-slate-400 mt-1">Coba ubah katagori atau kata kunci pencarian</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const isLowStock = product.stock > 0 && product.stock <= product.minStock;
              const isOutOfStock = product.stock <= 0;

              return (
                <button
                  key={product.id}
                  disabled={isOutOfStock}
                  onClick={() => addToCart(product)}
                  className={`bg-white p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between group relative overflow-hidden ${
                    isOutOfStock
                      ? 'opacity-60 border-slate-200 bg-slate-50 cursor-not-allowed'
                      : 'border-slate-200 hover:border-emerald-500 hover:shadow-md active:scale-[0.98]'
                  }`}
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {product.category}
                      </span>
                      {isOutOfStock ? (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                          Habis
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <AlertCircle className="w-3 h-3" />
                          Sisa {product.stock}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          Stok: {product.stock} {product.unit}
                        </span>
                      )}
                    </div>

                    {/* Product Name */}
                    <h4 className="font-semibold text-slate-900 text-sm line-clamp-2 leading-tight group-hover:text-emerald-700">
                      {product.name}
                    </h4>
                  </div>

                  {/* Price & Action */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-emerald-600 text-sm">
                        {formatRupiah(product.price)}
                      </p>
                      <p className="text-[10px] text-slate-400">/ {product.unit}</p>
                    </div>
                    {!isOutOfStock && (
                      <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
                        <Plus className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

      </div>

      {/* Right Column: Shopping Cart & Register Terminal (5 cols) */}
      <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between overflow-hidden">
        
        {/* Cart Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Keranjang Belanja</h3>
            <span className="bg-slate-800 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-mono">
              {totalItemsCount} item
            </span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium transition flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan</span>
            </button>
          )}
        </div>

        {/* Customer Selection */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">-- Tanpa Member / Pelanggan Umum --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.memberTier} - Poin: {c.points})
              </option>
            ))}
          </select>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 p-4 overflow-y-auto max-h-[360px] space-y-3 divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium text-slate-500">Keranjang masih kosong</p>
              <p className="text-xs text-slate-400 mt-1">Pilih produk di sebelah kiri untuk menambah ke keranjang</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="pt-3 first:pt-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-2">
                    <h5 className="font-semibold text-slate-800 text-xs leading-snug">
                      {item.product.name}
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      {formatRupiah(item.product.price)} / {item.product.unit}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-slate-300 hover:text-rose-500 p-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Controls: Quantity + Item Discount */}
                <div className="flex items-center justify-between mt-2 pt-1">
                  
                  {/* Quantity Adjustment */}
                  <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-6 h-6 bg-white hover:bg-slate-200 text-slate-700 rounded flex items-center justify-center text-xs font-bold shadow-xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-slate-800 font-mono">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="w-6 h-6 bg-white hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded flex items-center justify-center text-xs font-bold shadow-xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Subtotal Item */}
                  <div className="text-right">
                    <p className="font-bold text-slate-900 text-xs">
                      {formatRupiah(item.product.price * item.quantity - item.discount)}
                    </p>
                    {item.discount > 0 && (
                      <p className="text-[10px] text-rose-500 font-medium">
                        Diskon: -{formatRupiah(item.discount)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Subtotal</span>
            <span className="font-medium text-slate-800">{formatRupiah(subtotal)}</span>
          </div>

          {totalDiscount > 0 && (
            <div className="flex justify-between text-xs text-rose-600">
              <span>Total Diskon</span>
              <span className="font-semibold">-{formatRupiah(totalDiscount)}</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
            <span className="font-bold text-slate-900 text-sm">TOTAL BAYAR</span>
            <span className="font-black text-emerald-600 text-2xl tracking-tight">
              {formatRupiah(grandTotal)}
            </span>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={handleOpenPayment}
            className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 text-sm transition active:scale-[0.99]"
          >
            <span>PROSES PEMBAYARAN</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Pembayaran Transaksi</h3>
                <p className="text-xs text-slate-400">Toko Sumber Agung</p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              
              {/* Total Display */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                  Total Tagihan
                </p>
                <p className="text-3xl font-black text-emerald-700 mt-1">
                  {formatRupiah(grandTotal)}
                </p>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'cash', label: 'Tunai', icon: <Banknote className="w-4 h-4" /> },
                    { id: 'qris', label: 'QRIS', icon: <QrCode className="w-4 h-4" /> },
                    { id: 'debit', label: 'Debit', icon: <CreditCard className="w-4 h-4" /> },
                    { id: 'transfer', label: 'Transfer', icon: <CreditCard className="w-4 h-4" /> },
                  ].map((method) => {
                    const active = paymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                          active
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {method.icon}
                        <span>{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash Calculation Section */}
              {paymentMethod === 'cash' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nominal Uang Diterima (Rp)
                    </label>
                    <input
                      type="number"
                      value={cashPaidInput}
                      onChange={(e) => setCashPaidInput(e.target.value)}
                      placeholder="Masukkan nominal uang..."
                      className="w-full text-xl font-bold p-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                    />
                  </div>

                  {/* Preset Money Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCashPaidInput(grandTotal.toString())}
                      className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition"
                    >
                      Uang Pas
                    </button>
                    {[10000, 20000, 50000, 100000, 200000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashPaidInput(amt.toString())}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition"
                      >
                        {formatRupiah(amt)}
                      </button>
                    ))}
                  </div>

                  {/* Change Calculation */}
                  <div className="p-3 bg-slate-100 rounded-xl flex justify-between items-center text-sm font-bold">
                    <span className="text-slate-600">Kembalian:</span>
                    <span
                      className={
                        cashPaidVal < grandTotal ? 'text-rose-600' : 'text-emerald-600 text-lg'
                      }
                    >
                      {cashPaidVal < grandTotal
                        ? `Kurang ${formatRupiah(grandTotal - cashPaidVal)}`
                        : formatRupiah(changeAmount)}
                    </span>
                  </div>
                </div>
              )}

              {/* QRIS / Non-Cash Info Banner */}
              {paymentMethod !== 'cash' && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                  <QrCode className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-xs text-slate-600">
                    Pastikan pembayaran senilai <strong className="text-slate-900">{formatRupiah(grandTotal)}</strong> via {paymentMethod.toUpperCase()} telah terkonfirmasi.
                  </p>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="flex-1 py-2.5 px-4 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-medium text-sm transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={paymentMethod === 'cash' && cashPaidVal < grandTotal}
                onClick={handleFinalizeSale}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm transition shadow-md shadow-emerald-600/20"
              >
                SELESAIKAN TRANSAKSI
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
