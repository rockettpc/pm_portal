import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { 
  Package, Plus, AlertCircle, Camera, CheckCircle2, Clock, 
  Filter, MessageSquare, ExternalLink, Image as ImageIcon, ShieldAlert,
  ChevronRight, CheckSquare, XCircle, ArrowRight
} from 'lucide-react';

export const PartsRequestsView = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [requests, setRequests] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [catalogParts, setCatalogParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');

  // Submit Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [formData, setFormData] = useState({
    equipment_id: '',
    part_id: '',
    part_description: '',
    quantity: 1,
    urgency: 'Normal',
    reason: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Review Modal (Manager / Admin)
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('Approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Photo Lightbox
  const [activePhotoUrl, setActivePhotoUrl] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/parts-requests', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests);
      }
    } catch (e) {
      console.error('Failed to load parts requests', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxData = async () => {
    try {
      const [eqRes, partsRes] = await Promise.all([
        fetch('/api/equipment', { credentials: 'include' }),
        fetch('/api/parts', { credentials: 'include' }),
      ]);
      if (eqRes.ok) {
        const eqData = await eqRes.json();
        setEquipmentList(eqData.equipment);
        // Pre-select first assigned machine for operator
        if (user?.role === 'operator' && eqData.equipment.length > 0) {
          setFormData((prev) => ({ ...prev, equipment_id: eqData.equipment[0].id }));
        }
      }
      if (partsRes.ok) {
        const pData = await partsRes.json();
        setCatalogParts(pData.parts);
      }
    } catch (e) {
      console.error('Failed to load aux data', e);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchAuxData();
  }, []);

  const handleCatalogPartSelect = (partId) => {
    if (!partId) {
      setFormData({ ...formData, part_id: '', part_description: '' });
      return;
    }
    const found = catalogParts.find((p) => String(p.id) === String(partId));
    if (found) {
      setFormData({
        ...formData,
        part_id: found.id,
        part_description: `${found.part_number} - ${found.name}`,
      });
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);
    try {
      const formPayload = new FormData();
      formPayload.append('equipment_id', formData.equipment_id);
      if (formData.part_id) formPayload.append('part_id', formData.part_id);
      formPayload.append('part_description', formData.part_description);
      formPayload.append('quantity', formData.quantity);
      formPayload.append('urgency', formData.urgency);
      if (formData.reason) formPayload.append('reason', formData.reason);
      if (photoFile) formPayload.append('photo', photoFile);

      const res = await fetch('/api/parts-requests', {
        method: 'POST',
        body: formPayload,
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit request');

      setShowNewModal(false);
      setFormData({
        equipment_id: equipmentList.length > 0 ? equipmentList[0].id : '',
        part_id: '',
        part_description: '',
        quantity: 1,
        urgency: 'Normal',
        reason: '',
      });
      setPhotoFile(null);
      fetchRequests();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/parts-requests/${selectedRequest.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: reviewStatus, review_notes: reviewNotes }),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update status');
      }

      setSelectedRequest(null);
      setReviewNotes('');
      fetchRequests();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (urgencyFilter === 'ALL') return true;
    return r.urgency === urgencyFilter;
  });

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'Urgent':
        return (
          <span className="inline-flex items-center gap-1 font-bold text-[11px] px-2.5 py-0.5 rounded-full bg-red-950/80 text-red-400 border border-red-800 animate-pulse">
            <AlertCircle size={12} /> {t('parts_requests.urgency_urgent')}
          </span>
        );
      case 'Normal':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-950/60 text-blue-300 border border-blue-800">
            {t('parts_requests.urgency_normal')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            {t('parts_requests.urgency_low')}
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
      case 'Fulfilled':
        return <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-semibold">{status}</span>;
      case 'Ordered':
        return <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700 font-semibold">{status}</span>;
      case 'Under Review':
        return <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 font-semibold">{status}</span>;
      case 'Denied':
        return <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-700 font-semibold">{status}</span>;
      default:
        return <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & New Request Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Package size={24} className="text-emerald-400" />
            {user?.role === 'operator' ? t('parts_requests.operator_title') : t('parts_requests.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {user?.role === 'operator' ? t('parts_requests.operator_subtitle') : t('parts_requests.subtitle')}
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-md transition"
        >
          <Plus size={16} />
          {t('parts_requests.new_request_btn')}
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <span className="text-xs text-slate-400 font-semibold">Filter:</span>
          <button
            onClick={() => setUrgencyFilter('ALL')}
            className={`px-2.5 py-1 rounded text-xs transition ${urgencyFilter === 'ALL' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
          >
            {t('parts_requests.filter_all')}
          </button>
          <button
            onClick={() => setUrgencyFilter('Urgent')}
            className={`px-2.5 py-1 rounded text-xs transition flex items-center gap-1 ${urgencyFilter === 'Urgent' ? 'bg-red-950 text-red-300 border border-red-800 font-semibold' : 'text-slate-400 hover:text-red-300'}`}
          >
            <AlertCircle size={12} />
            {t('parts_requests.filter_urgent')}
          </button>
        </div>

        <span className="text-xs text-slate-500 font-mono">
          {filteredRequests.length} requests
        </span>
      </div>

      {/* Requests Table / Cards */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">{t('common.loading')}</div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center text-slate-400 text-sm">
          {t('parts_requests.no_requests')}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className={`bg-slate-900 border rounded-xl p-4 sm:p-5 shadow-lg transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                req.urgency === 'Urgent' ? 'border-red-900/60 bg-gradient-to-r from-red-950/20 to-slate-900' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-2 flex-1">
                {/* Header row with tags */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-200 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {req.request_number}
                  </span>
                  <span className="font-mono text-xs text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    {req.asset_id}
                  </span>
                  {getUrgencyBadge(req.urgency)}
                  <div>{getStatusBadge(req.status)}</div>
                </div>

                {/* Main description and machine */}
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="text-emerald-400 font-mono">[{req.quantity}x]</span>
                    {req.part_description}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Machine: <strong className="text-slate-200">{req.equipment_name}</strong> • Requested by: <span className="text-slate-300">{req.requester_name}</span>
                  </p>
                </div>

                {/* Reason */}
                {req.reason && (
                  <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="text-slate-500 font-semibold block text-[10px] uppercase">Reason / Symptoms:</span>
                    {req.reason}
                  </div>
                )}

                {/* Reviewer Note if available */}
                {req.review_notes && (
                  <div className="text-xs text-purple-300 bg-purple-950/30 p-2 rounded border border-purple-800/50 flex items-start gap-1.5">
                    <MessageSquare size={14} className="mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-[10px] uppercase block">Reviewer Note ({req.reviewer_name || 'Manager'}):</span>
                      {req.review_notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Photos & Review Action buttons */}
              <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                {/* Photo thumbnails */}
                {req.photos && req.photos.length > 0 && (
                  <div className="flex gap-1.5">
                    {req.photos.map((ph) => (
                      <button
                        key={ph.id}
                        type="button"
                        onClick={() => setActivePhotoUrl(`/api/parts-requests/photos/${ph.id}`)}
                        className="relative group rounded-lg overflow-hidden border border-slate-700 hover:border-emerald-500 transition"
                        title="View photo"
                      >
                        <img
                          src={`/api/parts-requests/photos/${ph.id}`}
                          alt="Failure attachment"
                          className="w-14 h-14 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                          <ExternalLink size={14} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Manager / Admin status changer */}
                {['admin', 'manager'].includes(user?.role) && (
                  <button
                    onClick={() => {
                      setSelectedRequest(req);
                      setReviewStatus(req.status);
                      setReviewNotes(req.review_notes || '');
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-lg text-xs font-semibold transition"
                  >
                    {t('parts_requests.review_btn')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Parts Request Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Package size={18} className="text-emerald-400" />
                {t('parts_requests.modal_title')}
              </h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {submitError && (
              <div className="p-3 bg-red-950/60 border border-red-800 rounded text-xs text-red-300">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmitRequest} className="space-y-3 text-xs">
              {/* Target Machine */}
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  {t('parts_requests.select_machine')} *
                </label>
                <select
                  required
                  value={formData.equipment_id}
                  onChange={(e) => setFormData({ ...formData, equipment_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-2 text-slate-200 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Machine --</option>
                  {equipmentList.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.asset_id} — {eq.name} ({eq.area || 'Anaheim Plant'})
                    </option>
                  ))}
                </select>
                {user?.role === 'operator' && (
                  <span className="text-[10px] text-emerald-400 mt-1 block">
                    ✓ Scoped to your assigned machinery
                  </span>
                )}
              </div>

              {/* Select from catalog */}
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  {t('parts_requests.select_catalog')}
                </label>
                <select
                  value={formData.part_id}
                  onChange={(e) => handleCatalogPartSelect(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-300"
                >
                  <option value="">-- Custom / Non-Catalog Item --</option>
                  {catalogParts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.part_number} — {p.name} ({p.quantity_on_hand} in stock)
                    </option>
                  ))}
                </select>
              </div>

              {/* Part Description */}
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  {t('parts_requests.or_describe')}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 135 deg Tungsten Scoring Wheel or 1/2in Air Solenoid"
                  value={formData.part_description}
                  onChange={(e) => setFormData({ ...formData, part_description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>

              {/* Quantity & Urgency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    {t('parts_requests.quantity')} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    {t('parts_requests.urgency')} *
                  </label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Urgent">Urgent (Down / Chipping)</option>
                    <option value="Low">Low (Future PM)</option>
                  </select>
                </div>
              </div>

              {/* Failure Symptoms / Reason */}
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  {t('parts_requests.reason')}
                </label>
                <textarea
                  rows="2"
                  placeholder={t('parts_requests.reason_placeholder')}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>

              {/* Photo Upload with Phone Camera Support */}
              <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 space-y-1">
                <label className="block text-slate-300 font-semibold flex items-center gap-1.5">
                  <Camera size={14} className="text-emerald-400" />
                  {t('parts_requests.photo_label')}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setPhotoFile(e.target.files[0])}
                  className="text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
                />
                <p className="text-[10px] text-slate-500">
                  {t('parts_requests.photo_help')}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium shadow disabled:opacity-50"
                >
                  {submitting ? t('parts_requests.submitting') : t('parts_requests.submit_btn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal (Manager / Admin) */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="font-mono text-xs text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  {selectedRequest.request_number}
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  {t('parts_requests.review_modal_title')}
                </h3>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="text-xs space-y-2 bg-slate-950 p-3 rounded border border-slate-800">
              <div><strong>Machine:</strong> {selectedRequest.equipment_name} ({selectedRequest.asset_id})</div>
              <div><strong>Part:</strong> {selectedRequest.part_description} (Qty: {selectedRequest.quantity})</div>
              <div><strong>Requester:</strong> {selectedRequest.requester_name}</div>
              {selectedRequest.reason && <div><strong>Symptoms:</strong> {selectedRequest.reason}</div>}
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Requisition Decision *</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-semibold"
                >
                  <option value="Under Review">Under Review</option>
                  <option value="Approved">Approved (Ready for Stock/Order)</option>
                  <option value="Ordered">Ordered (PO Dispatched to Vendor)</option>
                  <option value="Received">Received (In Stock at Plant)</option>
                  <option value="Fulfilled">Fulfilled (Installed on Machine)</option>
                  <option value="Denied">Denied</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  {t('parts_requests.reviewer_notes')}
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Approved. Pulled 2 from Bin A-04; remaining 1 ordered via Bystronic."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium shadow disabled:opacity-50"
                >
                  {updatingStatus ? 'Saving...' : t('parts_requests.update_status_btn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Photo */}
      {activePhotoUrl && (
        <div 
          onClick={() => setActivePhotoUrl(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
            <img src={activePhotoUrl} alt="Compressed failure photo" className="object-contain max-h-[85vh] w-auto" />
            <button
              onClick={() => setActivePhotoUrl(null)}
              className="absolute top-3 right-3 bg-black/60 hover:bg-black text-white p-1.5 rounded-full text-sm font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
