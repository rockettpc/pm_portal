import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../utils/formatters';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  Code,
  FileText,
  Layers,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const AuditLogView = () => {
  const { t, i18n } = useTranslation();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchAuditLogs = async (pageNum = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum,
        limit: 25,
      });

      if (actionFilter) params.append('action', actionFilter);
      if (entityFilter) params.append('entity_type', entityFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/audit-log?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load audit logs');

      const data = await res.json();
      setLogs(data.items || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('[AuditLogView Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs(1);
  }, [actionFilter, entityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAuditLogs(1);
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (actionFilter) params.append('action', actionFilter);
    if (entityFilter) params.append('entity_type', entityFilter);
    window.location.href = `/api/audit-log/export?${params.toString()}`;
  };

  const getActionBadge = (action) => {
    const act = (action || '').toUpperCase();
    if (act.includes('CREATE')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
          {act}
        </span>
      );
    }
    if (act.includes('UPDATE')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-cyan-950/80 text-cyan-400 border border-cyan-800/80">
          {act}
        </span>
      );
    }
    if (act.includes('DELETE')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-red-950/80 text-red-400 border border-red-800/80">
          {act}
        </span>
      );
    }
    if (act.includes('LOGIN')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-purple-950/80 text-purple-400 border border-purple-800/80">
          {act}
        </span>
      );
    }
    if (act.includes('CONSUME') || act.includes('PART')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-950/80 text-amber-400 border border-amber-800/80">
          {act}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-800 text-slate-300 border border-slate-700">
        {act}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert size={22} className="text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              {t('audit.title', 'System Audit Trail & Compliance Log')}
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {t('audit.subtitle', 'Permanent append-only record of mutations, logins, and maintenance events across all plant assets')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 text-xs font-semibold rounded-lg border border-slate-700/80 transition"
            title="Download CSV report"
          >
            <Download size={14} />
            <span>{t('audit.export_btn', 'Export CSV')}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          
          {/* Keyword Search */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('audit.search_placeholder', 'Search username, action, entity, details...')}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </form>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full sm:w-44 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
          >
            <option value="">-- {t('audit.all_actions', 'All Actions')} --</option>
            <option value="LOGIN">LOGIN</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="CONSUME_PART">CONSUME_PART</option>
          </select>

          {/* Entity Type Filter */}
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="w-full sm:w-44 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
          >
            <option value="">-- {t('audit.all_entities', 'All Entities')} --</option>
            <option value="equipment">Equipment</option>
            <option value="work_order">Work Orders</option>
            <option value="part">Parts Inventory</option>
            <option value="pm_schedule">PM Schedules</option>
            <option value="parts_request">Parts Requests</option>
            <option value="user">User Accounts</option>
            <option value="document">Documents</option>
          </select>
        </div>
      </div>

      {/* Log Table / List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] text-slate-400 font-mono uppercase tracking-wider">
                <th className="py-3 px-4"># ID</th>
                <th className="py-3 px-4">{t('audit.col_timestamp', 'Timestamp')}</th>
                <th className="py-3 px-4">{t('audit.col_user', 'User')}</th>
                <th className="py-3 px-4">{t('audit.col_action', 'Action')}</th>
                <th className="py-3 px-4">{t('audit.col_entity', 'Entity')}</th>
                <th className="py-3 px-4">{t('audit.col_details', 'Details')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    {t('common.loading')}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    {t('audit.no_records', 'No audit log records found matching your filters.')}
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const detailsStr = log.details ? JSON.stringify(log.details) : '-';

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                          {log.id}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300 text-[11px] whitespace-nowrap">
                          {formatDate(log.created_at, i18n.language)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-300 font-bold">
                              {(log.username || 'S')[0].toUpperCase()}
                            </span>
                            <div>
                              <span className="font-semibold text-white">
                                {log.full_name || log.username || 'System'}
                              </span>
                              {log.username && (
                                <span className="text-[10px] text-slate-400 ml-1 font-mono">
                                  (@{log.username})
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getActionBadge(log.action)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="text-slate-300 font-medium capitalize">
                            {log.entity_type}
                          </span>
                          {log.entity_id && (
                            <span className="text-cyan-400 font-mono text-[11px] ml-1">
                              #{log.entity_id}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="text-left font-mono text-[11px] text-slate-400 hover:text-cyan-300 truncate max-w-xs block"
                            title="Click to view details"
                          >
                            {detailsStr}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded JSON Inspector */}
                      {isExpanded && (
                        <tr className="bg-slate-950/90 border-b border-cyan-900/40">
                          <td colSpan="6" className="p-4">
                            <div className="bg-black/80 rounded-xl p-3 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
                              <div className="text-cyan-400 font-bold mb-1 flex items-center gap-1.5">
                                <Code size={13} />
                                <span>Audit Event Details (ID #{log.id}):</span>
                              </div>
                              <pre className="text-cyan-200/90 leading-relaxed whitespace-pre-wrap">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing page <span className="font-bold text-white">{page}</span> of{' '}
            <span className="font-bold text-white">{totalPages || 1}</span> ({total} total entries)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAuditLogs(page - 1)}
              disabled={page <= 1 || loading}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg transition"
            >
              <ChevronLeft size={14} />
              <span>{t('tour.back', 'Prev')}</span>
            </button>
            <button
              onClick={() => fetchAuditLogs(page + 1)}
              disabled={page >= totalPages || loading}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg transition"
            >
              <span>{t('tour.next', 'Next')}</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
