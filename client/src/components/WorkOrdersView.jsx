import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { 
  CheckSquare, Plus, Clock, AlertTriangle, AlertCircle, Wrench, 
  Play, Pause, CheckCircle2, User, Calendar, DollarSign, Trash2, 
  ShieldCheck, ArrowRight, Layers, Tag, FileText, ChevronRight
} from 'lucide-react';

export const WorkOrdersView = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [workOrders, setWorkOrders] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [techList, setTechList] = useState([]);
  const [catalogParts, setCatalogParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Execution Modal
  const [selectedWo, setSelectedWo] = useState(null);
  const [executionDetails, setExecutionDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [execState, setExecState] = useState({
    status: '',
    actual_hours: 0,
    downtime_minutes: 0,
    root_cause: '',
    resolution_notes: '',
    checklist: [],
  });
  const [savingProgress, setSavingProgress] = useState(false);

  // Add Part Consumed Form
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQty, setPartQty] = useState(1);
  const [addingPart, setAddingPart] = useState(false);

  // New Work Order Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newWo, setNewWo] = useState({
    title: '',
    description: '',
    type: 'Corrective',
    priority: 'Medium',
    equipment_id: '',
    assigned_to: '',
    due_date: new Date().toISOString().split('T')[0],
    estimated_hours: 1.0,
    checklist: [
      { id: 't1', task: '', completed: false }
    ],
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/work-orders', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setWorkOrders(data.work_orders || []);
      }
    } catch (err) {
      console.error('Failed to load work orders', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxiliaryData = async () => {
    try {
      const eqRes = await fetch('/api/equipment', { credentials: 'include' });
      if (eqRes.ok) {
        const eqData = await eqRes.json();
        setEquipmentList(eqData.equipment || []);
      }

      const usersRes = await fetch('/api/users', { credentials: 'include' });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setTechList((usersData.users || []).filter(u => ['technician', 'manager'].includes(u.role)));
      }

      const partsRes = await fetch('/api/parts', { credentials: 'include' });
      if (partsRes.ok) {
        const partsData = await partsRes.json();
        setCatalogParts(partsData.parts || []);
      }
    } catch (err) {
      console.error('Failed to load auxiliary data', err);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
    fetchAuxiliaryData();
  }, []);

  const openExecutionModal = async (wo) => {
    setSelectedWo(wo);
    try {
      setLoadingDetails(true);
      const res = await fetch(`/api/work-orders/${wo.id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setExecutionDetails(data);
        setExecState({
          status: data.work_order.status,
          actual_hours: data.work_order.actual_hours || 0,
          downtime_minutes: data.work_order.downtime_minutes || 0,
          root_cause: data.work_order.root_cause || '',
          resolution_notes: data.work_order.resolution_notes || '',
          checklist: Array.isArray(data.work_order.checklist) ? data.work_order.checklist : [],
        });
      }
    } catch (err) {
      console.error('Failed to load WO details', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleToggleChecklist = (taskIndex) => {
    const updated = [...execState.checklist];
    updated[taskIndex].completed = !updated[taskIndex].completed;
    setExecState({ ...execState, checklist: updated });
  };

  const handleTaskNoteChange = (taskIndex, notes) => {
    const updated = [...execState.checklist];
    updated[taskIndex].notes = notes;
    setExecState({ ...execState, checklist: updated });
  };

  const handleSaveProgress = async (newStatus = null, signoff = false) => {
    if (!selectedWo) return;
    try {
      setSavingProgress(true);
      const payload = {
        status: newStatus || execState.status,
        checklist: execState.checklist,
        actual_hours: parseFloat(execState.actual_hours) || 0,
        downtime_minutes: parseInt(execState.downtime_minutes, 10) || 0,
        root_cause: execState.root_cause,
        resolution_notes: execState.resolution_notes,
      };

      if (signoff) {
        payload.supervisor_signoff = true;
      }

      const res = await fetch(`/api/work-orders/${selectedWo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setExecState((prev) => ({ ...prev, status: data.work_order.status }));
        fetchWorkOrders();
        // Refresh detail
        const refRes = await fetch(`/api/work-orders/${selectedWo.id}`, { credentials: 'include' });
        if (refRes.ok) {
          const refData = await refRes.json();
          setExecutionDetails(refData);
        }
      } else {
        alert('Failed to update work order');
      }
    } catch (err) {
      alert('Server error updating work order');
    } finally {
      setSavingProgress(false);
    }
  };

  const handleAddPartConsumption = async (e) => {
    e.preventDefault();
    if (!selectedWo || !selectedPartId || partQty <= 0) return;
    try {
      setAddingPart(true);
      const res = await fetch(`/api/work-orders/${selectedWo.id}/parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          part_id: parseInt(selectedPartId, 10),
          quantity: parseInt(partQty, 10),
        }),
      });

      if (res.ok) {
        setSelectedPartId('');
        setPartQty(1);
        // Refresh details & parts list
        const refRes = await fetch(`/api/work-orders/${selectedWo.id}`, { credentials: 'include' });
        if (refRes.ok) {
          setExecutionDetails(await refRes.json());
        }
        fetchWorkOrders();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to record part consumption');
      }
    } catch (err) {
      alert('Server error recording part consumption');
    } finally {
      setAddingPart(false);
    }
  };

  const handleRemovePartConsumption = async (partEntryId) => {
    if (!confirm('Remove this part from the work order and return to stock?')) return;
    try {
      const res = await fetch(`/api/work-orders/${selectedWo.id}/parts/${partEntryId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        const refRes = await fetch(`/api/work-orders/${selectedWo.id}`, { credentials: 'include' });
        if (refRes.ok) {
          setExecutionDetails(await refRes.json());
        }
        fetchWorkOrders();
      }
    } catch (err) {
      alert('Error removing consumed part');
    }
  };

  const handleCreateWorkOrder = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!newWo.title || !newWo.equipment_id) {
      setCreateError('Title and equipment are required');
      return;
    }

    const cleanedChecklist = newWo.checklist
      .filter(item => item.task.trim() !== '')
      .map((item, idx) => ({ id: `t${idx + 1}`, task: item.task.trim(), completed: false }));

    try {
      setCreating(true);
      const res = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...newWo,
          checklist: cleanedChecklist,
        }),
      });

      if (res.ok) {
        setShowNewModal(false);
        setNewWo({
          title: '',
          description: '',
          type: 'Corrective',
          priority: 'Medium',
          equipment_id: '',
          assigned_to: '',
          due_date: new Date().toISOString().split('T')[0],
          estimated_hours: 1.0,
          checklist: [{ id: 't1', task: '', completed: false }],
        });
        fetchWorkOrders();
      } else {
        const data = await res.json();
        setCreateError(data.error || 'Failed to create work order');
      }
    } catch (err) {
      setCreateError('Server error creating work order');
    } finally {
      setCreating(false);
    }
  };

  const filteredOrders = workOrders.filter((wo) => {
    if (statusFilter === 'OPEN') return ['Open', 'Assigned'].includes(wo.status);
    if (statusFilter === 'IN_PROGRESS') return wo.status === 'In Progress';
    if (statusFilter === 'COMPLETED') return ['Completed', 'Closed'].includes(wo.status);
    return true;
  });

  const getStatusBadge = (st) => {
    switch (st) {
      case 'In Progress':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-950 text-blue-400 border border-blue-800">{t('work_orders.status_in_progress')}</span>;
      case 'Completed':
      case 'Closed':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">{t('work_orders.status_completed')}</span>;
      case 'On Hold':
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-950 text-amber-300 border border-amber-800">{t('work_orders.status_on_hold')}</span>;
      default:
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-800 text-slate-300 border border-slate-700">{st}</span>;
    }
  };

  const getTypeBadge = (type) => {
    if (type === 'Preventive') {
      return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-purple-950 text-purple-300 border border-purple-800">{t('work_orders.type_preventive')}</span>;
    }
    if (type === 'Corrective') {
      return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-rose-950 text-rose-300 border border-rose-800">{t('work_orders.type_corrective')}</span>;
    }
    return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-800 text-slate-300 border border-slate-700">{type}</span>;
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'Critical':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-950/80 text-red-400 border border-red-800/80">{t('common.critical')}</span>;
      case 'High':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-950/80 text-amber-400 border border-amber-800/80">{t('common.high')}</span>;
      case 'Medium':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-950/80 text-blue-400 border border-blue-800/80">{t('common.medium')}</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-800 text-slate-300 border border-slate-700">{t('common.low')}</span>;
    }
  };

  const canCreate = ['admin', 'manager', 'technician'].includes(user?.role);
  const isSupervisor = ['admin', 'manager'].includes(user?.role);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/15 text-cyan-400 rounded-lg border border-cyan-500/30">
            <CheckSquare size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {user?.role === 'operator' ? t('work_orders.operator_title') : t('work_orders.title')}
            </h1>
            <p className="text-sm text-slate-400">
              {user?.role === 'operator' ? t('work_orders.operator_subtitle') : t('work_orders.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Filter Chips */}
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center gap-1 text-xs font-medium">
            {['ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED'].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-md transition ${
                  statusFilter === f
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f === 'ALL' && t('work_orders.filter_all')}
                {f === 'OPEN' && t('work_orders.filter_open')}
                {f === 'IN_PROGRESS' && t('work_orders.filter_in_progress')}
                {f === 'COMPLETED' && t('work_orders.filter_completed')}
              </button>
            ))}
          </div>

          {canCreate && (
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md shadow-cyan-900/30 transition"
            >
              <Plus size={16} />
              {t('work_orders.new_wo_btn')}
            </button>
          )}
        </div>
      </div>

      {/* Work Orders Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3" />
          {t('common.loading')}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <CheckSquare size={40} className="mx-auto mb-3 text-slate-600" />
          <p className="font-semibold text-slate-300">{t('work_orders.no_orders')}</p>
          <p className="text-xs text-slate-500 mt-1">{t('work_orders.no_orders_sub')}</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-xs border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">{t('work_orders.col_wo_num')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('work_orders.col_title')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('work_orders.col_asset')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('work_orders.col_assignee')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('work_orders.col_priority')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('work_orders.col_status')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('work_orders.col_due_date')}</th>
                  <th className="py-3.5 px-4 text-right font-semibold">{t('work_orders.col_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredOrders.map((wo) => {
                  const hasDowntime = parseInt(wo.downtime_minutes, 10) > 0;
                  return (
                    <tr key={wo.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-4 px-4 font-mono font-bold text-white text-xs">
                        {wo.wo_number}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-white">{wo.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {hasDowntime && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-950/60 border border-red-800/60 px-1.5 py-0.5 rounded">
                              <Clock size={11} /> {wo.downtime_minutes} min down
                            </span>
                          )}
                          {parseInt(wo.parts_used_count, 10) > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-400 bg-cyan-950/40 border border-cyan-800/50 px-1.5 py-0.5 rounded">
                              <Wrench size={11} /> {wo.parts_used_count} parts (${parseFloat(wo.parts_cost_total).toFixed(2)})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-mono text-xs text-cyan-400">{wo.asset_id}</div>
                        <div className="text-xs text-slate-400">{wo.equipment_name}</div>
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-300">
                        {wo.assigned_to_name ? (
                          <div className="flex items-center gap-1.5">
                            <User size={13} className="text-slate-400" />
                            {wo.assigned_to_name}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4 px-4">{getPriorityBadge(wo.priority)}</td>
                      <td className="py-4 px-4">{getStatusBadge(wo.status)}</td>
                      <td className="py-4 px-4 text-xs text-slate-400">
                        {wo.due_date ? new Date(wo.due_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => openExecutionModal(wo)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/60 px-3 py-1.5 rounded-lg transition"
                        >
                          {t('work_orders.view_execute')}
                          <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Work Order Execution Modal */}
      {selectedWo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-cyan-400 text-sm">{selectedWo.wo_number}</span>
                  {getTypeBadge(selectedWo.type)}
                  {getPriorityBadge(selectedWo.priority)}
                  {getStatusBadge(execState.status)}
                </div>
                <h2 className="text-lg font-bold text-white mt-1">{selectedWo.title}</h2>
                <p className="text-xs text-slate-400">
                  {selectedWo.asset_id} • {selectedWo.equipment_name}
                </p>
              </div>
              <button
                onClick={() => { setSelectedWo(null); setExecutionDetails(null); }}
                className="text-slate-400 hover:text-white text-lg font-mono"
              >
                ✕
              </button>
            </div>

            {loadingDetails ? (
              <div className="py-12 text-center text-slate-400">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                {t('common.loading')}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Workflow Status Controls */}
                {['admin', 'manager', 'technician'].includes(user?.role) && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between flex-wrap gap-3">
                    <div className="text-xs font-semibold text-slate-300">
                      Workflow Actions:
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {execState.status !== 'In Progress' && (
                        <button
                          type="button"
                          onClick={() => handleSaveProgress('In Progress')}
                          disabled={savingProgress}
                          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                        >
                          <Play size={13} /> Start Work
                        </button>
                      )}

                      {execState.status === 'In Progress' && (
                        <button
                          type="button"
                          onClick={() => handleSaveProgress('On Hold')}
                          disabled={savingProgress}
                          className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                        >
                          <Pause size={13} /> On Hold (Parts)
                        </button>
                      )}

                      {['In Progress', 'On Hold', 'Assigned'].includes(execState.status) && (
                        <button
                          type="button"
                          onClick={() => handleSaveProgress('Completed')}
                          disabled={savingProgress}
                          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                        >
                          <CheckCircle2 size={13} /> {t('work_orders.complete_wo')}
                        </button>
                      )}

                      {isSupervisor && ['Completed', 'Closed'].includes(execState.status) && !executionDetails?.work_order?.supervisor_signoff_by && (
                        <button
                          type="button"
                          onClick={() => handleSaveProgress('Closed', true)}
                          disabled={savingProgress}
                          className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                        >
                          <ShieldCheck size={13} /> {t('work_orders.signoff_btn')}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Supervisor Sign-Off Notification */}
                {executionDetails?.work_order?.supervisor_signoff_name && (
                  <div className="bg-purple-950/40 border border-purple-800/60 p-3 rounded-lg text-xs text-purple-300 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-purple-400" />
                    <span>
                      Signed off by <strong>{executionDetails.work_order.supervisor_signoff_name}</strong> on {new Date(executionDetails.work_order.supervisor_signoff_at).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Checklist Execution */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckSquare size={16} className="text-cyan-400" />
                    {t('work_orders.checklist_execution')}
                  </h3>

                  {execState.checklist.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No checklist steps attached to this work order.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                      {execState.checklist.map((item, index) => (
                        <div key={item.id || index} className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                          <label className="flex items-start gap-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(item.completed)}
                              onChange={() => handleToggleChecklist(index)}
                              className="mt-0.5 rounded border-slate-700 text-cyan-600 focus:ring-cyan-500"
                            />
                            <div className="flex-1">
                              <span className={`text-xs font-medium ${item.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                {item.task}
                              </span>
                              <input
                                type="text"
                                value={item.notes || ''}
                                onChange={(e) => handleTaskNoteChange(index, e.target.value)}
                                placeholder={t('work_orders.task_notes_placeholder')}
                                className="mt-1.5 w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-cyan-500"
                              />
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Labor Hours & Downtime Logging */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t('work_orders.labor_hours')}
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      value={execState.actual_hours}
                      onChange={(e) => setExecState({ ...execState, actual_hours: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t('work_orders.downtime_minutes')}
                    </label>
                    <input
                      type="number"
                      step="5"
                      min="0"
                      value={execState.downtime_minutes}
                      onChange={(e) => setExecState({ ...execState, downtime_minutes: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t('work_orders.root_cause')}
                    </label>
                    <input
                      type="text"
                      value={execState.root_cause}
                      onChange={(e) => setExecState({ ...execState, root_cause: e.target.value })}
                      placeholder="e.g. Glass chips jammed vacuum cup exhaust line..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t('work_orders.resolution_notes')}
                    </label>
                    <textarea
                      rows={2}
                      value={execState.resolution_notes}
                      onChange={(e) => setExecState({ ...execState, resolution_notes: e.target.value })}
                      placeholder="Describe corrective actions taken, test lites run, and adjustments made..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Parts Consumed Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Wrench size={16} className="text-cyan-400" />
                    {t('work_orders.parts_consumed_title')}
                  </h3>

                  {/* Consumed Parts Table */}
                  {executionDetails?.parts_used?.length > 0 ? (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-2 px-3">Part #</th>
                            <th className="py-2 px-3">Name</th>
                            <th className="py-2 px-3">Qty</th>
                            <th className="py-2 px-3">Unit Cost</th>
                            <th className="py-2 px-3">Total</th>
                            <th className="py-2 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {executionDetails.parts_used.map((pu) => (
                            <tr key={pu.id}>
                              <td className="py-2 px-3 font-mono text-cyan-400">{pu.part_number}</td>
                              <td className="py-2 px-3 text-white">{pu.part_name}</td>
                              <td className="py-2 px-3 font-bold">{pu.quantity}</td>
                              <td className="py-2 px-3">${parseFloat(pu.unit_cost).toFixed(2)}</td>
                              <td className="py-2 px-3 font-semibold text-cyan-400">
                                ${(pu.quantity * parseFloat(pu.unit_cost)).toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemovePartConsumption(pu.id)}
                                  className="text-slate-500 hover:text-red-400 p-1"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No parts charged to this work order yet.</p>
                  )}

                  {/* Add Part Form */}
                  {['admin', 'manager', 'technician'].includes(user?.role) && (
                    <form onSubmit={handleAddPartConsumption} className="flex items-center gap-2 pt-1 flex-wrap">
                      <select
                        value={selectedPartId}
                        onChange={(e) => setSelectedPartId(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="">-- {t('work_orders.select_part')} --</option>
                        {catalogParts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.part_number} - {p.name} (Stock: {p.quantity_on_hand})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        value={partQty}
                        onChange={(e) => setPartQty(e.target.value)}
                        className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 text-center"
                      />

                      <button
                        type="submit"
                        disabled={addingPart || !selectedPartId}
                        className="bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-800/50 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                      >
                        {addingPart ? t('common.loading') : t('work_orders.add_part')}
                      </button>
                    </form>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => { setSelectedWo(null); setExecutionDetails(null); }}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    {t('common.close')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveProgress()}
                    disabled={savingProgress}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-5 py-2 rounded-lg shadow-md shadow-cyan-900/30 transition"
                  >
                    {savingProgress ? t('common.loading') : t('work_orders.save_progress')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Work Order Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Wrench className="text-cyan-400" size={20} />
                {t('work_orders.create_modal_title')}
              </h2>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-white text-lg font-mono"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="mb-4 bg-red-950/50 border border-red-800 text-red-300 text-xs p-3 rounded-lg">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateWorkOrder} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t('work_orders.equipment')} *
                  </label>
                  <select
                    value={newWo.equipment_id}
                    onChange={(e) => setNewWo({ ...newWo, equipment_id: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- {t('parts_requests.select_machine')} --</option>
                    {equipmentList.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.asset_id} - {eq.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t('work_orders.type')}
                  </label>
                  <select
                    value={newWo.type}
                    onChange={(e) => setNewWo({ ...newWo, type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Corrective">{t('work_orders.type_corrective')}</option>
                    <option value="Preventive">{t('work_orders.type_preventive')}</option>
                    <option value="Inspection">{t('work_orders.type_inspection')}</option>
                    <option value="Request">{t('work_orders.type_request')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Work Order Title *
                </label>
                <input
                  type="text"
                  value={newWo.title}
                  onChange={(e) => setNewWo({ ...newWo, title: e.target.value })}
                  placeholder="e.g. Cutting Table Carriage Guide Jammed"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Detailed Description
                </label>
                <textarea
                  value={newWo.description}
                  onChange={(e) => setNewWo({ ...newWo, description: e.target.value })}
                  rows={2}
                  placeholder="Observed symptoms, error codes, production stoppage..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t('work_orders.priority')}
                  </label>
                  <select
                    value={newWo.priority}
                    onChange={(e) => setNewWo({ ...newWo, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Critical">Critical (Line Down)</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t('work_orders.assigned_tech')}
                  </label>
                  <select
                    value={newWo.assigned_to}
                    onChange={(e) => setNewWo({ ...newWo, assigned_to: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- Unassigned --</option>
                    {techList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name} ({t.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t('work_orders.due_date')}
                  </label>
                  <input
                    type="date"
                    value={newWo.due_date}
                    onChange={(e) => setNewWo({ ...newWo, due_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold px-5 py-2 rounded-lg shadow-md shadow-cyan-900/30 transition"
                >
                  {creating ? t('common.loading') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
