import { useState } from 'react';
import { Plus, Search, Layers, Edit2, Trash2, AlertCircle, RefreshCw, FolderPlus } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { categoryService } from '../services/categoryService';
import { CategoryFormModal } from '../components/categories/CategoryFormModal';
import { ConfirmModal } from '../components/common/ConfirmModal';

export function KategoriPage() {
  const { categories, loading, error, search, setSearch, refreshCategories } = useCategories();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenAdd = () => {
    setSelectedCategory(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (category) => {
    setSelectedCategory(category);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    let res;
    if (selectedCategory) {
      res = await categoryService.updateCategory(selectedCategory.id, formData);
    } else {
      res = await categoryService.createCategory(formData);
    }

    if (res.error) {
      return { error: res.error };
    }

    showToast(
      selectedCategory ? 'Kategori berhasil diperbarui.' : 'Kategori baru berhasil ditambahkan.'
    );
    refreshCategories();
    return { error: null };
  };

  const handleConfirmDelete = (category) => {
    setCategoryToDelete(category);
    setIsConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!categoryToDelete) return;
    setDeleteLoading(true);

    const { error: err } = await categoryService.deleteCategory(categoryToDelete.id);
    setDeleteLoading(false);
    setIsConfirmOpen(false);

    if (err) {
      showToast(err.message || 'Gagal menghapus kategori.', 'error');
    } else {
      showToast('Kategori berhasil dihapus.');
      refreshCategories();
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold text-white flex items-center space-x-2 animate-bounce ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-emerald-600" />
            Manajemen Kategori Material
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola pengelompokan material toko bangunan untuk memudahkan klasifikasi produk POS
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kategori</span>
        </button>
      </div>

      {/* Search & Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari kategori material..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          onClick={refreshCategories}
          className="p-2 hover:bg-slate-100 text-slate-500 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold self-end sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Muat Ulang</span>
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={refreshCategories}
            className="px-3 py-1 bg-rose-100 hover:bg-rose-200 font-bold rounded-lg text-[11px]"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        /* Empty State */
        <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <FolderPlus className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Belum Ada Kategori Material</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search
              ? `Tidak ada kategori yang cocok dengan kata kunci "${search}"`
              : 'Tambahkan kategori pertama Anda untuk mengelompokkan produk di toko'}
          </p>
          {!search && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition"
            >
              + Tambah Kategori Pertama
            </button>
          )}
        </div>
      ) : (
        /* Categories Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-slate-900 text-sm leading-tight">{category.name}</h3>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-bold font-mono">
                    {category.product_count || 0} Produk
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {category.description || 'Tidak ada catatan deskripsi'}
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleOpenEdit(category)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => handleConfirmDelete(category)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <CategoryFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        categoryToEdit={selectedCategory}
      />

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeDelete}
        title="Hapus Kategori Material"
        message={`Apakah Anda yakin ingin menghapus kategori "${categoryToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Kategori"
        isDanger={true}
        loading={deleteLoading}
      />
    </div>
  );
}
