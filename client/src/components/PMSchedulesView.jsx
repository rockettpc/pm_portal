import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, Clock, CheckCircle2, AlertTriangle, AlertCircle, Plus, 
  RefreshCw, Play, Wrench, Shield, CheckSquare, Trash2, ChevronRight, Gauge
} from 'lucide-react';

export const PMSchedulesView = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [schedules, setSchedules] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [techList, setTechList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  // New Schedule Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    equipment_id: '',
    title: '',
    description: '',
    trigger_type: 'calendar',
    calendar_interval_days: 30,
    meter_interval_hours: 500,
    estimated_duration_hours: 1.5,
    priority: 'Medium',
    assigned_to: '',
    checklist: [
      { id: 't1', task: '', completed: false }
    ],
  });
  const [addError, setAddError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/pm-schedules', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSchedules(data.schedules);
      }
    } catch (err) {
      console.error('Failed to load PM schedules', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipmentAndTechs = async () => {
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
    } catch (err) {
      console.error('Failed to load auxiliary data', err);
    }
  };

  useEffect(() => {
    fetchSchedules();
    fetchEquipmentAndTechs();
  }, []);

  const handleScanDue = async () => {
    try {
      setScanning(true);
      setScanMessage('');
      const res = await fetch('/api/pm-schedules/check-due', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setScanMessage(data.message);
        fetchSchedules();
      } else {
        setScanMessage(data.error || 'Failed to scan due PMs');
      }
    } catch (err) {
      setScanMessage('Server error scanning due PMs');
    } finally {
      setScanning(false);
    }
  };

  const handleTriggerNow = async (scheduleId) => {
    try {
      const res = await fetch(`/api/pm-schedules/${scheduleId}/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchSchedules();
      } else {
        alert(data.error || 'Failed to generate work order');
      }
    } catch (err) {
      alert('Server error generating work order');
    }
  };

  const handleAddChecklistTask = () => {
    const nextId = `t${newSchedule.checklist.length + 1}`;
    setNewSchedule({
      ...newSchedule,
      checklist: [...newSchedule.checklist, { id: nextId, task: '', completed: false }],
    });
  };

  const handleRemoveChecklistTask = (index) => {
    const updated = newSchedule.checklist.filter((_, i) => i !== index);
    setNewSchedule({ ...newSchedule, checklist: updated });
  };

  const handleChecklistChange = (index, value) => {
    const updated = [...newSchedule.checklist];
    updated[index].task = value;
    setNewSchedule({ ...newSchedule, checklist: updated });
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    setAddError('');
    if (!newSchedule.equipment_id || !newSchedule.title) {
      setAddError('Equipment and title are required');
      return;
    }

    const cleanedChecklist = newSchedule.checklist
      .filter(item => item.task.trim() !== '')
      .map((item, idx) => ({ id: `t${idx + 1}`, task: item.task.trim(), completed: false }));

    try {
      setSaving(true);
      const res = await fetch('/api/pm-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...newSchedule,
          checklist: cleanedChecklist,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewSchedule({
          equipment_id: '',
          title: '',
          description: '',
          trigger_type: 'calendar',
          calendar_interval_days: 30,
          meter_interval_hours: 500,
          estimated_duration_hours: 1.5,
          priority: 'Medium',
          assigned_to: '',
          checklist: [{ id: 't1', task: '', completed: false }],
        });
        fetchSchedules();
      } else {
        const data = await res.json();
        setAddError(data.error || 'Failed to create schedule');
      }
    } catch (err) {
      setAddError('Server error creating PM schedule');
    } finally {
      setSaving(false);
    }
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

  const getStatusBadge = (sch) => {
    if (sch.is_overdue) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-red-950 text-red-400 border border-red-700 animate-pulse">
          <AlertCircle size={12} /> {t('pm_schedules.status_overdue')}
        </span>
      );
    }
    if (sch.is_due_soon) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-amber-950 text-amber-300 border border-amber-700">
          <Clock size={12} /> {t('pm_schedules.status_due_soon')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
        <CheckCircle2 size={12} /> {t('pm_schedules.status_on_track')}
      </span>
    );
  };

  const canManage = ['admin', 'manager'].includes(user?.role);

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/15 text-cyan-400 rounded-lg border border-cyan-500/30">
              <Calendar size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                {user?.role === 'operator' ? t('pm_schedules.operator_title') : t('pm_schedules.title')}
              </h1>
              <p className="text-sm text-slate-400">
                {user?.role === 'operator' ? t('pm_schedules.operator_subtitle') : t('pm_schedules.subtitle')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {canManage && (
            <>
              <button
                onClick={handleScanDue}
                disabled={scanning}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-lg text-sm font-medium transition"
              >
                <RefreshCw size={16} className={scanning ? 'animate-spin text-cyan-400' : 'text-slate-400'} />
                {scanning ? t('pm_schedules.scanning') : t('pm_schedules.check_due_btn')}
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md shadow-cyan-900/30 transition"
              >
                <Plus size={16} />
                {t('pm_schedules.new_schedule_btn')}
              </button>
            </>
          )}
        </div>
      </div>

      {scanMessage && (
        <div className="bg-cyan-950/40 border border-cyan-800/60 p-4 rounded-xl text-sm text-cyan-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-cyan-400 shrink-0" />
            <span>{scanMessage}</span>
          </div>
          <button onClick={() => setScanMessage('')} className="text-xs text-slate-400 hover:text-white underline">
            {t('common.close')}
          </button>
        </div>
      )}

      {/* Schedules Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3" />
          {t('common.loading')}
        </div>
      ) : schedules.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
          <Calendar size={48} className="mx-auto mb-3 text-slate-600" />
          <p className="text-base font-medium text-slate-300">{t('pm_schedules.no_schedules')}</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/70 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">{t('pm_schedules.schedule_code')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('pm_schedules.equipment')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('pm_schedules.cadence')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('pm_schedules.next_due')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('pm_schedules.priority')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('pm_schedules.assigned_to')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('pm_schedules.status')}</th>
                  <th className="py-3.5 px-4 font-semibold text-right">{t('work_orders.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {schedules.map((sch) => {
                  const checklistLength = Array.isArray(sch.checklist) ? sch.checklist.length : 0;
                  return (
                    <tr key={sch.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-4 px-4">
                        <div className="font-mono font-bold text-cyan-400 text-xs">{sch.schedule_code}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <CheckSquare size={12} /> {checklistLength} {t('pm_schedules.tasks_count')}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-white">{sch.title}</div>
                        <div className="text-xs text-slate-400 font-mono">
                          {sch.asset_id} • {sch.equipment_name}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs">
                        {['calendar', 'both'].includes(sch.trigger_type) && sch.calendar_interval_days && (
                          <div className="flex items-center gap-1 text-slate-300">
                            <Calendar size={12} className="text-cyan-400" />
                            <span>Every {sch.calendar_interval_days} days</span>
                          </div>
                        )}
                        {['meter', 'both'].includes(sch.trigger_type) && sch.meter_interval_hours && (
                          <div className="flex items-center gap-1 text-slate-400 mt-0.5">
                            <Gauge size={12} className="text-blue-400" />
                            <span>Every {sch.meter_interval_hours} hrs</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className={`text-xs font-semibold ${sch.is_overdue ? 'text-red-400 font-bold' : sch.is_due_soon ? 'text-amber-300 font-bold' : 'text-slate-300'}`}>
                          {sch.next_due_date ? new Date(sch.next_due_date).toLocaleDateString() : '—'}
                        </div>
                        {sch.next_due_meter && (
                          <div className="text-[11px] text-slate-400 font-mono">
                            {sch.next_due_meter} hrs
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">{getPriorityBadge(sch.priority)}</td>
                      <td className="py-4 px-4 text-xs text-slate-300">
                        {sch.assigned_to_name || <span className="text-slate-500 italic">Unassigned</span>}
                      </td>
                      <td className="py-4 px-4">{getStatusBadge(sch)}</td>
                      <td className="py-4 px-4 text-right">
                        {['admin', 'manager', 'technician'].includes(user?.role) && (
                          <button
                            onClick={() => handleTriggerNow(sch.id)}
                            title={t('pm_schedules.trigger_wo_btn')}
                            className="inline-flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/60 px-2.5 py-1.5 rounded-lg transition"
                          >
                            <Play size={12} />
                            {t('pm_schedules.trigger_wo_btn')}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New PM Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="text-cyan-400" size={20} />
                {t('pm_schedules.modal_title')}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-lg font-mono"
              >
                ✕
              </button>
            </div>

            {addError && (
              <div className="mb-4 bg-red-950/50 border border-red-800 text-red-300 text-xs p-3 rounded-lg">
                {addError}
              </div>
            )}

            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t('pm_schedules.equipment')} *
                  </label>
                  <select
                    value={newSchedule.equipment_id}
                    onChange={(e) => setNewSchedule({ ...newSchedule, equipment_id: e.target.value })}
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
                    {t('pm_schedules.assigned_to')}
                  </label>
                  <select
                    value={newSchedule.assigned_to}
                    onChange={(e) => setNewSchedule({ ...newSchedule, assigned_to: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- Unassigned --</option>
                    {techList.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.full_name} ({tech.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  PM Title *
                </label>
                <input
                  type="text"
                  value={newSchedule.title}
                  onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                  placeholder="e.g. Weekly Cutting Head Inspection & Lubrication"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Description / Objective
                </label>
                <textarea
                  value={newSchedule.description}
                  onChange={(e) => setNewSchedule({ ...newSchedule, description: e.target.value })}
                  rows={2}
                  placeholder="Provide scope, required tools, safety precautions..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t('pm_schedules.trigger_type')}
                  </label>
                  <select
                    value={newSchedule.trigger_type}
                    onChange={(e) => setNewSchedule({ ...newSchedule, trigger_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="calendar">Calendar (Days)</option>
                    <option value="meter">Meter (Hours)</option>
                    <option value="both">Both (Whichever First)</option>
                  </select>
                </div>

                {['calendar', 'both'].includes(newSchedule.trigger_type) && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Days Cadence
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newSchedule.calendar_interval_days}
                      onChange={(e) => setNewSchedule({ ...newSchedule, calendar_interval_days: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}

                {['meter', 'both'].includes(newSchedule.trigger_type) && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Operating Hours
                    </label>
                    <input
                      type="number"
                      min="10"
                      step="10"
                      value={newSchedule.meter_interval_hours}
                      onChange={(e) => setNewSchedule({ ...newSchedule, meter_interval_hours: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t('pm_schedules.priority')}
                  </label>
                  <select
                    value={newSchedule.priority}
                    onChange={(e) => setNewSchedule({ ...newSchedule, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              {/* Checklist Builder */}
              <div className="border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-200">
                    {t('pm_schedules.checklist_title')}
                  </label>
                  <button
                    type="button"
                    onClick={handleAddChecklistTask}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    {t('pm_schedules.add_task_btn')}
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {newSchedule.checklist.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-mono w-6">{index + 1}.</span>
                      <input
                        type="text"
                        value={item.task}
                        onChange={(e) => handleChecklistChange(index, e.target.value)}
                        placeholder={t('pm_schedules.task_placeholder')}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                      {newSchedule.checklist.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveChecklistTask(index)}
                          className="text-slate-500 hover:text-red-400 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold px-5 py-2 rounded-lg shadow-md shadow-cyan-900/30 transition"
                >
                  {saving ? t('common.loading') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
