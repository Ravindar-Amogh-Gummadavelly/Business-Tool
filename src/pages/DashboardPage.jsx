/**
 * DashboardPage.jsx
 * -------------------------------------------------
 * Main dashboard with:
 *  - 4 stat cards (count-up animation, glassmorphism)
 *  - Weekly trend bar chart + Monthly trend line chart
 *  - Recent entries table + Commodity distribution donut
 *
 * Data sourced from api.getDashboardData() & useAnalytics hook.
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PackageCheck,
  Truck,
  TrendingUp,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  Legend,
} from 'recharts';
import { useAppContext } from '../context/AppContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { formatCurrency } from '../utils/formatters';

/* ---- Pie chart colors ---- */
const PIE_COLORS = ['#2563EB', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

/* ================================================================
   Count-Up Animation Hook
   ================================================================ */
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      /* ease-out quad */
      const eased = 1 - (1 - progress) * (1 - progress);
      setValue(Math.floor(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setValue(target);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}

/* ================================================================
   Stat Card Component
   ================================================================ */
function StatCard({ id, icon: Icon, label, value, change, gradient, delay = 0 }) {
  const { currency } = useAppContext();
  const animatedValue = useCountUp(value);

  return (
    <div
      id={id}
      className="glass-card p-5 flex items-start gap-4 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Icon badge */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${gradient} shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-800 tracking-tight mt-0.5">
          {formatCurrency(animatedValue, currency)}
        </p>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {change >= 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
            )}
            <span
              className={`text-xs font-semibold ${
                change >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {Math.abs(change).toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400 ml-0.5">vs prev</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   Custom Recharts Tooltip
   ================================================================ */
function ChartTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="text-xs font-semibold text-slate-600 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: entry.color }}>
          {formatCurrency(entry.value, currency)}
        </p>
      ))}
    </div>
  );
}

/* ================================================================
   Dashboard Page
   ================================================================ */
export default function DashboardPage() {
  const navigate = useNavigate();
  const { currency } = useAppContext();
  const { analytics, loading } = useAnalytics();

  /* ---- Derived data from analytics hook ---- */
  const stats = analytics?.stats || {
    totalSpend: 0,
    totalRevenue: 0,
    totalItemsIn: 0,
    totalItemsOut: 0,
    spendChange: 0,
    revenueChange: 0,
    itemsInChange: 0,
    itemsOutChange: 0,
  };

  const weeklyTrend = analytics?.weeklyTrend || [];
  const monthlyTrend = analytics?.monthlyTrend || [];
  const recentEntries = analytics?.recentEntries || [];
  const commodityDist = analytics?.commodityDistribution || [];

  /* ---- Stat cards config ---- */
  const statCards = [
    {
      id: 'stat-total-revenue',
      icon: TrendingUp,
      label: "Total Sales Revenue",
      value: stats.totalRevenue,
      change: stats.revenueChange,
      gradient: 'gradient-indigo',
    },
    {
      id: 'stat-total-spend',
      icon: PackageCheck,
      label: "Total Purchase Spend",
      value: stats.totalSpend,
      change: stats.spendChange,
      gradient: 'gradient-emerald',
    },
    {
      id: 'stat-items-out',
      icon: Truck,
      label: 'Units Sold (Out)',
      value: stats.totalItemsOut,
      change: stats.itemsOutChange,
      gradient: 'gradient-amber',
    },
    {
      id: 'stat-items-in',
      icon: Calendar,
      label: 'Units Received (In)',
      value: stats.totalItemsIn,
      change: stats.itemsInChange,
      gradient: 'gradient-violet',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ============ TOP ROW: Stat Cards ============ */}
      <section id="stat-cards" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <StatCard key={card.id} {...card} delay={i * 100} />
        ))}
      </section>

      {/* ============ MIDDLE ROW: Charts ============ */}
      <section id="charts-row" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend Bar Chart */}
        <div className="glass-card p-5">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Weekly Trend</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#6C7293" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6C7293' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6C7293' }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => formatCurrency(v, currency, true)} />
                <Tooltip content={<ChartTooltip currency={currency} />} />
                <Bar dataKey="value" fill="url(#barGradient)" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trend Line/Area Chart */}
        <div className="glass-card p-5">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Monthly Trend</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#6C7293" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6C7293' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6C7293' }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => formatCurrency(v, currency, true)} />
                <Tooltip content={<ChartTooltip currency={currency} />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fill="url(#areaGradient)"
                  dot={{ r: 3, fill: '#2563EB', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* ============ BOTTOM ROW ============ */}
      <section id="bottom-row" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Entries Table */}
        <div className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-800">Recent Entries</h2>
            <button
              id="view-all-entries"
              onClick={() => navigate('/history')}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              View all →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left pb-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Date</th>
                  <th className="text-left pb-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Voucher</th>
                  <th className="text-left pb-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Supplier</th>
                  <th className="text-center pb-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Items</th>
                  <th className="text-right pb-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentEntries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">
                      No entries yet. Start by adding a new entry.
                    </td>
                  </tr>
                ) : (
                  recentEntries.slice(0, 10).map((entry, i) => (
                    <tr
                      key={entry.id || i}
                      className="border-b border-slate-100 hover:bg-indigo-50/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/history?voucher=${encodeURIComponent(entry.voucherNumber)}`)}
                    >
                      <td className="py-3 text-slate-600">{entry.date}</td>
                      <td className="py-3">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          {entry.voucherNumber}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600">{entry.supplierName || '—'}</td>
                      <td className="py-3 text-center text-slate-600">{entry.items?.length || 0}</td>
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

        {/* Commodity Distribution Donut */}
        <div className="glass-card p-5">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Commodity Distribution</h2>
          {commodityDist.length === 0 ? (
            <div className="flex items-center justify-center h-60 text-slate-400 text-sm">
              No data available
            </div>
          ) : (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={commodityDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                      stroke="none"
                    >
                      {commodityDist.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => formatCurrency(val, currency)}
                      contentStyle={{
                        borderRadius: '0.75rem',
                        border: '1px solid #6C7293',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="space-y-2 mt-2">
                {commodityDist.slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-slate-600 truncate max-w-[140px]">{item.name}</span>
                    </div>
                    <span className="font-medium text-slate-800">
                      {formatCurrency(item.value, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
