import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { 
  Activity, CheckCircle2, AlertOctagon, Clock, Wrench, Package, 
  RefreshCw, ChevronRight, HardHat, AlertTriangle, ArrowUpRight, Zap
} from 'lucide-react';

export const DashboardView = ({ setActiveTab }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [daysWindow, setDaysWindow] = useState(30);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchOverview = async () => {
    try {
      const res = await fetch(`/api/dashboard/overview?days=${daysWindow}`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Failed to load dashboard overview', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [daysWindow]);

  // 30s auto-refresh timer
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchOverview();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, daysWindow]);

  const getStatusDot = (status) => {
    switch (status) {
      case 'Active':
        return (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        );
      case 'Down':
        return (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        );
      default:
        return <span className="inline-flex rounded-full h-3 w-3 bg-slate-500"></span>;
    }
  };

  const getUptimeColor = (pct) => {
    if (pct >= 98.0) return 'text-emerald-400';
    if (pct >= 90.0) return 'text-amber-400';
    return 'text-red-400';
  };

  if (loading && !data) {
    return (
      <div className="py-24 text-center text-slate-400 flex flex-col items-center">
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">{t('common.loading')}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-24 text-center text-slate-400 flex flex-col items-center">
        <AlertTriangle size={32} className="text-amber-400 mb-3" />
        <p className="text-sm font-semibold text-slate-200">Unable to load dashboard data</p>
        <button
          onClick={fetchOverview}
          className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-400 border border-slate-700 rounded-lg transition"
        >
          {t('dashboard.refresh_now')}
        </button>
      </div>
    );
  }

  const { summary, equipment_by_area, recently_down, open_parts_requests } = data;
  const recentlyDown = recently_down || [];

  return (
    <div className="space-y-6">
      {/* Top Wallboard Header & Live Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-cyan-500/15 text-cyan-400 rounded-xl border border-cyan-500/30">
            <Activity size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-white tracking-tight">
                {t('dashboard.title')}
              </h1>
              <span className="inline-flex items-center gap-1.5 bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> Live Wallboard
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('dashboard.subtitle')} • Last ping {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Action Controls: Window & Refresh */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center gap-1 text-xs">
            <button
              onClick={() => setDaysWindow(1)}
              className={`px-3 py-1.5 rounded-md transition ${daysWindow === 1 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              {t('dashboard.window_today')}
            </button>
            <button
              onClick={() => setDaysWindow(7)}
              className={`px-3 py-1.5 rounded-md transition ${daysWindow === 7 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              {t('dashboard.window_7d')}
            </button>
            <button
              onClick={() => setDaysWindow(30)}
              className={`px-3 py-1.5 rounded-md transition ${daysWindow === 30 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold' : 'text-slate-400 hover:text-white'}`}
            >
              {t('dashboard.window_30d')}
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-slate-700 text-cyan-600 focus:ring-cyan-500"
            />
            {t('dashboard.auto_refresh_30s')}
          </label>

          <button
            onClick={fetchOverview}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          >
            <RefreshCw size={13} className="text-cyan-400" />
            {t('dashboard.refresh_now')}
          </button>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Shop Uptime % */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>{t('dashboard.overall_uptime')}</span>
            <Zap size={16} className="text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className={`text-3xl font-extrabold tracking-tight ${getUptimeColor(summary?.shop_uptime_percentage || 0)}`}>
              {summary?.shop_uptime_percentage}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Nominal {daysWindow}-day availability
            </div>
          </div>
        </div>

        {/* Active Machines */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>{t('dashboard.active_machinery')}</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {summary?.total_active} <span className="text-sm font-normal text-slate-500">/ {summary?.total_equipment}</span>
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Operating Normally
            </div>
          </div>
        </div>

        {/* Currently Down */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>{t('dashboard.down_machinery')}</span>
            <AlertOctagon size={16} className={summary?.total_down > 0 ? 'text-red-400 animate-pulse' : 'text-slate-500'} />
          </div>
          <div className="mt-3">
            <div className={`text-3xl font-extrabold tracking-tight ${summary?.total_down > 0 ? 'text-red-400' : 'text-slate-300'}`}>
              {summary?.total_down}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {summary?.total_down > 0 ? 'Unscheduled stoppage' : 'Zero outages active'}
            </div>
          </div>
        </div>

        {/* Open Work Orders */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>{t('dashboard.open_wos')}</span>
            <Wrench size={16} className="text-blue-400" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {summary?.open_work_orders}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Active maintenance tasks
            </div>
          </div>
        </div>

        {/* Pending Requisitions */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>{t('dashboard.pending_requests')}</span>
            <Package size={16} className="text-purple-400" />
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {summary?.pending_parts_requests}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Awaiting review / order
            </div>
          </div>
        </div>
      </div>

      {/* Active Equipment Outages / Recently Down Banner */}
      {recentlyDown && recentlyDown.length > 0 && (
        <div className="bg-slate-900 border border-red-900/60 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
              <AlertOctagon size={18} className="animate-bounce text-red-400" />
              {t('dashboard.recently_down_title')}
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              {recentlyDown.filter(r => r.status === 'Down').length} machine(s) offline
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentlyDown.map((eq) => {
              const isCurrentlyDown = eq.status === 'Down';
              return (
                <div 
                  key={eq.id}
                  className={`p-4 rounded-xl border transition ${
                    isCurrentlyDown 
                      ? 'bg-red-950/40 border-red-800/80 shadow-red-950/20 shadow-lg' 
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">{eq.asset_id}</span>
                        <span className="text-xs text-slate-300 font-semibold">{eq.name}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 font-mono">
                        {eq.area} • {eq.specific_location}
                      </div>
                    </div>
                    {isCurrentlyDown ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400 bg-red-950 border border-red-800 px-2.5 py-1 rounded-full animate-pulse">
                        <Clock size={12} /> {eq.down_details?.elapsed_minutes || 0}m DOWN
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                        Recovered
                      </span>
                    )}
                  </div>

                  <div className="mt-3 text-xs text-slate-300 bg-black/40 p-2.5 rounded-lg border border-red-900/30">
                    <span className="font-semibold text-slate-400">Reason: </span>
                    {eq.down_details?.reason || 'Stoppage logged'}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-red-900/30">
                    <span className="text-slate-400">
                      Uptime: <strong className={getUptimeColor(eq.uptime_percentage)}>{eq.uptime_percentage}%</strong>
                    </span>
                    <button
                      onClick={() => setActiveTab && setActiveTab('work-orders')}
                      className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium"
                    >
                      View Work Orders <ArrowUpRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Equipment Status Grid Grouped by Area (PRD 3.8) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight">
            Anaheim Plant Machinery Grid
          </h2>
          <span className="text-xs text-slate-400">
            Grouped by production department
          </span>
        </div>

        {equipment_by_area && Object.keys(equipment_by_area).map((areaName) => {
          const areaEquip = equipment_by_area[areaName];
          return (
            <div key={areaName} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <HardHat size={18} className="text-cyan-400" />
                  <h3 className="font-bold text-white text-sm tracking-wide uppercase">{areaName}</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {areaEquip.length} machine{areaEquip.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                {areaEquip.map((eq) => {
                  const isDown = eq.status === 'Down';
                  return (
                    <div
                      key={eq.id}
                      className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                        isDown 
                          ? 'bg-red-950/20 border-red-800/60 hover:border-red-600' 
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-cyan-400">{eq.asset_id}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-semibold text-slate-300">
                              {eq.uptime_percentage}%
                            </span>
                            {getStatusDot(eq.status)}
                          </div>
                        </div>

                        <h4 className="text-sm font-bold text-white mt-1.5 line-clamp-1">{eq.name}</h4>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          {eq.category} • {eq.specific_location}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-mono">
                          {parseFloat(eq.runtime_hours || 0).toLocaleString()} hrs
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isDown ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                        }`}>
                          {eq.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Open Parts Requests Aging Queue Panel (PRD 3.8) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Package size={20} className="text-purple-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {t('dashboard.open_parts_panel')}
            </h2>
          </div>
          <button
            onClick={() => setActiveTab && setActiveTab('parts-requests')}
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold inline-flex items-center gap-1"
          >
            {t('dashboard.view_request')} <ChevronRight size={14} />
          </button>
        </div>

        {!open_parts_requests || open_parts_requests.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4">{t('dashboard.no_open_parts')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Req #</th>
                  <th className="py-2.5 px-3">Age</th>
                  <th className="py-2.5 px-3">Machine</th>
                  <th className="py-2.5 px-3">Part Requested</th>
                  <th className="py-2.5 px-3">Qty</th>
                  <th className="py-2.5 px-3">Urgency</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Requester</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {open_parts_requests.map((pr) => (
                  <tr key={pr.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">{pr.request_number}</td>
                    <td className="py-2.5 px-3 font-mono text-amber-300 font-semibold">{pr.age_label}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-slate-200">{pr.asset_id}</span>
                    </td>
                    <td className="py-2.5 px-3 text-white font-medium">{pr.part_description}</td>
                    <td className="py-2.5 px-3 font-bold">{pr.quantity}</td>
                    <td className="py-2.5 px-3">
                      {pr.urgency === 'Urgent' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800">
                          {t('dashboard.urgent_tag')}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
                          {pr.urgency}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950 text-purple-300 border border-purple-800">
                        {pr.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{pr.requester_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
