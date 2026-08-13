import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium">Memuat aplikasi POS TB. Sumber Agung...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md max-w-md space-y-4">
          <h2 className="text-xl font-bold text-rose-600">Akses Ditolak</h2>
          <p className="text-slate-600 text-sm">
            Role Anda ({role}) tidak memiliki izin untuk mengakses halaman ini.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return children;
};
