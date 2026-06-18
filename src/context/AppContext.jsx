/**
 * AppContext.jsx
 * ─────────────────────────────────────────────────
 * Global application context providing shared state
 * for currency, user auth, sidebar, and toasts.
 *
 * Wraps children with GoogleOAuthProvider when a
 * Google Client ID is available in env vars.
 * ─────────────────────────────────────────────────
 */

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { DEFAULT_CURRENCY, TOAST_CONFIG } from '../utils/constants';

/* ============================================================
   Context Creation
   ============================================================ */

const AppContext = createContext(null);



/* ============================================================
   Provider Component
   ============================================================ */

/**
 * AppProvider — wraps the application with shared state.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function AppProvider({ children }) {


  // ── Currency ─────────────────────────────────
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);

  // ── Sidebar ──────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ── Toast Notifications ──────────────────────
  const [toasts, setToasts] = useState([]);

  /* ────────────────────────────────────────────
     Actions
     ──────────────────────────────────────────── */

  /**
   * Toggle the sidebar open/closed.
   */
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  /**
   * Add a toast notification.
   *
   * @param {Object} toast — { type: 'success'|'error'|'warning'|'info', message: string, title?: string }
   */
  const addToast = useCallback((toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const newToast = {
      id,
      type: toast.type || 'info',
      title: toast.title || '',
      message: toast.message || '',
      createdAt: Date.now(),
    };

    setToasts((prev) => {
      // Enforce max toast limit
      const updated = [...prev, newToast];
      if (updated.length > TOAST_CONFIG.maxToasts) {
        return updated.slice(-TOAST_CONFIG.maxToasts);
      }
      return updated;
    });

    // Auto-dismiss after configured duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_CONFIG.duration);

    return id;
  }, []);

  /**
   * Remove a specific toast by ID.
   *
   * @param {string} toastId — The toast ID to remove
   */
  const removeToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  /* ────────────────────────────────────────────
     Memoized Context Value
     ──────────────────────────────────────────── */

  const contextValue = useMemo(
    () => ({
      // State
      currency,
      sidebarOpen,
      toasts,

      // Actions
      setCurrency,
      toggleSidebar,
      addToast,
      removeToast,
    }),
    [currency, sidebarOpen, toasts, toggleSidebar, addToast, removeToast]
  );

  /* ────────────────────────────────────────────
     Render — optionally wrap with GoogleOAuthProvider
     ──────────────────────────────────────────── */

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

/* ============================================================
   Custom Hook
   ============================================================ */

/**
 * useApp — access the AppContext from any child component.
 *
 * @returns {Object} The AppContext value
 * @throws {Error} If used outside of AppProvider
 */
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an <AppProvider>');
  }
  return context;
}

/**
 * useAppContext — backward-compatible alias for useApp.
 * Existing pages may import this name.
 */
export const useAppContext = useApp;

export default AppContext;
