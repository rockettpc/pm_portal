import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { 
  Wrench, AlertTriangle, CheckCircle, Clock, FileText, 
  Upload, Plus, Search, MapPin, Building, ShieldAlert,
  Download, Eye, Filter, Edit, Trash2, QrCode, Camera, Zap
} from 'lucide-react';
import { QRCodeModal } from './QRCodeModal';
import { QRScannerModal } from './QRScannerModal';
import { EquipmentQuickAddModal } from './EquipmentQuickAddModal';

export const EquipmentView = ({ targetAssetId = null }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [equipment, setEquipment] = useState([]);
  const [qrTargetAsset, setQrTargetAsset] = useState(null);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [locations, setLocations] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selected equipment for detail/manuals modal
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [assetDocs, setAssetDocs] = useState([]);
  const [assetHistory, setAssetHistory] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Edit Asset Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [editError, setEditError] = useState('');

  // Delete Asset Modal / State
  const [deleteAssetTarget, setDeleteAssetTarget] = useState(null);
  const [deletingAsset, setDeletingAsset] = useState(false);

  // New Asset Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAsset, setNewAsset] = useState({
    asset_id: '',
    name: '',
    category: 'Cutting',
    location_id: '',
    vendor_id: '',
    model_number: '',
    serial_number: '',
    criticality: 'Medium',
    status: 'Active',
    runtime_hours: 0,
    description: '',
  });
  const [addError, setAddError] = useState('');

  // Upload document state
  const [uploadFile, setUploadFile] = useState(null);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('manual');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/equipment', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setEquipment(data.equipment);
      }
    } catch (e) {
      console.error('Failed to load equipment', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxData = async () => {
    try {
      const [locRes, venRes] = await Promise.all([
        fetch('/api/locations', { credentials: 'include' }),
        fetch('/api/vendors', { credentials: 'include' }),
      ]);
      if (locRes.ok) {
        const locData = await locRes.json();
        setLocations(locData.locations);
      }
      if (venRes.ok) {
        const venData = await venRes.json();
        setVendors(venData.vendors);
      }
    } catch (e) {
      console.error('Failed to load aux data', e);
    }
  };

  useEffect(() => {
    fetchEquipment();
    fetchAuxData();
  }, []);

  // Auto-open asset if targetAssetId or URL param is provided
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedAssetId = targetAssetId || params.get('asset_id');
    if (requestedAssetId && equipment.length > 0) {
      const match = equipment.find(
        (e) => e.asset_id?.toLowerCase() === requestedAssetId.toLowerCase()
      );
      if (match) {
        openAssetDetail(match);
      }
    }
  }, [equipment, targetAssetId]);

  const openAssetDetail = async (asset) => {
    setSelectedAsset(asset);
    setShowDetailModal(true);
    setUploadSuccess('');
    try {
      const res = await fetch(`/api/equipment/${asset.id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSelectedAsset(data.equipment);
        setAssetDocs(data.documents || []);
        setAssetHistory(data.status_history || []);
      }
    } catch (e) {
      console.error('Failed to load asset detail', e);
    }
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    setAddError('');
    try {
      const res = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAsset),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create asset');
      }
      setShowAddModal(false);
      setNewAsset({
        asset_id: '',
        name: '',
        category: 'Cutting',
        location_id: '',
        vendor_id: '',
        model_number: '',
        serial_number: '',
        criticality: 'Medium',
        status: 'Active',
        runtime_hours: 0,
        description: '',
      });
      fetchEquipment();
    } catch (err) {
      setAddError(err.message);
    }
  };

  const handleOpenEdit = (asset) => {
    setEditAsset({
      id: asset.id,
      asset_id: asset.asset_id || '',
      name: asset.name || '',
      category: asset.category || 'Cutting',
      location_id: asset.location_id || '',
      vendor_id: asset.vendor_id || '',
      model_number: asset.model_number || '',
      serial_number: asset.serial_number || '',
      criticality: asset.criticality || 'Medium',
      status: asset.status || 'Active',
      runtime_hours: asset.runtime_hours || 0,
      description: asset.description || '',
      install_date: asset.install_date ? asset.install_date.split('T')[0] : '',
      warranty_expiry_date: asset.warranty_expiry_date ? asset.warranty_expiry_date.split('T')[0] : '',
    });
    setEditError('');
    setShowEditModal(true);
  };

  const handleUpdateAsset = async (e) => {
    e.preventDefault();
    setEditError('');
    try {
      const res = await fetch(`/api/equipment/${editAsset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editAsset),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update equipment');
      setShowEditModal(false);
      setEditAsset(null);
      fetchEquipment();
      if (selectedAsset && selectedAsset.id === editAsset.id) {
        setSelectedAsset(data.equipment);
      }
    } catch (err) {
      setEditError(err.message);
    }
  };

  const handleDeleteAsset = async () => {
    if (!deleteAssetTarget) return;
    setDeletingAsset(true);
    try {
      const res = await fetch(`/api/equipment/${deleteAssetTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete equipment');
      setDeleteAssetTarget(null);
      if (selectedAsset && selectedAsset.id === deleteAssetTarget.id) {
        setShowDetailModal(false);
        setSelectedAsset(null);
      }
      fetchEquipment();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setDeletingAsset(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm(t('equipment.delete_doc_confirm'))) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setAssetDocs(assetDocs.filter((d) => d.id !== docId));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete document');
      }
    } catch (err) {
      alert('Error deleting document: ' + err.message);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!uploadFile || !selectedAsset) return;
    setUploading(true);
    setUploadSuccess('');
    try {
      const formData = new FormData();
      formData.append('document', uploadFile);
      formData.append('title', docTitle || uploadFile.name);
      formData.append('doc_type', docType);

      const res = await fetch(`/api/equipment/${selectedAsset.id}/documents`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      
      setAssetDocs([data.document, ...assetDocs]);
      setUploadFile(null);
      setDocTitle('');
      setUploadSuccess('Document uploaded successfully!');
    } catch (err) {
      alert('Upload error: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedAsset) return;
    try {
      const res = await fetch(`/api/equipment/${selectedAsset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, status_reason: `Manual status change via web UI by ${user.username}` }),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedAsset(data.equipment);
        fetchEquipment();
      }
    } catch (e) {
      console.error('Status update failed', e);
    }
  };

  const filteredEquipment = equipment.filter((eq) => {
    const matchesSearch = 
      eq.asset_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (eq.serial_number && eq.serial_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (eq.area && eq.area.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || eq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800"><CheckCircle size={12} /> {t('equipment.status_active')}</span>;
      case 'Down':
        return <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-red-950/80 text-red-400 border border-red-800 animate-pulse"><AlertTriangle size={12} /> {t('equipment.status_down')}</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">{status}</span>;
    }
  };

  const getCriticalityBadge = (crit) => {
    switch (crit) {
      case 'Critical':
        return <span className="text-red-400 font-bold text-xs bg-red-950/40 px-2 py-0.5 rounded border border-red-800/40">Critical</span>;
      case 'High':
        return <span className="text-orange-400 font-medium text-xs bg-orange-950/40 px-2 py-0.5 rounded border border-orange-800/40">High</span>;
      case 'Medium':
        return <span className="text-yellow-400 text-xs bg-yellow-950/40 px-2 py-0.5 rounded border border-yellow-800/40">Medium</span>;
      default:
        return <span className="text-slate-400 text-xs bg-slate-800 px-2 py-0.5 rounded">Low</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Operator Scoping Alert Notice */}
      {user?.role === 'operator' && (
        <div className="bg-cyan-950/40 border border-cyan-700/60 rounded-xl p-4 flex items-center justify-between gap-4 text-cyan-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-900/50 rounded-lg text-cyan-400">
              <ShieldAlert size={20} />
            </div>
            <div>
              <div className="font-semibold text-sm">{t('equipment.operator_title')}</div>
              <div className="text-xs text-cyan-300/80">{t('equipment.operator_notice')}</div>
            </div>
          </div>
          <span className="font-mono text-xs bg-cyan-900/80 text-cyan-300 px-2.5 py-1 rounded-md border border-cyan-600">
            {equipment.length} Machines Scoped
          </span>
        </div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {user?.role === 'operator' ? t('equipment.operator_title') : t('equipment.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {user?.role === 'operator' ? t('equipment.operator_subtitle') : t('equipment.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Scan QR Button for all shop users */}
          <button
            onClick={() => setShowQrScanner(true)}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700/80 text-xs font-semibold px-3 py-2 rounded-lg transition"
            title={t('qr.scanner_title')}
          >
            <Camera size={14} className="text-cyan-400" />
            <span>{t('qr.scan_asset_btn')}</span>
          </button>

          {/* Quick-Add & Standard Add for Managers/Admins */}
          {['admin', 'manager'].includes(user?.role) && (
            <>
              <button
                onClick={() => setShowQuickAddModal(true)}
                className="inline-flex items-center gap-1.5 bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/60 text-xs font-semibold px-3 py-2 rounded-lg transition"
                title={t('quick_add.subtitle')}
              >
                <Zap size={14} className="text-amber-400" />
                <span>{t('quick_add.quick_add_btn')}</span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-md shadow-cyan-900/30 transition"
              >
                <Plus size={15} />
                <span>{t('equipment.add_asset')}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('equipment.search_placeholder')}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Down">Down Only</option>
            <option value="In Storage">In Storage</option>
          </select>
        </div>
      </div>

      {/* Equipment List */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">{t('common.loading')}</div>
      ) : filteredEquipment.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center text-slate-400 text-sm">
          {t('equipment.no_equipment')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {filteredEquipment.map((asset) => (
            <div
              key={asset.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-lg transition flex flex-col justify-between"
            >
              <div>
                {/* Header row with tags */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/80">
                        {asset.asset_id}
                      </span>
                      <span className="text-slate-400 text-xs font-medium">
                        {asset.category}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-white mt-1.5 leading-snug">
                      {asset.name}
                    </h2>
                  </div>
                  <div>{getStatusBadge(asset.status)}</div>
                </div>

                {/* Description */}
                {asset.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                    {asset.description}
                  </p>
                )}

                {/* Machine Specs Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-lg border border-slate-800/60 mb-4">
                  <div>
                    <span className="text-slate-500 block text-[11px]">{t('equipment.location')}</span>
                    <span className="text-slate-300 font-medium flex items-center gap-1 mt-0.5">
                      <MapPin size={12} className="text-slate-400" />
                      {asset.area || 'Anaheim Plant'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">{t('equipment.runtime_hours')}</span>
                    <span className="text-slate-300 font-mono font-medium flex items-center gap-1 mt-0.5">
                      <Clock size={12} className="text-slate-400" />
                      {asset.runtime_hours ? `${Number(asset.runtime_hours).toLocaleString()} hrs` : '0 hrs'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">{t('equipment.criticality')}</span>
                    <span className="mt-0.5 inline-block">{getCriticalityBadge(asset.criticality)}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">{t('equipment.serial')}</span>
                    <span className="text-slate-300 font-mono text-[11px] mt-0.5 block truncate">
                      {asset.serial_number || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <div className="text-[11px] text-slate-500 truncate max-w-[130px]">
                  {asset.vendor_name ? `OEM: ${asset.vendor_name}` : ''}
                </div>
                <div className="flex items-center gap-1.5">
                  {['admin', 'manager'].includes(user?.role) && (
                    <>
                      <button
                        onClick={() => handleOpenEdit(asset)}
                        title={t('equipment.edit_asset')}
                        className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition"
                      >
                        <Edit size={14} />
                      </button>
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => setDeleteAssetTarget(asset)}
                          title={t('equipment.delete_asset')}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => setQrTargetAsset(asset)}
                    title={t('qr.view_qr_btn', 'QR Tag')}
                    className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition"
                  >
                    <QrCode size={14} />
                  </button>
                  <button
                    onClick={() => openAssetDetail(asset)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-800/60 px-3 py-1.5 rounded-lg transition"
                  >
                    <Eye size={14} />
                    {t('equipment.details')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Asset Detail & Manuals Modal */}
      {showDetailModal && selectedAsset && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    {selectedAsset.asset_id}
                  </span>
                  <span className="text-xs text-slate-400">{selectedAsset.category}</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">{selectedAsset.name}</h3>
                <p className="text-xs text-slate-400">{selectedAsset.specific_location || selectedAsset.area}</p>
              </div>
              <div className="flex items-center gap-2">
                {['admin', 'manager'].includes(user?.role) && (
                  <button
                    onClick={() => handleOpenEdit(selectedAsset)}
                    className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
                  >
                    <Edit size={13} />
                    {t('equipment.edit_asset')}
                  </button>
                )}
                <button
                  onClick={() => setQrTargetAsset(selectedAsset)}
                  className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
                  title={t('qr.view_qr_btn', 'QR Tag')}
                >
                  <QrCode size={13} />
                  <span>{t('qr.view_qr_btn', 'QR Tag')}</span>
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Status Changer (for techs, managers, admins) */}
            {['admin', 'manager', 'technician'].includes(user?.role) && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Quick Machine Status Toggle
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange('Active')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition ${
                      selectedAsset.status === 'Active'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    Active / Running
                  </button>
                  <button
                    onClick={() => handleStatusChange('Down')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition ${
                      selectedAsset.status === 'Down'
                        ? 'bg-red-950 text-red-300 border-red-600'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    Down (Out of Service)
                  </button>
                  <button
                    onClick={() => handleStatusChange('In Storage')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition ${
                      selectedAsset.status === 'In Storage'
                        ? 'bg-yellow-950 text-yellow-300 border-yellow-600'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    In Storage
                  </button>
                </div>
              </div>
            )}

            {/* Document Management Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText size={16} className="text-cyan-400" />
                  Service Manuals & Schematics ({assetDocs.length})
                </h4>
              </div>

              {uploadSuccess && (
                <div className="p-2.5 bg-cyan-950/60 border border-cyan-800 rounded-lg text-xs text-cyan-300">
                  {uploadSuccess}
                </div>
              )}

              {/* Upload Form */}
              {['admin', 'manager', 'technician'].includes(user?.role) && (
                <form onSubmit={handleUploadDocument} className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-3">
                  <div className="text-xs font-semibold text-slate-300">{t('equipment.upload_doc')}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Document title (e.g. Electrical Wiring Manual)"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="text-xs bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 sm:col-span-2 focus:ring-1 focus:ring-cyan-500"
                    />
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="text-xs bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                    >
                      <option value="manual">OEM Manual</option>
                      <option value="schematic">Wiring / Schematic</option>
                      <option value="sds">Safety Data Sheet (SDS)</option>
                      <option value="procedure">PM Procedure</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="file"
                      required
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700"
                    />
                    <button
                      type="submit"
                      disabled={uploading}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium px-3 py-1.5 rounded transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Upload size={13} />
                      {uploading ? 'Uploading...' : t('common.upload')}
                    </button>
                  </div>
                </form>
              )}

              {/* Documents List */}
              {assetDocs.length === 0 ? (
                <div className="text-xs text-slate-500 italic p-3 bg-slate-950/40 rounded border border-slate-800">
                  No manuals or service documents on file for this machine yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-800 bg-slate-950 rounded-lg border border-slate-800">
                  {assetDocs.map((doc) => (
                    <div key={doc.id} className="p-3 flex items-center justify-between hover:bg-slate-900/50 transition">
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-slate-400" />
                        <div>
                          <div className="text-xs font-semibold text-slate-200">{doc.title}</div>
                          <div className="text-[11px] text-slate-500">
                            {doc.doc_type.toUpperCase()} • {(doc.file_size / (1024 * 1024)).toFixed(2)} MB • v{doc.version}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={`/api/documents/${doc.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-cyan-400 hover:bg-cyan-950/50 rounded transition"
                          title="View / Download"
                        >
                          <Download size={16} />
                        </a>
                        {['admin', 'manager'].includes(user?.role) && (
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded transition"
                            title={t('equipment.delete_doc')}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus size={18} className="text-cyan-400" />
                {t('equipment.add_asset')}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {addError && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded text-xs text-red-300">
                {addError}
              </div>
            )}

            <form onSubmit={handleCreateAsset} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">{t('equipment.asset_id')} *</label>
                  <input
                    type="text"
                    required
                    placeholder="EQ-WATERJET-01"
                    value={newAsset.asset_id}
                    onChange={(e) => setNewAsset({ ...newAsset, asset_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">{t('equipment.category')} *</label>
                  <input
                    type="text"
                    required
                    placeholder="Cutting, Tempering, etc."
                    value={newAsset.category}
                    onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">{t('equipment.name')} *</label>
                <input
                  type="text"
                  required
                  placeholder="Waterjet 5-Axis Glass Cutter"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">{t('equipment.serial')}</label>
                  <input
                    type="text"
                    placeholder="SN-2024-88192"
                    value={newAsset.serial_number}
                    onChange={(e) => setNewAsset({ ...newAsset, serial_number: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Model #</label>
                  <input
                    type="text"
                    placeholder="WJ-PRO-3000"
                    value={newAsset.model_number}
                    onChange={(e) => setNewAsset({ ...newAsset, model_number: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">{t('equipment.location')}</label>
                  <select
                    value={newAsset.location_id}
                    onChange={(e) => setNewAsset({ ...newAsset, location_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="">Select Location</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.building} — {l.area}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">{t('equipment.criticality')}</label>
                  <select
                    value={newAsset.criticality}
                    onChange={(e) => setNewAsset({ ...newAsset, criticality: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium shadow-md shadow-cyan-900/30"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {showEditModal && editAsset && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit size={18} className="text-cyan-400" />
                {t('equipment.edit_modal_title')}
              </h3>
              <button onClick={() => { setShowEditModal(false); setEditAsset(null); }} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {editError && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded text-xs text-red-300">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateAsset} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">{t('equipment.asset_id')} *</label>
                  <input
                    type="text"
                    required
                    value={editAsset.asset_id}
                    onChange={(e) => setEditAsset({ ...editAsset, asset_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">{t('equipment.category')} *</label>
                  <input
                    type="text"
                    required
                    value={editAsset.category}
                    onChange={(e) => setEditAsset({ ...editAsset, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">{t('equipment.name')} *</label>
                <input
                  type="text"
                  required
                  value={editAsset.name}
                  onChange={(e) => setEditAsset({ ...editAsset, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">{t('equipment.serial')}</label>
                  <input
                    type="text"
                    value={editAsset.serial_number}
                    onChange={(e) => setEditAsset({ ...editAsset, serial_number: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Model #</label>
                  <input
                    type="text"
                    value={editAsset.model_number}
                    onChange={(e) => setEditAsset({ ...editAsset, model_number: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">{t('equipment.location')}</label>
                  <select
                    value={editAsset.location_id || ''}
                    onChange={(e) => setEditAsset({ ...editAsset, location_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="">Select Location</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.building} — {l.area}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">{t('equipment.criticality')}</label>
                  <select
                    value={editAsset.criticality}
                    onChange={(e) => setEditAsset({ ...editAsset, criticality: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">{t('equipment.status')}</label>
                  <select
                    value={editAsset.status}
                    onChange={(e) => setEditAsset({ ...editAsset, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="Active">Active / Running</option>
                    <option value="Down">Down / Out of Service</option>
                    <option value="In Storage">In Storage</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">{t('equipment.runtime_hours')}</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editAsset.runtime_hours}
                    onChange={(e) => setEditAsset({ ...editAsset, runtime_hours: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Description</label>
                <textarea
                  rows="2"
                  value={editAsset.description || ''}
                  onChange={(e) => setEditAsset({ ...editAsset, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditAsset(null); }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium shadow-md shadow-cyan-900/30"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Asset Confirmation Modal */}
      {deleteAssetTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-900/60 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2 bg-red-950 rounded-lg border border-red-800">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-base font-bold text-white">
                {t('equipment.delete_asset')}
              </h3>
            </div>

            <p className="text-xs text-slate-300">
              {t('equipment.delete_asset_confirm', { asset: `${deleteAssetTarget.asset_id} (${deleteAssetTarget.name})` })}
            </p>

            <div className="p-2.5 bg-red-950/40 border border-red-900/50 rounded text-[11px] text-red-300">
              {t('common.delete_warning')}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                disabled={deletingAsset}
                onClick={() => setDeleteAssetTarget(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                disabled={deletingAsset}
                onClick={handleDeleteAsset}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold shadow-md shadow-red-900/40 transition disabled:opacity-50"
              >
                {deletingAsset ? t('common.deleting') : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Printable Modal */}
      <QRCodeModal
        isOpen={Boolean(qrTargetAsset)}
        onClose={() => setQrTargetAsset(null)}
        equipment={qrTargetAsset}
      />

      {/* QR Scanner Camera Modal */}
      <QRScannerModal
        isOpen={showQrScanner}
        onClose={() => setShowQrScanner(false)}
        onScanSuccess={(scannedAssetId) => {
          const match = equipment.find(
            (e) => e.asset_id?.toLowerCase() === scannedAssetId.toLowerCase()
          );
          if (match) {
            openAssetDetail(match);
          } else {
            setSearchTerm(scannedAssetId);
          }
        }}
      />

      {/* Fast Quick-Add Equipment Modal */}
      <EquipmentQuickAddModal
        isOpen={showQuickAddModal}
        onClose={() => setShowQuickAddModal(false)}
        existingEquipment={equipment}
        locations={locations}
        onEquipmentCreated={(newlyCreated) => {
          fetchEquipment();
        }}
      />
    </div>
  );
};
