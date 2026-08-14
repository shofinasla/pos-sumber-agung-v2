import { useEffect, useRef, useState, useCallback, useId } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  Camera,
  X,
  AlertCircle,
  Flashlight,
  FlashlightOff,
  SwitchCamera,
  Upload,
  CheckCircle2,
  Volume2,
  VolumeX,
  Layers,
  HelpCircle,
} from 'lucide-react';

const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.PDF_417,
];

// Helper to play beep sound on scan success
const playBeep = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6 Note
    osc.frequency.exponentialRampToValueAtTime(1318.5, ctx.currentTime + 0.08); // E6 Note

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);

    if (navigator.vibrate) {
      navigator.vibrate(80);
    }
  } catch (e) {
    console.debug('Audio beep not allowed yet:', e);
  }
};

export const CameraScannerModal = ({
  isOpen,
  onClose,
  onDetected,
  title = 'Scan Barcode Kamera',
  subtitle = 'Arahkan kamera ke barcode produk material atau kemasan',
  allowContinuous = true,
  defaultContinuous = false,
}) => {
  const rawId = useId();
  const containerId = `camera-scanner-view-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;

  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [lastScanned, setLastScanned] = useState(null);
  const [isContinuous, setIsContinuous] = useState(defaultContinuous);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isFileScanning, setIsFileScanning] = useState(false);

  const scannerRef = useRef(null);
  const isScanningRef = useRef(false);
  const lastScanTimeRef = useRef(0);
  const lastCodeRef = useRef('');

  // Handle successful detection with debounce
  const handleScanSuccess = useCallback(
    (decodedText) => {
      if (!decodedText) return;
      const now = Date.now();

      // Debounce if same barcode within 1.5s
      if (decodedText === lastCodeRef.current && now - lastScanTimeRef.current < 1500) {
        return;
      }

      lastCodeRef.current = decodedText;
      lastScanTimeRef.current = now;
      setLastScanned({ code: decodedText, time: new Date() });

      if (soundEnabled) {
        playBeep();
      }

      onDetected(decodedText);

      if (!isContinuous) {
        onClose();
      }
    },
    [isContinuous, onClose, onDetected, soundEnabled]
  );

  // Stop active scanner safely
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (isScanningRef.current) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.debug('Safe stop error:', err);
      } finally {
        isScanningRef.current = false;
        scannerRef.current = null;
      }
    }
  }, []);

  // Initialize and start scanner
  const startScanner = useCallback(async (cameraIdOrFacing) => {
    await stopScanner();
    setErrorMsg(null);
    setIsInitializing(true);

    try {
      const html5Qr = new Html5Qrcode(containerId, {
        formatsToSupport: SUPPORTED_FORMATS,
        verbose: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
      });

      scannerRef.current = html5Qr;

      const qrConfig = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          // Optimized rectangular shape for horizontal barcodes
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const width = Math.floor(minEdge * 0.9);
          const height = Math.floor(minEdge * 0.55);
          return { width: Math.max(width, 220), height: Math.max(height, 120) };
        },
        aspectRatio: 1.333333,
      };

      const cameraConstraint = cameraIdOrFacing
        ? cameraIdOrFacing
        : { facingMode: 'environment' };

      await html5Qr.start(
        cameraConstraint,
        qrConfig,
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // Frame not detected, continue
        }
      );

      isScanningRef.current = true;

      // Check if torch/flashlight is supported
      try {
        const capabilities = html5Qr.getRunningTrackCapabilities();
        if (capabilities && 'torch' in capabilities) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }
      } catch {
        setHasTorch(false);
      }
    } catch (err) {
      console.warn('Primary camera init failed, attempting fallback...', err);

      // Fallback: try default camera without facingMode constraint if on desktop
      try {
        if (scannerRef.current) {
          await scannerRef.current.start(
            { facingMode: 'user' },
            { fps: 10, qrbox: { width: 260, height: 160 } },
            (decodedText) => handleScanSuccess(decodedText),
            () => {}
          );
          isScanningRef.current = true;
        } else {
          throw err;
        }
      } catch (fallbackErr) {
        console.error('All camera attempts failed:', fallbackErr);
        setErrorMsg(
          'Tidak dapat mengakses kamera. Pastikan Anda mengizinkan akses kamera di browser atau gunakan fitur upload gambar barcode.'
        );
      }
    } finally {
      setIsInitializing(false);
    }
  }, [containerId, handleScanSuccess, stopScanner]);

  // Load cameras list on mount
  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    let isMounted = true;

    const initCameras = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (isMounted && devices && devices.length > 0) {
          setCameras(devices);
          // Prefer back/rear camera if found
          const backCam = devices.find((d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('belakang') ||
            d.label.toLowerCase().includes('environment')
          );
          const initialId = backCam ? backCam.id : devices[0].id;
          setSelectedCameraId(initialId);
          startScanner(initialId);
        } else {
          startScanner({ facingMode: 'environment' });
        }
      } catch {
        startScanner({ facingMode: 'environment' });
      }
    };

    const timer = setTimeout(() => {
      initCameras();
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen, startScanner, stopScanner]);

  // Switch camera handler
  const handleSwitchCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];
    setSelectedCameraId(nextCamera.id);
    setIsTorchOn(false);
    startScanner(nextCamera.id);
  };

  // Toggle Torch handler
  const handleToggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const nextState = !isTorchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState }],
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  };

  // Handle barcode scanning from image file
  const handleFileScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsFileScanning(true);
    setErrorMsg(null);

    try {
      // Create temporary scanner instance for file scanning
      const tempScanner = new Html5Qrcode(`temp-file-scanner-${Date.now()}`, {
        formatsToSupport: SUPPORTED_FORMATS,
        verbose: false,
      });

      const decodedText = await tempScanner.scanFile(file, true);
      if (decodedText) {
        handleScanSuccess(decodedText);
      } else {
        setErrorMsg('Barcode tidak terdeteksi pada gambar yang diunggah.');
      }
    } catch (err) {
      console.error('File scan error:', err);
      setErrorMsg('Gagal membaca barcode dari gambar. Coba ambil foto yang lebih jelas dan terang.');
    } finally {
      setIsFileScanning(false);
      e.target.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col text-white">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white tracking-tight">{title}</h3>
              <p className="text-[11px] text-slate-400 font-medium">{subtitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Box */}
        <div className="relative bg-black min-h-[300px] flex items-center justify-center overflow-hidden">
          {/* Scanner View Container */}
          <div
            id={containerId}
            className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
          />

          {/* Scanner Animated Laser & Target Box Overlay */}
          {!errorMsg && !isInitializing && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
              <div className="w-full max-w-[280px] h-[160px] border-2 border-emerald-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-emerald-500/5">
                {/* Target Corners */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl-sm" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr-sm" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl-sm" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br-sm" />

                {/* Animated Red/Green Laser Line */}
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent animate-pulse top-1/2 -translate-y-1/2 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
              </div>
            </div>
          )}

          {/* Initializing Spinner */}
          {isInitializing && (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center space-y-3 z-10">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-slate-300">Menghubungkan ke kamera...</p>
            </div>
          )}

          {/* Error / Permission Blocked Message */}
          {errorMsg && (
            <div className="absolute inset-0 p-6 bg-slate-950/95 flex flex-col items-center justify-center text-center space-y-3 z-20">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-xs font-medium text-slate-200 max-w-xs">{errorMsg}</p>
              <div className="pt-2 flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => startScanner(selectedCameraId)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition"
                >
                  Coba Akses Lagi
                </button>
              </div>
            </div>
          )}

          {/* Top Quick Controls Overlay */}
          <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
            {hasTorch && (
              <button
                type="button"
                onClick={handleToggleTorch}
                title={isTorchOn ? 'Matikan Senter' : 'Nyalakan Senter'}
                className={`p-2 rounded-xl backdrop-blur-md transition shadow-md ${
                  isTorchOn ? 'bg-amber-500 text-slate-950' : 'bg-slate-900/80 text-white hover:bg-slate-800'
                }`}
              >
                {isTorchOn ? <Flashlight className="w-4 h-4 font-bold" /> : <FlashlightOff className="w-4 h-4" />}
              </button>
            )}

            {cameras.length > 1 && (
              <button
                type="button"
                onClick={handleSwitchCamera}
                title="Ganti Kamera (Depan/Belakang)"
                className="p-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl backdrop-blur-md transition shadow-md"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Matikan Suara Beep' : 'Nyalakan Suara Beep'}
              className="p-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl backdrop-blur-md transition shadow-md"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
          </div>

          {/* Last Scanned Feedback Toast Overlay */}
          {lastScanned && (
            <div className="absolute bottom-3 left-3 right-3 bg-emerald-950/90 border border-emerald-500/30 text-emerald-200 px-3.5 py-2 rounded-2xl backdrop-blur-md flex items-center justify-between text-xs animate-in slide-in-from-bottom-2 duration-150 z-10 shadow-lg">
              <div className="flex items-center space-x-2 truncate">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">
                  Terdeteksi: <strong className="font-mono text-white">{lastScanned.code}</strong>
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold uppercase shrink-0 ml-2">
                Sukses
              </span>
            </div>
          )}
        </div>

        {/* Footer Controls & Options */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Upload image alternative */}
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl cursor-pointer transition font-medium border border-slate-700">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isFileScanning ? 'Membaca...' : 'Upload Foto Barcode'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileScan}
                disabled={isFileScanning}
                className="hidden"
              />
            </label>

            {/* Continuous scan toggle */}
            {allowContinuous && (
              <button
                type="button"
                onClick={() => setIsContinuous(!isContinuous)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                  isContinuous
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-300'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Scan Beruntun: {isContinuous ? 'ON' : 'OFF'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
            <div className="flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Mendukung Barcode 1D (EAN, UPC, Code 128) & QR Code</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="font-bold text-slate-400 hover:text-white transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraScannerModal;
