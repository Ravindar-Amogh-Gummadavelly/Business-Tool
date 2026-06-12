/**
 * Layout.jsx
 * -------------------------------------------------
 * Main app shell: Sidebar + Header + content area.
 * Wraps child routes via React Router <Outlet />.
 * Sidebar collapses on desktop, overlays on mobile.
 */
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  /* Sidebar collapse state (desktop) */
  const [collapsed, setCollapsed] = useState(false);
  /* Sidebar open state (mobile overlay) */
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div id="app-layout" className="flex min-h-screen bg-slate-50">
      {/* ---- Sidebar ---- */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* ---- Main area ---- */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300
          ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'}
        `}
      >
        {/* Header */}
        <Header onMenuClick={() => setMobileOpen(true)} />

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
