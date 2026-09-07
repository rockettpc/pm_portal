import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useTranslation } from 'react-i18next';
import {
  Camera,
  X,
  Search,
  AlertCircle,
  FlipHorizontal,
  Zap,
  CheckCircle2
} from 'lucide-react';

export const QRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const { t } = useTranslation();
  const [manualInput, setManualInput] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // environment = back camera
  const html5QrCodeRef = useRef(null);

  const startScanner = async (mode) => {
    setCameraError(null);
    try {
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch (e) {
          // ignore if already stopped
        }
      }

      const qrScanner = new Html5Qrcode('qr-reader-container');
      html5QrCodeRef.current = qrScanner;

      const qrConfig = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await qrScanner.start(
        { facingMode: mode },
        qrConfig,
        (decodedText) => {
          handleDecoded(decodedText);
        },
        (errorMessage) => {
          // scanning frames, ignore frame errors
        }
      );
      setIsScanning(true);
    } catch (err) {
      console.error('[QRScanner Error]', err);
      setCameraError(err?.message || 'Could not access device camera. Please check camera permissions or use manual lookup.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Error stopping QR scanner:', err);
      }
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Short timeout to ensure container is in DOM
      const timer = setTimeout(() => {
        startScanner(facingMode);
      }, 300);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen, facingMode]);

  if (!isOpen) return null;

  const handleDecoded = async (text) => {
    try {
      if (navigator.vibrate) navigator.vibrate(100);
    } catch (e) {}

    await stopScanner();

    // Parse URL parameter or raw text
    let assetId = text.trim();
    if (assetId.includes('asset_id=')) {
      try {
        const url = new URL(assetId);
        assetId = url.searchParams.get('asset_id') || assetId;
      } catch (e) {
        const match = assetId.match(/asset_id=([^&]+)/);
        if (match) assetId = decodeURIComponent(match[1]);
      }
    }

    onScanSuccess(assetId);
    onClose();
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleDecoded(manualInput.trim());
  };

  const toggleCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2">
            <Camera className="text-cyan-400" size={18} />
            <h3 className="text-sm font-bold text-white tracking-wide">
              {t('qr.scanner_title', 'Scan Machine Asset QR')}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleCamera}
              className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition"
              title="Flip camera"
            >
              <FlipHorizontal size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Camera Viewport */}
        <div className="p-4 bg-slate-950 flex flex-col items-center">
          <div className="relative w-full max-w-xs h-64 bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
            
            <div id="qr-reader-container" className="w-full h-full" />

            {/* Target Reticle / Corner Accents */}
            <div className="absolute inset-6 pointer-events-none border border-cyan-500/30 rounded-lg flex flex-col justify-between p-1">
              <div className="flex justify-between">
                <div className="w-4 h-4 border-t-2 border-l-2 border-cyan-400 rounded-tl" />
                <div className="w-4 h-4 border-t-2 border-r-2 border-cyan-400 rounded-tr" />
              </div>
              <div className="flex justify-between">
                <div className="w-4 h-4 border-b-2 border-l-2 border-cyan-400 rounded-bl" />
                <div className="w-4 h-4 border-b-2 border-r-2 border-cyan-400 rounded-br" />
              </div>
            </div>

            {/* Camera Error / Fallback message */}
            {cameraError && (
              <div className="absolute inset-0 bg-slate-950/90 p-4 flex flex-col items-center justify-center text-center">
                <AlertCircle size={28} className="text-amber-400 mb-2" />
                <div className="text-xs text-slate-200 font-semibold mb-1">
                  Camera Access Unavailable
                </div>
                <div className="text-[11px] text-slate-400 leading-tight">
                  {cameraError}
                </div>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 mt-3 text-center">
            {t('qr.scanner_hint', 'Point camera at any machine QR sticker to open equipment details, manuals, and service logs.')}
          </p>
        </div>

        {/* Manual Lookup Fallback Form */}
        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {t('qr.manual_lookup_label', 'Or Lookup by Asset Tag')}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                  placeholder="e.g. EQ-CUT-01, EQ-EDGE-01"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 uppercase font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold rounded-lg shadow transition"
              >
                {t('common.search', 'Find')}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
