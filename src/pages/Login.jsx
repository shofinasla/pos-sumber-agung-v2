import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  User,
  Phone,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  UserPlus,
  LogIn,
  MailCheck,
  RefreshCw,
  Sparkles,
  Inbox,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Logo } from '../components/common/Logo';
import { authService } from '../services/authService';

export const Login = () => {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState('CASHIER'); // 'OWNER' | 'CASHIER' | 'ADMIN'
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Verification step state
  const [isVerificationStep, setIsVerificationStep] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccessMsg, setResendSuccessMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // Cooldown countdown timer for resending verification email
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const { error } = await login(loginEmail, loginPassword);
      if (error) {
        const msg = error.message || '';
        if (
          msg.toLowerCase().includes('email not confirmed') ||
          msg.toLowerCase().includes('unconfirmed') ||
          msg.toLowerCase().includes('not confirmed')
        ) {
          setErrorMsg(
            'Email Anda belum diverifikasi. Silakan periksa inbox email Anda untuk mengklik tautan konfirmasi pendaftaran.'
          );
        } else {
          setErrorMsg(msg || 'Gagal masuk. Periksa kembali email dan password.');
        }
      } else {
        navigate(from, { replace: true });
      }
    } catch {
      setErrorMsg('Terjadi kesalahan sistem saat mencoba masuk.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (regPassword.length < 6) {
      setErrorMsg('Kata sandi minimal harus terdiri dari 6 karakter.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);

    try {
      const metadata = {
        full_name: regFullName,
        phone: regPhone,
        role: regRole,
      };

      const { data, error } = await register(regEmail, regPassword, metadata);
      if (error) {
        setErrorMsg(error.message || 'Gagal mendaftarkan akun baru.');
      } else if (data?.user) {
        // If session exists (e.g. email confirm is disabled or local demo mode)
        if (data.session) {
          setSuccessMsg('Akun berhasil dibuat! Mengalihkan ke sistem...');
          setTimeout(() => {
            navigate(from, { replace: true });
          }, 1200);
        } else {
          // Email confirmation is required by Supabase
          setRegisteredEmail(regEmail.trim().toLowerCase());
          setIsVerificationStep(true);
          setResendCooldown(60);
        }
      }
    } catch {
      setErrorMsg('Terjadi kesalahan saat pendaftaran akun.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async (targetEmail) => {
    const emailToUse = targetEmail || registeredEmail || loginEmail;
    if (!emailToUse) return;

    setResendLoading(true);
    setResendSuccessMsg('');
    setErrorMsg('');

    try {
      const { error } = await authService.resendVerification(emailToUse);
      if (error) {
        setErrorMsg(`Gagal mengirim ulang: ${error.message}`);
      } else {
        setResendSuccessMsg(
          `Tautan verifikasi baru berhasil dikirimkan ke ${emailToUse}. Silakan periksa inbox atau folder spam!`
        );
        setResendCooldown(60);
      }
    } catch (err) {
      setErrorMsg(`Gagal mengirim ulang email verifikasi: ${err.message}`);
    } finally {
      setResendLoading(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setIsVerificationStep(false);
    setErrorMsg('');
    setSuccessMsg('');
    setResendSuccessMsg('');
  };

  const handleGoToLoginWithEmail = (email) => {
    setLoginEmail(email || registeredEmail);
    setActiveTab('login');
    setIsVerificationStep(false);
    setErrorMsg('');
    setSuccessMsg(
      'Email telah terisi. Silakan masukkan kata sandi setelah mengonfirmasi tautan di email Anda.'
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Accent */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center mb-1">
            <Logo size="xl" className="shadow-lg shadow-rose-900/30" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">TB. SUMBER AGUNG</h1>
          <p className="text-xs text-slate-400 font-medium">
            Sistem Kasir & Manajemen Toko Bahan Bangunan
          </p>
        </div>

        {/* Tab Switcher: Masuk vs Daftar */}
        {!isVerificationStep && (
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => switchTab('login')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
                activeTab === 'login'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk</span>
            </button>
            <button
              type="button"
              onClick={() => switchTab('register')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
                activeTab === 'register'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Daftar Akun</span>
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-2xl text-rose-300 text-xs space-y-2 animate-shake">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
            {errorMsg.toLowerCase().includes('belum diverifikasi') && (
              <button
                type="button"
                onClick={() => handleResendVerification(loginEmail)}
                disabled={resendLoading || resendCooldown > 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-900/80 hover:bg-rose-800 text-rose-200 text-[11px] font-bold rounded-lg transition disabled:opacity-50"
              >
                {resendLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                <span>
                  {resendCooldown > 0
                    ? `Tunggu ${resendCooldown}s untuk kirim ulang`
                    : 'Kirim Ulang Link Verifikasi'}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-2xl text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* VERIFICATION NOTICE SCREEN */}
        {isVerificationStep ? (
          <div className="space-y-5 animate-fade-in text-center">
            {/* Animated Icon Badge */}
            <div className="relative inline-flex items-center justify-center">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl flex items-center justify-center text-emerald-400 shadow-inner">
                <MailCheck className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-teal-500 rounded-full flex items-center justify-center shadow">
                <Sparkles className="w-3 h-3 text-slate-950" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Pendaftaran Berhasil!
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tautan verifikasi telah dikirimkan ke alamat email:
              </p>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 font-bold max-w-full truncate">
                <Mail className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">{registeredEmail}</span>
              </div>
            </div>

            {/* Step-by-Step Instructions Box */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-left space-y-2.5">
              <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Inbox className="w-3.5 h-3.5 text-emerald-400" />
                <span>Petunjuk Aktivasi Akun:</span>
              </div>
              <ol className="text-[11px] text-slate-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>
                  Buka kotak masuk (<strong className="text-slate-200">Inbox</strong>) atau folder{' '}
                  <strong className="text-slate-200">Spam/Junk</strong> email Anda.
                </li>
                <li>
                  Buka email verifikasi dari <strong className="text-slate-200">TB. Sumber Agung</strong> / Supabase.
                </li>
                <li>
                  Klik tautan <strong className="text-emerald-400">"Confirm your email" / "Verifikasi Email"</strong>.
                </li>
                <li>
                  Setelah email terkonfirmasi, Anda dapat langsung masuk dengan kata sandi yang telah Anda daftarkan.
                </li>
              </ol>
            </div>

            {/* Resend status toast */}
            {resendSuccessMsg && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-700/80 rounded-xl text-emerald-300 text-[11px] flex items-center gap-2 text-left">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{resendSuccessMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleGoToLoginWithEmail(registeredEmail)}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2"
              >
                <span>Sudah Verifikasi? Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleResendVerification(registeredEmail)}
                disabled={resendLoading || resendCooldown > 0}
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-semibold rounded-xl text-xs transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                    <span>Mengirim Ulang...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {resendCooldown > 0
                        ? `Kirim Ulang Email (${resendCooldown}s)`
                        : 'Belum Menerima Email? Kirim Ulang'}
                    </span>
                  </>
                )}
              </button>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => switchTab('register')}
                className="text-[11px] text-slate-500 hover:text-slate-300 underline"
              >
                Salah ketik email? Daftar ulang dengan email lain
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* LOGIN FORM */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Email Pengguna
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="nama@sumberagung.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Kata Sandi (Password)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 focus:outline-none"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Proses Masuk...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk ke Sistem</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <p className="text-xs text-slate-400">
                    Belum memiliki akun?{' '}
                    <button
                      type="button"
                      onClick={() => switchTab('register')}
                      className="text-emerald-400 hover:underline font-semibold"
                    >
                      Daftar Sekarang
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* REGISTER FORM */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Budi Santoso"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        placeholder="email@toko.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      No. WhatsApp / HP
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                      <input
                        type="tel"
                        placeholder="081234567890"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Peran / Hak Akses Akun
                  </label>
                  <div className="relative">
                    <Shield className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    >
                      <option value="CASHIER">Kasir (Transaksi & Penjualan)</option>
                      <option value="OWNER">Pemilik Toko (Akses Penuh & Laporan)</option>
                      <option value="ADMIN">Admin Gudang (Stok & Pembelian)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Kata Sandi
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        placeholder="Min 6 karakter"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full pl-10 pr-8 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2.5 top-3 text-slate-500 hover:text-slate-300 focus:outline-none"
                      >
                        {showRegPassword ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Ulangi Sandi
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        placeholder="Konfirmasi"
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 disabled:opacity-50 mt-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mendaftarkan Akun...</span>
                    </>
                  ) : (
                    <>
                      <span>Daftar Akun</span>
                      <UserPlus className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <p className="text-xs text-slate-400">
                    Sudah memiliki akun?{' '}
                    <button
                      type="button"
                      onClick={() => switchTab('login')}
                      className="text-emerald-400 hover:underline font-semibold"
                    >
                      Masuk di Sini
                    </button>
                  </p>
                </div>
              </form>
            )}
          </>
        )}

        <div className="text-center text-[10px] text-slate-600 pt-2">
          POS TB. Sumber Agung © 2026 • Hak Cipta Dilindungi
        </div>

      </div>
    </div>
  );
};

