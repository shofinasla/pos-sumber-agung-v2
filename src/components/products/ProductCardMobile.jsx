import { Edit2, Power } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

export const ProductCardMobile = ({ product, onEdit, onToggleActive }) => {
  const isLowStock = product.stock > 0 && product.stock <= product.minimum_stock;
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
      {/* Header: Name & Status */}
      <div className="flex justify-between items-start gap-2">
        <div>
          <h4 className="font-bold text-slate-900 text-sm leading-tight">{product.name}</h4>
          <div className="flex items-center space-x-2 mt-1">
            <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
              SKU: {product.sku}
            </span>
            {product.categories?.name && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                {product.categories.name}
              </span>
            )}
          </div>
        </div>

        {/* Active Badge */}
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
            product.is_active
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          {product.is_active ? 'Aktif' : 'Non-Aktif'}
        </span>
      </div>

      {/* Pricing & Stock Details */}
      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-xs">
        <div>
          <span className="text-[10px] text-slate-500 block">Harga Jual</span>
          <span className="font-bold text-emerald-700 font-mono text-sm">
            {formatCurrency(product.selling_price)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Modal: {formatCurrency(product.cost_price)}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-500 block">Sisa Stok</span>
          <span
            className={`font-bold font-mono text-sm ${
              isOutOfStock
                ? 'text-rose-600'
                : isLowStock
                ? 'text-amber-600'
                : 'text-slate-900'
            }`}
          >
            {product.stock} {product.unit}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            Min: {product.minimum_stock} {product.unit}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-2 pt-1 border-t border-slate-100">
        <button
          onClick={() => onToggleActive(product)}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition ${
            product.is_active
              ? 'text-rose-600 hover:bg-rose-50'
              : 'text-emerald-600 hover:bg-emerald-50'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{product.is_active ? 'Nonaktifkan' : 'Aktifkan'}</span>
        </button>

        <button
          onClick={() => onEdit(product)}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition shadow-xs"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit</span>
        </button>
      </div>
    </div>
  );
};
