import { Trash2, Plus, Minus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

export const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  const isMaxStock = item.quantity >= item.stock;

  const handleInputChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      onUpdateQuantity(item.product_id, val);
    } else if (e.target.value === '') {
      onUpdateQuantity(item.product_id, 0);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl flex items-center justify-between gap-2 group hover:border-slate-300 transition-all">
      {/* Product Detail Info */}
      <div className="flex-1 min-w-0">
        <h5 className="font-bold text-slate-800 text-xs sm:text-sm truncate">
          {item.name}
        </h5>
        <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
          <span>{formatCurrency(item.selling_price)} / {item.unit}</span>
          {item.sku && <span className="font-mono text-slate-400">• {item.sku}</span>}
        </div>
      </div>

      {/* Quantity Selector & Item Subtotal */}
      <div className="flex items-center space-x-3 shrink-0">
        {/* Quantity Controls */}
        <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
            title="Kurangi Quantity"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <input
            type="number"
            min="1"
            max={item.stock}
            value={item.quantity}
            onChange={handleInputChange}
            className="w-10 h-7 text-center font-bold text-xs text-slate-800 focus:outline-none focus:bg-slate-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            disabled={isMaxStock}
            onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            title={isMaxStock ? 'Stok Maksimum Tercapai' : 'Tambah Quantity'}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Subtotal Item */}
        <div className="w-20 text-right font-extrabold text-xs sm:text-sm text-slate-800">
          {formatCurrency(item.subtotal)}
        </div>

        {/* Delete Button */}
        <button
          type="button"
          onClick={() => onRemove(item.product_id)}
          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
          title="Hapus dari Keranjang"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
