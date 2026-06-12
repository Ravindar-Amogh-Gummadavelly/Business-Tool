/**
 * Header.jsx
 * -------------------------------------------------
 * Sticky top bar.
 * Left:  hamburger (mobile) + page title
 * Right: live clock, notification bell, Google login/logout, user avatar
 */
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell, Clock, LogOut, User, ChevronDown } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useApp } from '../../context/AppContext';

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
  const { user, setUser } = useApp();

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

  /* ---- User dropdown ---- */
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  /* ---- Google login success ---- */
  const handleLoginSuccess = (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      setUser({
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
      });
    } catch (err) {
      console.error('Google login decode error', err);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setDropdownOpen(false);
  };

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

        {/* Google Login / User Avatar */}
        {user ? (
          <div ref={dropRef} className="relative">
            <button
              id="user-menu-trigger"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border-2 border-indigo-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <span className="hidden md:block text-sm font-medium text-slate-700 max-w-[120px] truncate">
                {user.name}
              </span>
              <ChevronDown className="hidden md:block w-4 h-4 text-slate-400" />
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-fade-in-up">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-800 truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
                <button
                  id="logout-button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div id="google-login-button" data-testid="google-login-button">
            {import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID' ? (
              <GoogleLogin
                onSuccess={handleLoginSuccess}
                onError={() => console.error('Google login failed')}
                size="medium"
                shape="pill"
                theme="outline"
                text="signin"
              />
            ) : (
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                onClick={() => alert('Google Login is disabled. Please set VITE_GOOGLE_CLIENT_ID in your .env file to enable it.')}
              >
                <User className="w-4 h-4" />
                Sign in
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
