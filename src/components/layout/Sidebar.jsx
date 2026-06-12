/**
 * Sidebar.jsx
 * -------------------------------------------------
 * Fixed left sidebar with dark navy background.
 * Expands (280px) / collapses (72px) with smooth transition.
 * On mobile: overlay with backdrop.
 * Navigation: Dashboard, New Entry, History, Analytics
 * Bottom: currency selector + user avatar/name + collapse toggle
 */
import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  BarChart3,
  Wallet,
  Settings,
  ChevronLeft,
  ChevronRight,
  Package,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CURRENCIES } from '../../utils/constants';

/* ---- Navigation items ---- */
const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Inventory', icon: Package, path: '/inventory' },
  { label: 'New Entry', icon: PlusCircle, path: '/new-entry' },
  { label: 'History', icon: ClipboardList, path: '/history' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { label: 'Ledger', icon: Wallet, path: '/ledger' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const { currency, setCurrency, user } = useApp();

  /* Close mobile sidebar on route change */
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, setMobileOpen]);

  /* Determine expanded width */
  const expandedW = 'w-[280px]';
  const collapsedW = 'w-[72px]';

  return (
    <>
      {/* ---- Mobile backdrop ---- */}
      {mobileOpen && (
        <div
          id="sidebar-backdrop"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ---- Sidebar ---- */}
      <aside
        id="sidebar"
        className={`
          fixed top-0 left-0 z-50 h-screen flex flex-col
          bg-[#0f172a] text-slate-300 sidebar-transition
          ${collapsed ? collapsedW : expandedW}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* ---- Logo / Brand ---- */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-white tracking-tight whitespace-nowrap">
              StockFlow
            </span>
          )}
          {/* Mobile close */}
          <button
            id="sidebar-mobile-close"
            className="ml-auto lg:hidden text-slate-400 hover:text-white"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ---- Navigation ---- */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV_ITEMS.map(({ label, icon: Icon, path }) => (
            <NavLink
              key={path}
              to={path}
              id={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                 transition-all duration-200 group relative
                 ${
                   isActive
                     ? 'bg-indigo-500/10 text-white border-l-[3px] border-indigo-500 pl-[9px]'
                     : 'text-slate-400 hover:bg-white/5 hover:text-white border-l-[3px] border-transparent pl-[9px]'
                 }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{label}</span>}
              {collapsed && (
                <span className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-xs text-white rounded opacity-0 pointer-events-none group-hover:opacity-100 whitespace-nowrap z-50 transition-opacity">
                  {label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ---- Bottom section ---- */}
        <div className="border-t border-white/10 p-3 space-y-3">
          {/* Currency Selector */}
          <div className={`${collapsed ? 'px-0 flex justify-center' : ''}`}>
            {collapsed ? (
              <span className="text-xs font-semibold text-slate-400">
                {CURRENCIES.find((c) => c.code === currency)?.symbol || '₹'}
              </span>
            ) : (
              <select
                id="currency-selector"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer"
              >
                {CURRENCIES.map(({ code, symbol, name }) => (
                  <option key={code} value={code} className="bg-slate-800 text-white">
                    {symbol} {code} — {name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* User info */}
          {user && (
            <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border-2 border-indigo-500/50 flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              {!collapsed && (
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
              )}
            </div>
          )}

          {/* Collapse toggle (desktop only) */}
          <button
            id="sidebar-toggle"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-full items-center justify-center gap-2 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
