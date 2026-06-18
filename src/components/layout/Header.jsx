/**
 * Header.jsx
 * -------------------------------------------------
 * Sticky top bar.
 * Left:  hamburger (mobile) + page title
 * Right: live clock, notification bell, Google login/logout, user avatar
 */
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell, Clock, ChevronDown } from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';

/* Map route path → page title */
const PAGE_TITLES = {
  '/': 'Dashboard',
  '/inventory': 'Inventory',
  '/new-entry': 'New Entry',
  '/history': 'History',
  '/analytics': 'Analytics',
  '/ledger': 'Ledger',
  '/settings': 'Settings',
};

export default function Header({ onMenuClick }) {
  const { pathname } = useLocation();

  /* ---- Live clock ---- */
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const formattedDate = now.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const pageTitle = PAGE_TITLES[pathname] || 'StockFlow';

  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white border-b border-slate-200 shadow-sm"
    >
      {/* ---- Left: hamburger + title ---- */}
      <div className="flex items-center gap-3">
        <button
          id="menu-toggle"
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg md:text-xl font-semibold text-slate-800 tracking-tight">
          {pageTitle}
        </h1>
      </div>

      {/* ---- Right section ---- */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Date / Time */}
        <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
          <Clock className="w-4 h-4" />
          <span>{formattedDate}</span>
          <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">
            {formattedTime}
          </span>
        </div>

        {/* Notification bell */}
        <button
          id="notification-bell"
          className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {/* Badge */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
