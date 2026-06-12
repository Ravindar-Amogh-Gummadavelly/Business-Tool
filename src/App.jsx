/**
 * App.jsx
 * -------------------------------------------------
 * Root application component.
 * Sets up React Router (BrowserRouter) with routes:
 *   /           → DashboardPage
 *   /new-entry  → NewEntryPage
 *   /history    → HistoryPage
 *   /analytics  → AnalyticsPage
 *
 * Wrapped in AppProvider (which handles GoogleOAuthProvider internally).
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import NewEntryPage from './pages/NewEntryPage';
import HistoryPage from './pages/HistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import LedgerPage from './pages/LedgerPage';
import SettingsPage from './pages/SettingsPage';
import InventoryPage from './pages/InventoryPage';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Layout wraps all pages (sidebar + header) */}
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/new-entry" element={<NewEntryPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/ledger" element={<LedgerPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
