import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, AlertCircle } from 'lucide-react';

export const BarcodeScanner = ({ isOpen, onClose, onDetected }) => {
  const [errorMsg, setErrorMsg] = useState(null);
  const isScanningRef = useRef(false);
  const html5QrcodeRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      if (html5QrcodeRef.current && isScanningRef.current) {
        html5QrcodeRef.current
          .stop()
          .then(() => {
            html5QrcodeRef.current?.clear();
            isScanningRef.current = false;
          })
          .catch((err) => console.error('Error stopping scanner:', err));
      }
      return;
    }

    const scannerId = 'barcode-reader-region';

    const startScanner = async () => {
      setErrorMsg(null);
      try {
        const html5Qrcode = new Html5Qrcode(scannerId);
        html5QrcodeRef.current = html5Qrcode;

        const config = {
          fps: 10,
          qrbox: { width: 280, height: 180 },
          aspectRatio: 1.5,
        };

        await html5Qrcode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            if (decodedText) {
              // Beep sound feedback jika didukung
              try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = 880;
                osc.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.1);
              } catch {
                // Ignore audio error
              }

              onDetected(decodedText);
            }
          },
          () => {
            // Frame tidak terdeteksi barcode, abaikan
          }
        );

        isScanningRef.current = true;
      } catch (err) {
        console.error('Camera access error:', err);
        setErrorMsg('Gagal mengakses kamera. Pastikan izin kamera telah diberikan.');
        isScanningRef.current = false;
      }
    };

    const timer = setTimeout(() => {
      startScanner();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (html5QrcodeRef.current) {
        html5QrcodeRef.current
          .stop()
          .then(() => {
            html5QrcodeRef.current?.clear();
            isScanningRef.current = false;
          })
          .catch((err) => console.error('Error cleaning scanner:', err));
      }
    };
  }, [isOpen, onDetected]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-slate-800">
            <Camera className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base">Scan Barcode Kamera</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Frame Region */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[260px] flex items-center justify-center">
          <div id="barcode-reader-region" className="w-full h-full"></div>

          {errorMsg && (
            <div className="absolute inset-0 p-6 bg-slate-900/90 flex flex-col items-center justify-center text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-rose-500" />
              <p className="text-sm font-medium text-slate-200">{errorMsg}</p>
            </div>
          )}
        </div>

        <p className="text-xs text-center text-slate-500">
          Arahkan barcode produk ke dalam kotak pemindai kamera.
        </p>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
          >
            Tutup Kamera
          </button>
        </div>
      </div>
    </div>
  );
};
