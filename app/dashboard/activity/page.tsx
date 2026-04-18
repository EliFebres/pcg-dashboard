'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Activity, Users, Wifi, Zap, UserPlus, RefreshCw, Loader2 } from 'lucide-react';
import { useCurrentUser } from '@/app/lib/auth/context';
import ClientOnlyChart from '@/app/components/dashboard/shared/ClientOnlyChart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';

type Range = '24h' | '7d' | '30d';

interface StatsResponse {
  range: Range;
  users: { total: number; active: number; pending: number; inactive: number; signupsThisWeek: number };
  events: { today: number; yesterday: number };
  onlineNow: number;
  byEntity: { entityType: string | null; count: number }[];
  byAction: { action: string; count: number }[];
  byDay: { day: string; count: number }[];
  topUsers: { userName: string | null; userEmail: string | null; count: number }[];
}

interface LogRow {
  id: string;
  timestamp: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
}

interface OnlineUser {
  userId: string;
  userEmail: string;
  userName: string;
  lastSeen: string;
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return '—';
  const diffMs = Date.now() - then;
  const sec = Math.floor(diffMs / 1000);
  if (sec < 5) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

function formatAbsoluteTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function actionLabel(action: string): string {
  const [group, verb] = action.split('.');
  const pretty = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  if (!verb) return pretty(action);
  return `${pretty(group)} · ${pretty(verb)}`;
}

function actionColor(action: string): string {
  if (action.startsWith('auth.login_failed')) return 'text-red-400 bg-red-500/10 border-red-500/20';
  if (action.startsWith('auth.login')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (action.startsWith('auth.logout')) return 'text-muted bg-zinc-500/10 border-zinc-500/20';
  if (action.startsWith('auth.signup')) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
  if (action.includes('delete')) return 'text-red-400 bg-red-500/10 border-red-500/20';
  if (action.includes('create') || action.includes('bulk_upload')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (action.includes('update') || action.includes('change')) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  if (action.startsWith('page.view')) return 'text-muted bg-zinc-500/10 border-zinc-500/20';
  return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
}

function detailsSummary(row: LogRow): string {
  if (!row.details) return row.entityId ? `#${row.entityId}` : '';
  const d = row.details;
  if (row.action === 'page.view' && typeof d.path === 'string') return d.path;
  if (row.action === 'engagement.create' && typeof d.internalClient === 'string') return d.internalClient;
  if (row.action === 'engagement.status_change' && typeof d.status === 'string') return `→ ${d.status}`;
  if (row.action === 'engagement.nna_change') return d.nna == null ? '(cleared)' : `$${d.nna}`;
  if (row.action === 'engagement.update' && Array.isArray(d.fields)) return (d.fields as string[]).join(', ');
  if (row.action === 'engagement.bulk_upload' && typeof d.inserted === 'number') return `${d.inserted} rows`;
  if (row.action === 'engagement.export' && typeof d.rowCount === 'number') return `${d.rowCount} rows`;
  if (row.action === 'auth.login_failed' && typeof d.reason === 'string') return d.reason;
  if (row.action.startsWith('user.') && typeof d.targetEmail === 'string') return d.targetEmail;
  if (row.action.startsWith('team_member.') && typeof d.displayName === 'string') return d.displayName as string;
  return row.entityId ? `#${row.entityId}` : '';
}

const ENTITY_COLORS: Record<string, string> = {
  engagement: '#22d3ee',
  note: '#a78bfa',
  user: '#34d399',
  team_member: '#60a5fa',
  page: '#94a3b8',
  other: '#f59e0b',
};

function CardShell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 rounded-xl ${className}`}>
      {children}
    </div>
  );
}

function MetricCard({
  label,
  sublabel,
  value,
  delta,
  icon: Icon,
}: {
  label: string;
  sublabel?: string;
  value: string;
  delta?: { text: string; positive: boolean } | null;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <CardShell className="p-5 h-[140px] flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[0.75rem] uppercase tracking-wider text-muted font-medium">{label}</p>
          {sublabel && <p className="text-[0.7rem] text-muted/70 mt-0.5">{sublabel}</p>}
        </div>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600/20 to-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
          <Icon className="w-4 h-4 text-cyan-400" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-[2.5rem] font-bold text-white leading-none">{value}</p>
        {delta && (
          <span
            className={`text-sm font-medium ${delta.positive ? 'text-emerald-400' : 'text-red-400'}`}
          >
            {delta.text}
          </span>
        )}
      </div>
    </CardShell>
  );
}

export default function ActivityDashboardPage() {
  const { user, isLoading: userLoading } = useCurrentUser();
  const [range, setRange] = useState<Range>('7d');
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [online, setOnline] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const flashTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const isAdmin = user?.role === 'admin';

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/activity/stats?range=${range}`);
      if (!res.ok) throw new Error(`stats failed: ${res.status}`);
      setStats(await res.json());
    } catch (e) {
      console.error(e);
      setError('Failed to load stats');
    }
  }, [range]);

  const loadLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/activity?page=1&page_size=100');
      if (!res.ok) throw new Error(`logs failed: ${res.status}`);
      const data = await res.json();
      setLogs(data.logs);
    } catch (e) {
      console.error(e);
      setError('Failed to load activity log');
    }
  }, []);

  const loadOnline = useCallback(async () => {
    try {
      const res = await fetch('/api/activity/online');
      if (!res.ok) throw new Error(`online failed: ${res.status}`);
      const data = await res.json();
      setOnline(data.users);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      await Promise.all([loadStats(), loadLogs(), loadOnline()]);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [isAdmin, loadStats, loadLogs, loadOnline]);

  // Live feed via SSE
  useEffect(() => {
    if (!isAdmin) return;
    const es = new EventSource('/api/activity/events');
    es.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        if (parsed.type === 'log' && parsed.row) {
          const row = parsed.row as LogRow;
          setLogs(prev => [row, ...prev].slice(0, 200));
          setNewIds(prev => {
            const next = new Set(prev);
            next.add(row.id);
            return next;
          });
          const existing = flashTimeouts.current.get(row.id);
          if (existing) clearTimeout(existing);
          const t = setTimeout(() => {
            setNewIds(prev => {
              const next = new Set(prev);
              next.delete(row.id);
              return next;
            });
            flashTimeouts.current.delete(row.id);
          }, 2000);
          flashTimeouts.current.set(row.id, t);
          void loadStats();
          void loadOnline();
        }
      } catch { /* ignore malformed frames */ }
    };
    es.onerror = () => es.close();
    const timeoutsMap = flashTimeouts.current;
    return () => {
      es.close();
      timeoutsMap.forEach(clearTimeout);
      timeoutsMap.clear();
    };
  }, [isAdmin, loadStats, loadOnline]);

  // Refresh online list every 30s to drop stale sessions
  useEffect(() => {
    if (!isAdmin) return;
    const t = setInterval(() => { void loadOnline(); }, 30_000);
    return () => clearInterval(t);
  }, [isAdmin, loadOnline]);

  const eventsDelta = useMemo(() => {
    if (!stats) return null;
    const { today, yesterday } = stats.events;
    if (yesterday === 0) return today > 0 ? { text: `+${today}`, positive: true } : null;
    const pct = Math.round(((today - yesterday) / yesterday) * 100);
    return { text: `${pct >= 0 ? '+' : ''}${pct}%`, positive: pct >= 0 };
  }, [stats]);

  const byDayData = useMemo(() => {
    if (!stats) return [];
    return stats.byDay.map(d => ({
      day: d.day.split(' ')[0].slice(5),
      count: d.count,
    }));
  }, [stats]);

  const byEntityData = useMemo(() => {
    if (!stats) return [];
    return stats.byEntity.map(e => ({
      name: e.entityType ?? 'other',
      count: e.count,
      fill: ENTITY_COLORS[e.entityType ?? 'other'] ?? '#64748b',
    }));
  }, [stats]);

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted text-sm">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <CardShell className="p-10 max-w-md text-center">
          <Activity className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Admin access only</h2>
          <p className="text-sm text-muted">This dashboard is restricted to administrators.</p>
        </CardShell>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">Activity</h1>
            <p className="text-sm text-muted">Real-time usage, user activity, and signup telemetry</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-900/60 border border-zinc-800/50 rounded-lg p-0.5">
            {(['24h', '7d', '30d'] as Range[]).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  range === r
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
                    : 'text-muted hover:text-zinc-200'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            onClick={() => { void loadStats(); void loadLogs(); void loadOnline(); }}
            className="p-2 bg-zinc-900/60 border border-zinc-800/50 rounded-lg text-muted hover:text-cyan-400 hover:border-cyan-500/30 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Total Users"
          sublabel={stats ? `${stats.users.active} active · ${stats.users.pending} pending` : ''}
          value={stats ? String(stats.users.total) : '—'}
          icon={Users}
        />
        <MetricCard
          label="Online Now"
          sublabel="active in last 5 min"
          value={stats ? String(stats.onlineNow) : '—'}
          icon={Wifi}
        />
        <MetricCard
          label="Events Today"
          sublabel={`vs yesterday (${stats?.events.yesterday ?? 0})`}
          value={stats ? stats.events.today.toLocaleString() : '—'}
          delta={eventsDelta}
          icon={Zap}
        />
        <MetricCard
          label="Signups This Week"
          sublabel="last 7 days"
          value={stats ? String(stats.users.signupsThisWeek) : '—'}
          icon={UserPlus}
        />
      </div>

      {/* Chart row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <CardShell className="p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Events over time</h3>
              <p className="text-xs text-muted">Per-day activity count for the selected range</p>
            </div>
          </div>
          <div className="h-64">
            <ClientOnlyChart>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={byDayData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="activityLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="day" stroke="#a5a5b2" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a5a5b2" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111113',
                      border: '1px solid #27272a',
                      borderRadius: 8,
                      fontSize: 12,
                      color: '#e4e4e7',
                    }}
                    cursor={{ stroke: '#3f3f46' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="url(#activityLine)"
                    strokeWidth={2.5}
                    dot={{ fill: '#22d3ee', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ClientOnlyChart>
          </div>
        </CardShell>

        <CardShell className="p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">App usage by area</h3>
            <p className="text-xs text-muted">Actions grouped by entity type</p>
          </div>
          <div className="h-64">
            <ClientOnlyChart>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byEntityData} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                  <XAxis type="number" stroke="#a5a5b2" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#a5a5b2"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111113',
                      border: '1px solid #27272a',
                      borderRadius: 8,
                      fontSize: 12,
                      color: '#e4e4e7',
                    }}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ClientOnlyChart>
          </div>
        </CardShell>
      </div>

      {/* Live feed + Online users */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <CardShell className="xl:col-span-2 flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/50">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                Live Activity Feed
                <span className="inline-flex items-center gap-1 text-[0.65rem] font-normal text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> live
                </span>
              </h3>
              <p className="text-xs text-muted">Newest actions stream in as they happen</p>
            </div>
            <span className="text-xs text-muted">{logs.length} shown</span>
          </div>
          <div className="overflow-x-auto max-h-[520px] overflow-y-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-zinc-900/80 backdrop-blur-md z-10">
                <tr className="border-b border-zinc-800/50">
                  <th className="text-left px-4 py-2.5 text-[0.7rem] uppercase tracking-wider text-muted font-medium w-24">Time</th>
                  <th className="text-left px-4 py-2.5 text-[0.7rem] uppercase tracking-wider text-muted font-medium">User</th>
                  <th className="text-left px-4 py-2.5 text-[0.7rem] uppercase tracking-wider text-muted font-medium">Action</th>
                  <th className="text-left px-4 py-2.5 text-[0.7rem] uppercase tracking-wider text-muted font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {loading && logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-muted text-sm">
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…
                    </td>
                  </tr>
                )}
                {!loading && logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-muted text-sm">No activity yet.</td>
                  </tr>
                )}
                {logs.map(row => {
                  const isNew = newIds.has(row.id);
                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-zinc-800/30 transition-colors ${
                        isNew ? 'bg-cyan-500/10' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <td className="px-4 py-2 text-xs text-muted font-mono whitespace-nowrap" title={row.timestamp}>
                        {formatAbsoluteTime(row.timestamp)}
                      </td>
                      <td className="px-4 py-2 text-zinc-200 whitespace-nowrap">
                        {row.userName ?? <span className="text-muted italic">anon</span>}
                        {row.userEmail && (
                          <span className="block text-[0.65rem] text-muted">{row.userEmail}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-[0.7rem] font-medium rounded-md border ${actionColor(row.action)}`}
                        >
                          {actionLabel(row.action)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted max-w-[360px] truncate" title={JSON.stringify(row.details ?? {})}>
                        {detailsSummary(row)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardShell>

        <CardShell className="flex flex-col">
          <div className="px-5 py-4 border-b border-zinc-800/50">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              Online Now
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-[0.65rem] font-semibold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                {online.length}
              </span>
            </h3>
            <p className="text-xs text-muted">Active in the last 5 minutes</p>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[260px] scrollbar-thin">
            {online.length === 0 && (
              <div className="px-5 py-6 text-xs text-muted text-center">No one online.</div>
            )}
            {online.map(u => (
              <div key={u.userId} className="px-5 py-3 border-b border-zinc-800/30 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold text-white">
                  {(u.userName?.[0] ?? '?').toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-200 truncate">{u.userName}</p>
                  <p className="text-[0.65rem] text-muted truncate">{u.userEmail}</p>
                </div>
                <span className="text-[0.65rem] text-muted whitespace-nowrap">{formatRelativeTime(u.lastSeen)}</span>
              </div>
            ))}
          </div>

          {stats && stats.topUsers.length > 0 && (
            <>
              <div className="px-5 py-4 border-b border-t border-zinc-800/50">
                <h3 className="text-sm font-semibold text-white">Most Active</h3>
                <p className="text-xs text-muted">Top users by action count · {range.toUpperCase()}</p>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                {stats.topUsers.map((u, i) => (
                  <div key={u.userEmail ?? i} className="px-5 py-2.5 border-b border-zinc-800/30 flex items-center justify-between">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="text-sm text-zinc-200 truncate">{u.userName ?? u.userEmail}</p>
                      {u.userEmail && u.userName && (
                        <p className="text-[0.65rem] text-muted truncate">{u.userEmail}</p>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-cyan-400 flex-shrink-0">{u.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardShell>
      </div>
    </div>
  );
}
