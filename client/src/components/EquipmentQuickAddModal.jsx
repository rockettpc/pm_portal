import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PlusCircle,
  X,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Layers,
  MapPin,
  Barcode,
  RotateCcw
} from 'lucide-react';

export const EquipmentQuickAddModal = ({
  isOpen,
  onClose,
  existingEquipment = [],
  locations = [],
  onEquipmentCreated
}) => {
  const { t } = useTranslation();
  const nameInputRef = useRef(null);

  const categories = [
    { label: 'Cutting Table', prefix: 'CUT' },
    { label: 'Edging Machine', prefix: 'EDGE' },
    { label: 'Tempering Furnace', prefix: 'FURN' },
    { label: 'Washing Line', prefix: 'WASH' },
    { label: 'CNC Workcenter', prefix: 'CNC' },
    { label: 'Laminating Line', prefix: 'LAM' },
    { label: 'Overhead Crane', prefix: 'CRN' },
    { label: 'Air Compressor', prefix: 'COMP' },
    { label: 'Water Treatment', prefix: 'WTR' },
    { label: 'Other Machinery', prefix: 'GEN' },
  ];

  const [category, setCategory] = useState(categories[0].label);
  const [assetId, setAssetId] = useState('');
  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [locationId, setLocationId] = useState('');
  const [criticality, setCriticality] = useState('medium');
  const [runtimeHours, setRuntimeHours] = useState('0');
  const [vendor, setVendor] = useState('Bystronic Glass');
  const [saveAndAddAnother, setSaveAndAddAnother] = useState(true);

  const [saving, setSaving] = useState(false);
  const [successToast, setSuccessToast] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Propose next Asset Tag based on category
  const generateNextAssetId = (catName) => {
    const matched = categories.find(c => c.label === catName) || categories[0];
    const prefix = `EQ-${matched.prefix}-`;
    const matchingIds = existingEquipment
      .map(e => e.asset_id || '')
      .filter(id => id.startsWith(prefix));

    let maxNum = 0;
    matchingIds.forEach(id => {
      const numPart = parseInt(id.replace(prefix, ''), 10);
      if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
    });

    const nextNum = String(maxNum + 1).padStart(2, '0');
    return `${prefix}${nextNum}`;
  };

  useEffect(() => {
    if (isOpen) {
      setAssetId(generateNextAssetId(category));
      setSuccessToast('');
      setErrorMessage('');
      setTimeout(() => {
        if (nameInputRef.current) nameInputRef.current.focus();
      }, 150);
    }
  }, [isOpen]);

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    setAssetId(generateNextAssetId(newCat));
  };

  // Duplicate checks
  const trimmedSerial = serialNumber.trim().toLowerCase();
  const serialDuplicate = trimmedSerial
    ? existingEquipment.find(
        e => e.serial_number && e.serial_number.trim().toLowerCase() === trimmedSerial
      )
    : null;

  const trimmedAssetId = assetId.trim().toUpperCase();
  const assetIdDuplicate = trimmedAssetId
    ? existingEquipment.find(
        e => e.asset_id && e.asset_id.trim().toUpperCase() === trimmedAssetId
      )
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!assetId.trim() || !name.trim()) {
      setErrorMessage('Asset Tag and Machine Name are required.');
      return;
    }

    if (assetIdDuplicate) {
      setErrorMessage(`Asset Tag "${assetId}" is already registered.`);
      return;
    }

    if (serialDuplicate) {
      if (!window.confirm(`Warning: Serial Number "${serialNumber}" is already in use by machine "${serialDuplicate.name}" (${serialDuplicate.asset_id}). Do you still want to proceed?`)) {
        return;
      }
    }

    setSaving(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          asset_id: assetId.trim().toUpperCase(),
          name: name.trim(),
          category,
          serial_number: serialNumber.trim(),
          vendor: vendor.trim(),
          location_id: locationId ? parseInt(locationId, 10) : null,
          criticality,
          runtime_hours: parseFloat(runtimeHours) || 0,
          status: 'active',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create equipment');
      }

      const createdAssetId = data.equipment?.asset_id || assetId;
      setSuccessToast(`✓ ${createdAssetId} saved successfully!`);
      if (onEquipmentCreated) onEquipmentCreated(data.equipment);

      if (saveAndAddAnother) {
        setName('');
        setSerialNumber('');
        setAssetId(generateNextAssetId(category));
        setTimeout(() => {
          if (nameInputRef.current) nameInputRef.current.focus();
        }, 100);
      } else {
        onClose();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Server error creating equipment');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-cyan-950 text-cyan-400 rounded-lg border border-cyan-800/60">
              <Zap size={16} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                {t('quick_add.title', 'Rapid Quick-Add Equipment')}
              </h3>
              <p className="text-[11px] text-slate-400">
                {t('quick_add.subtitle', 'Fast-entry form with instant serial duplicate detection')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Success Banner */}
          {successToast && (
            <div className="p-2.5 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-2.5 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle size={15} className="text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Category Selection */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              {t('equipment.category')} *
            </label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.label} value={c.label}>
                  {c.label} ({c.prefix})
                </option>
              ))}
            </select>
          </div>

          {/* Asset Tag & Machine Name Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('equipment.asset_id')} *
                </label>
                {assetIdDuplicate && (
                  <span className="text-[10px] text-red-400 font-bold">Duplicate ID!</span>
                )}
              </div>
              <input
                type="text"
                value={assetId}
                onChange={(e) => setAssetId(e.target.value.toUpperCase())}
                placeholder="e.g. EQ-CUT-01"
                className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-xs font-mono font-bold text-cyan-300 focus:outline-none ${
                  assetIdDuplicate ? 'border-red-500' : 'border-slate-700 focus:border-cyan-500'
                }`}
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {t('equipment.name')} *
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cutting Bridge #1"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Serial Number & Live Duplicate Check */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {t('equipment.serial')}
              </label>
              {serialDuplicate ? (
                <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                  <AlertTriangle size={11} />
                  Duplicate on {serialDuplicate.asset_id}!
                </span>
              ) : trimmedSerial ? (
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  Serial Available
                </span>
              ) : null}
            </div>
            <input
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="e.g. BYS-2024-9982"
              className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none ${
                serialDuplicate ? 'border-amber-500/80 bg-amber-950/20' : 'border-slate-700 focus:border-cyan-500'
              }`}
            />
          </div>

          {/* Location & Criticality Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {t('equipment.location')}
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="">-- Select Location --</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.building_name} - {loc.area_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                {t('equipment.criticality')}
              </label>
              <div className="grid grid-cols-4 gap-1">
                {['low', 'medium', 'high', 'critical'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCriticality(c)}
                    className={`py-1.5 text-[10px] font-bold uppercase rounded border transition ${
                      criticality === c
                        ? c === 'critical'
                          ? 'bg-red-950 text-red-300 border-red-500'
                          : c === 'high'
                          ? 'bg-amber-950 text-amber-300 border-amber-500'
                          : c === 'medium'
                          ? 'bg-blue-950 text-blue-300 border-blue-500'
                          : 'bg-slate-800 text-slate-200 border-slate-600'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer controls & Save & Add Another */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={saveAndAddAnother}
                onChange={(e) => setSaveAndAddAnother(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500/20 w-4 h-4"
              />
              <span className="font-medium">{t('quick_add.save_and_add_another', 'Save & Add Another')}</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg shadow-lg shadow-cyan-950/40 transition disabled:opacity-50"
              >
                <PlusCircle size={14} />
                <span>{saving ? t('common.saving') : t('equipment.add_asset')}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
