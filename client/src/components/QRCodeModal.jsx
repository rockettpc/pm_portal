import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { useTranslation } from 'react-i18next';
import {
  QrCode,
  Printer,
  Download,
  X,
  Cpu,
  MapPin,
  Barcode
} from 'lucide-react';

export const QRCodeModal = ({ isOpen, onClose, equipment }) => {
  const { t } = useTranslation();
  const [qrDataUrl, setQrDataUrl] = useState('');
  const printRef = useRef(null);

  useEffect(() => {
    if (equipment && isOpen) {
      // Build deep link URL or standard asset ID
      const host = window.location.host || 'localhost:3001';
      const protocol = window.location.protocol || 'http:';
      const scanPayload = `${protocol}//${host}/?tab=equipment&asset_id=${encodeURIComponent(equipment.asset_id)}`;

      QRCode.toDataURL(scanPayload, {
        width: 320,
        margin: 1.5,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('Failed to generate QR code', err));
    }
  }, [equipment, isOpen]);

  if (!isOpen || !equipment) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `QR_${equipment.asset_id}_CGI.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="no-print p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2">
            <QrCode className="text-cyan-400" size={18} />
            <h3 className="text-sm font-bold text-white tracking-wide">
              {t('qr.modal_title', 'Equipment QR Asset Tag')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Printable Asset Tag Sticker */}
        <div className="p-6 flex flex-col items-center bg-slate-950">
          <div
            ref={printRef}
            className="printable-card bg-white text-slate-950 p-5 rounded-xl border-2 border-slate-300 shadow-xl w-full max-w-xs flex flex-col items-center text-center font-sans"
          >
            {/* Header Brand */}
            <div className="w-full border-b-2 border-slate-900 pb-2 mb-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                Custom Glass Industries, Inc.
              </div>
              <div className="text-xs font-black uppercase tracking-wider text-slate-950">
                Anaheim Glass Plant • Asset Tag
              </div>
            </div>

            {/* Equipment Info */}
            <div className="w-full text-left mb-2">
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-slate-950 tracking-tight font-mono">
                  {equipment.asset_id}
                </span>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 bg-slate-200 rounded border border-slate-300">
                  {equipment.category}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-800 truncate mt-0.5">
                {equipment.name}
              </div>
            </div>

            {/* Generated QR Code Image */}
            <div className="bg-white p-2 rounded-lg border border-slate-300 my-1">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${equipment.asset_id}`}
                  className="w-48 h-48 object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                  Generating QR...
                </div>
              )}
            </div>

            {/* Serial & Location Footer */}
            <div className="w-full mt-2 pt-2 border-t border-slate-300 text-[10px] font-mono text-slate-700 flex justify-between">
              <div>
                <span className="font-bold text-slate-900">S/N:</span> {equipment.serial_number || 'N/A'}
              </div>
              <div>
                <span className="font-bold text-slate-900">LOC:</span> {equipment.area_name || equipment.building_name || 'Plant'}
              </div>
            </div>

            <div className="text-[9px] text-slate-500 font-mono mt-2 uppercase tracking-wider">
              Scan with PM Portal Camera for Manuals & History
            </div>
          </div>
        </div>

        {/* Action Buttons - Hidden on Print */}
        <div className="no-print p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            <Download size={14} />
            <span>{t('qr.download_btn', 'Download PNG')}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg shadow-lg shadow-cyan-950/40 transition"
            >
              <Printer size={14} />
              <span>{t('qr.print_btn', 'Print Sticker')}</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              {t('common.close')}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
