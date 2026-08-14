import { CameraScannerModal } from '../common/CameraScannerModal';

export const BarcodeScanner = ({ isOpen, onClose, onDetected }) => {
  return (
    <CameraScannerModal
      isOpen={isOpen}
      onClose={onClose}
      onDetected={onDetected}
      title="Scan Barcode Kasir"
      subtitle="Arahkan barcode produk material untuk langsung menambah ke keranjang"
      allowContinuous={true}
      defaultContinuous={true}
    />
  );
};

export default BarcodeScanner;
