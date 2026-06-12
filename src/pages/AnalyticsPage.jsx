/**
 * AnalyticsPage.jsx
 * -------------------------------------------------
 * Analytics dashboard with tabbed views (Daily / Weekly / Monthly)
 * and a persistent Commodity Trends section below.
 *
 * Uses Recharts for all charting. Data from useAnalytics hook.
 */
import { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Hash,
  DollarSign,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Clock,
  Star,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAppContext } from '../context/AppContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { formatCurrency } from '../utils/formatters';

/* ---- Chart color palette ---- */
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'];
const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

/* ---- Tab IDs ---- */
const TABS = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

/* ================================================================
   Mini Stat Card (used across all tabs)
   ================================================================ */
function MiniStat({ id, icon: Icon, label, value, change, iconColor = 'text-indigo-500' }) {
  return (
    <div id={id} className="glass-card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center ${iconColor}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-lg font-bold text-slate-800 truncate">{value}</p>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-0.5">
            {change >= 0 ? (
              <ArrowUpRight className="w-3 h-3 text-emerald-500" />
            ) : (
              <ArrowDownRight className="w-3 h-3 text-red-500" />
            )}
            <span className={`text-xs font-semibold ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {Math.abs(change).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   Custom Tooltip
   ================================================================ */
function ChartTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="text-xs font-semibold text-slate-600 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-500">{entry.name || entry.dataKey}:</span>
          <span className="font-bold" style={{ color: entry.color }}>
            {typeof entry.value === 'number' ? formatCurrency(entry.value, currency) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ================================================================
   Analytics Page
   ================================================================ */
export default function AnalyticsPage() {
  const { currency } = useAppContext();
  const { analytics, loading } = useAnalytics();
  const [activeTab, setActiveTab] = useState('daily');

  /* ---- Extract analytics sub-data ---- */
  const daily = analytics?.daily || {};
  const weekly = analytics?.weekly || {};
  const monthly = analytics?.monthly || {};
  const commodityTrends = analytics?.commodityTrends || [];
  const availableCommodities = analytics?.availableCommodities || ['Roti Maker Basic', 'Roti Maker Premium'];

  /* ---- Commodity toggle state ---- */
  const [visibleCommodities, setVisibleCommodities] = useState(
    new Set(['Roti Maker Basic', 'Roti Maker Premium'])
  );

  const toggleCommodity = (name) => {
    setVisibleCommodities((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* ============ TAB NAVIGATION ============ */}
      <div id="analytics-tabs" className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            id={`tab-${id}`}
            onClick={() => setActiveTab(id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === id
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ============ DAILY TAB ============ */}
      {activeTab === 'daily' && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <MiniStat
              id="daily-entries"
              icon={Hash}
              label="Entries Today"
              value={daily.entriesCount ?? 0}
              iconColor="text-indigo-500"
            />
            <MiniStat
              id="daily-total"
              icon={DollarSign}
              label="Total Value"
              value={formatCurrency(daily.totalValue ?? 0, currency)}
              iconColor="text-emerald-500"
            />
            <MiniStat
              id="daily-avg"
              icon={BarChart3}
              label="Avg Value"
              value={formatCurrency(daily.avgValue ?? 0, currency)}
              iconColor="text-violet-500"
            />
            <MiniStat
              id="daily-top"
              icon={Star}
              label="Top Commodity"
              value={daily.topCommodity ?? '—'}
              iconColor="text-amber-500"
            />
          </div>

          {/* Bar chart: purchases by commodity today */}
          <div className="glass-card p-5">
            <h2 className="text-base font-semibold text-slate-800 mb-4">
              Purchases by Commodity — Today
            </h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={daily.commodityBreakdown || []}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v, currency, true)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip content={<ChartTooltip currency={currency} />} />
                  <Bar dataKey="value" fill="#6366f1" radius={[0, 6, 6, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Today's entries table */}
          <div className="glass-card p-5">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Today's Entries</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Voucher</th>
                    <th className="text-left pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier</th>
                    <th className="text-left pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Commodities</th>
                    <th className="text-right pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(daily.entries || []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-400">
                        No entries today
                      </td>
                    </tr>
                  ) : (
                    (daily.entries || []).map((entry, i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-indigo-50/30 transition-colors">
                        <td className="py-3">
                          <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">
                            {entry.voucherNumber}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600">{entry.supplierName || '—'}</td>
                        <td className="py-3 text-slate-600">
                          {(entry.items || []).map((it) => it.commodity).join(', ')}
                        </td>
                        <td className="py-3 text-right font-semibold text-slate-800">
                          {formatCurrency(entry.grandTotal, currency)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============ WEEKLY TAB ============ */}
      {activeTab === 'weekly' && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <MiniStat
              id="weekly-entries"
              icon={Hash}
              label="Weekly Entries"
              value={weekly.entriesCount ?? 0}
              iconColor="text-indigo-500"
            />
            <MiniStat
              id="weekly-total"
              icon={DollarSign}
              label="Weekly Total"
              value={formatCurrency(weekly.totalValue ?? 0, currency)}
              change={weekly.totalChange}
              iconColor="text-emerald-500"
            />
            <MiniStat
              id="weekly-product"
              icon={Package}
              label="Product Value"
              value={formatCurrency(weekly.productValue ?? 0, currency)}
              iconColor="text-violet-500"
            />
            <MiniStat
              id="weekly-logistics"
              icon={TrendingUp}
              label="Logistics Total"
              value={formatCurrency(weekly.logisticsValue ?? 0, currency)}
              iconColor="text-amber-500"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 7-day trend: product vs logistics */}
            <div className="glass-card p-5">
              <h2 className="text-base font-semibold text-slate-800 mb-4">
                7-Day Trend — Product vs Logistics
              </h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weekly.dailyTrend || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => formatCurrency(v, currency, true)} />
                    <Tooltip content={<ChartTooltip currency={currency} />} />
                    <Legend />
                    <Line type="monotone" dataKey="product" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1' }} name="Product" />
                    <Line type="monotone" dataKey="logistics" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} name="Logistics" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stacked bar: commodity breakdown per day */}
            <div className="glass-card p-5">
              <h2 className="text-base font-semibold text-slate-800 mb-4">
                Commodity Breakdown by Day
              </h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekly.commodityByDay || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => formatCurrency(v, currency, true)} />
                    <Tooltip content={<ChartTooltip currency={currency} />} />
                    <Legend />
                    {(weekly.commodityNames || []).slice(0, 5).map((name, i) => (
                      <Bar key={name} dataKey={name} stackId="stack" fill={COLORS[i % COLORS.length]} radius={i === (weekly.commodityNames || []).slice(0, 5).length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top commodities table */}
          <div className="glass-card p-5">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Top Commodities This Week</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                    <th className="text-left pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Commodity</th>
                    <th className="text-right pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Quantity</th>
                    <th className="text-right pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {(weekly.topCommodities || []).map((item, i) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-indigo-50/30 transition-colors">
                      <td className="py-2.5 text-slate-400 font-medium">{i + 1}</td>
                      <td className="py-2.5 text-slate-700 font-medium">{item.name}</td>
                      <td className="py-2.5 text-right text-slate-600">{item.quantity} {item.unit || 'pcs'}</td>
                      <td className="py-2.5 text-right font-semibold text-slate-800">{formatCurrency(item.value, currency)}</td>
                    </tr>
                  ))}
                  {(weekly.topCommodities || []).length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-slate-400">No data</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============ MONTHLY TAB ============ */}
      {activeTab === 'monthly' && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Summary cards with comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <MiniStat
              id="monthly-entries"
              icon={Hash}
              label="Monthly Entries"
              value={monthly.entriesCount ?? 0}
              change={monthly.entriesChange}
              iconColor="text-indigo-500"
            />
            <MiniStat
              id="monthly-total"
              icon={DollarSign}
              label="Monthly Total"
              value={formatCurrency(monthly.totalValue ?? 0, currency)}
              change={monthly.totalChange}
              iconColor="text-emerald-500"
            />
            <MiniStat
              id="monthly-avg"
              icon={BarChart3}
              label="Daily Avg"
              value={formatCurrency(monthly.dailyAvg ?? 0, currency)}
              change={monthly.avgChange}
              iconColor="text-violet-500"
            />
            <MiniStat
              id="monthly-top-supplier"
              icon={Star}
              label="Top Supplier"
              value={monthly.topSupplier ?? '—'}
              iconColor="text-amber-500"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 30-day cumulative area chart */}
            <div className="glass-card p-5">
              <h2 className="text-base font-semibold text-slate-800 mb-4">
                30-Day Cumulative Trend
              </h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthly.cumulativeTrend || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="monthlyAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={70} tickFormatter={(v) => formatCurrency(v, currency, true)} />
                    <Tooltip content={<ChartTooltip currency={currency} />} />
                    <Area type="monotone" dataKey="cumulative" stroke="#6366f1" strokeWidth={2.5} fill="url(#monthlyAreaGradient)" dot={false} name="Cumulative" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Commodity distribution pie chart */}
            <div className="glass-card p-5">
              <h2 className="text-base font-semibold text-slate-800 mb-4">
                Commodity Distribution — This Month
              </h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={monthly.commodityDistribution || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                      stroke="none"
                    >
                      {(monthly.commodityDistribution || []).map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => formatCurrency(val, currency)} contentStyle={{ borderRadius: '0.75rem', border: '1px solid #e2e8f0' }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Supplier breakdown table */}
          <div className="glass-card p-5">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Supplier Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                    <th className="text-left pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier</th>
                    <th className="text-right pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Entries</th>
                    <th className="text-right pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Value</th>
                    <th className="text-right pb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">% Share</th>
                  </tr>
                </thead>
                <tbody>
                  {(monthly.supplierBreakdown || []).map((supplier, i) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-indigo-50/30 transition-colors">
                      <td className="py-2.5 text-slate-400 font-medium">{i + 1}</td>
                      <td className="py-2.5 text-slate-700 font-medium">{supplier.name || '—'}</td>
                      <td className="py-2.5 text-right text-slate-600">{supplier.count}</td>
                      <td className="py-2.5 text-right font-semibold text-slate-800">{formatCurrency(supplier.value, currency)}</td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${supplier.share || 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 w-10 text-right">
                            {(supplier.share || 0).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(monthly.supplierBreakdown || []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-slate-400">No data</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============ COMMODITY TRENDS (always visible) ============ */}
      <section id="commodity-trends" className="glass-card p-5">
        <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          Commodity Trends Over Time
        </h2>

        {/* Toggle checkboxes */}
        <div className="flex flex-wrap gap-3 mb-4">
          {availableCommodities.map((name, i) => (
            <label
              key={name}
              className="flex items-center gap-2 text-sm cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={visibleCommodities.has(name)}
                onChange={() => toggleCommodity(name)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30"
              />
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-slate-600">{name}</span>
            </label>
          ))}
        </div>

        {/* Multi-line chart */}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={commodityTrends} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => formatCurrency(v, currency, true)} />
              <Tooltip content={<ChartTooltip currency={currency} />} />
              <Legend />
              {availableCommodities.map((name, i) =>
                visibleCommodities.has(name) ? (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3, fill: COLORS[i % COLORS.length] }}
                    activeDot={{ r: 5 }}
                    name={name}
                  />
                ) : null
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
