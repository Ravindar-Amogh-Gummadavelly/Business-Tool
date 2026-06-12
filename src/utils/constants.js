/**
 * constants.js
 * ─────────────────────────────────────────────────
 * Central configuration constants for the
 * Stock Inward Dashboard application.
 * ─────────────────────────────────────────────────
 */

import {
  LayoutDashboard,
  PackagePlus,
  ClipboardList,
  BarChart3,
  Settings,
  FileSpreadsheet,
  Truck,
  Users,
  Bell,
} from 'lucide-react';

/* ============================================================
   Supported Currencies
   ============================================================ */
export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

/** Default currency code */
export const DEFAULT_CURRENCY = 'INR';

/* ============================================================
   Supported Units of Measurement
   ============================================================ */
export const UNITS = [
  { value: 'pcs', label: 'Pieces' },
  { value: 'kg', label: 'Kilograms' },
  { value: 'boxes', label: 'Boxes' },
  { value: 'dozens', label: 'Dozens' },
  { value: 'meters', label: 'Meters' },
  { value: 'liters', label: 'Liters' },
];

/** Default unit value */
export const DEFAULT_UNIT = 'pcs';

/* ============================================================
   Sidebar Navigation Items
   ============================================================ */
export const NAV_ITEMS = [
  {
    id: 'nav-dashboard',
    label: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
    description: 'Overview & KPIs',
  },
  {
    id: 'nav-add-purchase',
    label: 'Add Purchase',
    path: '/add-purchase',
    icon: PackagePlus,
    description: 'Record new stock inward',
  },
  {
    id: 'nav-purchases',
    label: 'Purchases',
    path: '/purchases',
    icon: ClipboardList,
    description: 'View all entries',
  },
  {
    id: 'nav-analytics',
    label: 'Analytics',
    path: '/analytics',
    icon: BarChart3,
    description: 'Charts & insights',
  },
  {
    id: 'nav-suppliers',
    label: 'Suppliers',
    path: '/suppliers',
    icon: Truck,
    description: 'Manage suppliers',
  },
  {
    id: 'nav-reports',
    label: 'Reports',
    path: '/reports',
    icon: FileSpreadsheet,
    description: 'Generate reports',
  },
  {
    id: 'nav-team',
    label: 'Team',
    path: '/team',
    icon: Users,
    description: 'Team members',
  },
  {
    id: 'nav-notifications',
    label: 'Notifications',
    path: '/notifications',
    icon: Bell,
    description: 'Alerts & updates',
  },
  {
    id: 'nav-settings',
    label: 'Settings',
    path: '/settings',
    icon: Settings,
    description: 'App preferences',
  },
];

/* ============================================================
   Commodity Master List
   ============================================================ */
export const COMMODITIES = [
  { id: 'roti-basic', name: 'Roti Maker Basic', priceRange: [450, 550] },
  { id: 'roti-premium', name: 'Roti Maker Premium', priceRange: [850, 1050] },
  { id: 'roti-deluxe', name: 'Roti Maker Deluxe', priceRange: [1400, 1700] },
  { id: 'chapati-press', name: 'Chapati Press Standard', priceRange: [350, 450] },
  { id: 'dough-mixer', name: 'Dough Mixer Compact', priceRange: [2200, 2800] },
];

/* ============================================================
   Supplier Master List
   ============================================================ */
export const SUPPLIERS = [
  'Sharma Kitchen Appliances',
  'Gupta Manufacturing Co.',
  'Sri Krishna Enterprises',
  'Patel Industries',
  'Agarwal Traders',
];

/* ============================================================
   Date Formats
   ============================================================ */
export const DATE_FORMATS = {
  display: 'DD MMM YYYY',        // 23 May 2026
  input: 'YYYY-MM-DD',           // 2026-05-23
  timestamp: 'YYYY-MM-DD HH:mm', // 2026-05-23 14:30
};

/* ============================================================
   API Configuration
   ============================================================ */
export const API_CONFIG = {
  timeout: 30000,      // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000,    // 1 second base delay
};

/* ============================================================
   Toast Configuration
   ============================================================ */
export const TOAST_CONFIG = {
  duration: 5000,       // 5 seconds auto-dismiss
  maxToasts: 5,         // Maximum visible toasts
};

/* ============================================================
   Table Pagination Defaults
   ============================================================ */
export const PAGINATION = {
  defaultPageSize: 10,
  pageSizeOptions: [10, 25, 50, 100],
};
