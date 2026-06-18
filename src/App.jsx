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
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react';
import { AppProvider } from './context/AppContext';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import NewEntryPage from './pages/NewEntryPage';
import HistoryPage from './pages/HistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import LedgerPage from './pages/LedgerPage';
import SettingsPage from './pages/SettingsPage';
import InventoryPage from './pages/InventoryPage';

import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

function RootApp() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <>
            <SignedOut>
              <LandingPage />
            </SignedOut>
            <SignedIn>
              <Layout />
            </SignedIn>
          </>
        }>
          {/* Dashboard route will render inside Layout outlet if SignedIn */}
          <Route index element={
            <SignedIn>
              <DashboardPage />
            </SignedIn>
          } />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="new-entry" element={<NewEntryPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="ledger" element={<LedgerPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        
        <Route path="/login" element={
          <SignedOut>
            <LoginPage />
          </SignedOut>
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <AppProvider>
        <RootApp />
      </AppProvider>
    </ClerkProvider>
  );
}
