import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart3, TrendingUp, DollarSign, Clock, CheckCircle2, 
  AlertTriangle, Shield, User, Wrench, ArrowUpRight, Award, Layers
} from 'lucide-react';

export const AnalyticsView = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/analytics', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading && !data) {
    return (
      <div className="py-24 text-center text-slate-400 flex flex-col items-center">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">{t('common.loading')}</p>
      </div>
    );
  }

  const { compliance, reliability, maintenance_costs, technician_productivity, top_consumed_parts } = data || {};

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <BarChart3 size={26} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {t('analytics.title')}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('analytics.subtitle')}
            </p>
          </div>
        </div>

        <button
          onClick={fetchAnalytics}
          className="self-start md:self-auto bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2"
        >
          <TrendingUp size={14} className="text-emerald-400" /> Refresh Metrics
        </button>
      </div>

      {/* Top Row: PM Compliance & Quick Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Compliance Rate */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg flex flex-col justify-between md:col-span-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>{t('analytics.pm_compliance')}</span>
            <Award size={18} className="text-emerald-400" />
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="text-4xl font-extrabold text-emerald-400 tracking-tight">
                {compliance?.pm_compliance_percentage}%
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Completed on schedule vs. nominal due dates
              </div>
            </div>

            <div className="text-right space-y-1 text-xs">
              <div className="text-slate-300">
                On-Time: <strong className="text-emerald-400">{compliance?.on_time_pm_wos}</strong>
              </div>
              <div className="text-slate-300">
                Total Closed: <strong>{compliance?.completed_pm_wos}</strong>
              </div>
              {compliance?.overdue_open_pms > 0 && (
                <div className="text-red-400 font-bold">
                  {compliance?.overdue_open_pms} Overdue Open PMs
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Total Maintenance Cost */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Plant Maintenance Spend</span>
            <DollarSign size={18} className="text-blue-400" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              ${(maintenance_costs || []).reduce((acc, c) => acc + c.total_maintenance_cost, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Labor hours + consumed spare parts
            </div>
          </div>
        </div>

        {/* Total Labor Hours */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Technician Labor Hours</span>
            <Clock size={18} className="text-purple-400" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {(maintenance_costs || []).reduce((acc, c) => acc + c.labor_hours, 0).toFixed(1)} <span className="text-sm font-normal text-slate-500">hrs</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Recorded on closed & active work orders
            </div>
          </div>
        </div>
      </div>

      {/* Asset Reliability Table (MTBF & MTTR) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {t('analytics.reliability_title')}
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            MTBF: Mean Time Between Failures • MTTR: Mean Time to Repair
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Asset</th>
                <th className="py-2.5 px-3">Operating Hours</th>
                <th className="py-2.5 px-3">{t('analytics.failures_count')}</th>
                <th className="py-2.5 px-3">{t('analytics.total_downtime')}</th>
                <th className="py-2.5 px-3 text-emerald-400">{t('analytics.mtbf')}</th>
                <th className="py-2.5 px-3 text-blue-400">{t('analytics.mttr')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {reliability && reliability.map((r) => (
                <tr key={r.equipment_id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3">
                    <div className="font-mono font-bold text-white">{r.asset_id}</div>
                    <div className="text-slate-400 text-[11px]">{r.name}</div>
                  </td>
                  <td className="py-3 px-3 font-mono">{r.runtime_hours.toLocaleString()} hrs</td>
                  <td className="py-3 px-3 font-bold">
                    {r.failures > 0 ? (
                      <span className="text-amber-400 font-bold">{r.failures}</span>
                    ) : (
                      <span className="text-slate-500">0</span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono">
                    {r.total_downtime_minutes > 0 ? (
                      <span className="text-red-400 font-semibold">{r.total_downtime_minutes} mins</span>
                    ) : (
                      <span className="text-slate-500">0 mins</span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                    {r.mtbf_hours.toLocaleString()} hrs
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-blue-400">
                    {r.mttr_hours > 0 ? `${r.mttr_hours} hrs` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Maintenance Cost Rollup by Equipment */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <DollarSign size={20} className="text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {t('analytics.cost_title')}
            </h2>
          </div>
          <span className="text-xs text-slate-400">Standard labor rate: $65/hr</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Equipment</th>
                <th className="py-2.5 px-3">Work Orders</th>
                <th className="py-2.5 px-3">{t('analytics.labor_hours')}</th>
                <th className="py-2.5 px-3">{t('analytics.labor_cost')}</th>
                <th className="py-2.5 px-3">{t('analytics.parts_spend')}</th>
                <th className="py-2.5 px-3 text-right font-bold text-white">{t('analytics.total_cost')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {maintenance_costs && maintenance_costs.map((c) => (
                <tr key={c.equipment_id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3">
                    <div className="font-mono font-bold text-white">{c.asset_id}</div>
                    <div className="text-slate-400 text-[11px]">{c.name}</div>
                  </td>
                  <td className="py-3 px-3 font-semibold">{c.work_orders_count}</td>
                  <td className="py-3 px-3 font-mono">{c.labor_hours.toFixed(2)} hrs</td>
                  <td className="py-3 px-3 font-mono">${c.labor_cost.toFixed(2)}</td>
                  <td className="py-3 px-3 font-mono text-emerald-400">${c.parts_spend.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-white">
                    ${c.total_maintenance_cost.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Grid: Technician Productivity & Top Parts Consumed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technician Productivity */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <User size={18} className="text-purple-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {t('analytics.tech_productivity')}
            </h2>
          </div>

          <div className="space-y-3">
            {technician_productivity && technician_productivity.map((tp) => (
              <div key={tp.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white">{tp.full_name}</div>
                  <div className="text-xs text-slate-400 capitalize">{tp.role}</div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <div className="text-xs text-slate-400">Closed WOs</div>
                    <div className="text-sm font-bold text-emerald-400">{tp.closed_count} / {tp.total_assigned}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Hours Logged</div>
                    <div className="text-sm font-bold text-purple-400 font-mono">{parseFloat(tp.total_logged_hours).toFixed(1)}h</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Consumed Parts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Wrench size={18} className="text-amber-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {t('analytics.top_parts_title')}
            </h2>
          </div>

          {!top_consumed_parts || top_consumed_parts.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">No parts consumed against work orders yet.</p>
          ) : (
            <div className="space-y-3">
              {top_consumed_parts.map((part) => (
                <div key={part.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="font-mono text-xs font-bold text-emerald-400">{part.part_number}</div>
                    <div className="text-xs font-semibold text-white mt-0.5">{part.name}</div>
                    <div className="text-[11px] text-slate-400">Stock remaining: {part.quantity_on_hand}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white font-mono">${parseFloat(part.total_spent).toFixed(2)}</div>
                    <div className="text-xs text-slate-400">{part.total_units_consumed} units consumed</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
