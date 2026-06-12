/**
 * api.js
 * ─────────────────────────────────────────────────
 * API service layer for the Stock Inward Dashboard.
 *
 * Reads VITE_APPS_SCRIPT_URL and VITE_USE_SAMPLE_DATA
 * from environment. When sample mode is on, returns
 * mock data from sampleData.js instead of hitting
 * the network.
 * ─────────────────────────────────────────────────
 */

import {
  sampleHeaders,
  sampleItems,
  getSampleDashboardData,
  getSampleLedgerData,
  getSampleInventory,
  INVENTORY,
} from '../utils/sampleData';

/* ============================================================
   Environment Configuration
   ============================================================ */

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '';
const USE_SAMPLE_DATA = import.meta.env.VITE_USE_SAMPLE_DATA === 'true';

/** Default request timeout (30 seconds) */
const TIMEOUT_MS = 30000;

/* ============================================================
   HTTP Helpers
   ============================================================ */

/**
 * Build a URL with query parameters appended.
 *
 * @param {string} base   — Base URL
 * @param {Object} params — Key/value pairs for query string
 * @returns {string} Full URL with encoded query params
 */
function buildUrl(base, params = {}) {
  const url = new URL(base);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, value);
    }
  });
  return url.toString();
}

/**
 * Execute a fetch request with a timeout.
 *
 * @param {string}  url     — Request URL
 * @param {Object}  options — fetch() options
 * @returns {Promise<any>} Parsed JSON response
 */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * GET request — appends params to URL query string.
 *
 * @param {string} action — The Apps Script action name (passed as ?action=...)
 * @param {Object} params — Additional query parameters
 * @returns {Promise<any>} Parsed response
 */
async function apiGet(action, params = {}) {
  if (!APPS_SCRIPT_URL) {
    throw new Error('API URL is not configured. Set VITE_APPS_SCRIPT_URL in your .env file.');
  }

  const url = buildUrl(APPS_SCRIPT_URL, { action, ...params });
  return fetchWithTimeout(url);
}

/**
 * POST request — sends JSON payload as text/plain
 * (CORS workaround for Google Apps Script).
 *
 * @param {string} action — The Apps Script action name
 * @param {Object} data   — Request body data
 * @returns {Promise<any>} Parsed response
 */
async function apiPost(action, data = {}) {
  if (!APPS_SCRIPT_URL) {
    throw new Error('API URL is not configured. Set VITE_APPS_SCRIPT_URL in your .env file.');
  }

  const url = buildUrl(APPS_SCRIPT_URL, { action });

  return fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain', // CORS workaround for Apps Script
    },
    body: JSON.stringify(data),
  });
}

/* ============================================================
   Simulated Delay (for sample data mode)
   ============================================================ */

/**
 * Add a small artificial delay to mimic network latency
 * when using sample data.
 *
 * @param {number} ms — Milliseconds to wait (default 300-800ms random)
 * @returns {Promise<void>}
 */
function simulateDelay(ms) {
  const delay = ms || Math.floor(Math.random() * 500) + 300;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/* ============================================================
   API Methods
   ============================================================ */

const api = {
  /**
   * Get all products/commodities from inventory.
   */
  async getInventory() {
    if (USE_SAMPLE_DATA) {
      await simulateDelay();
      return {
        success: true,
        data: getSampleInventory(),
      };
    }
    return apiGet('getInventory');
  },

  /**
   * Add a new product to inventory.
   */
  async addProduct(product) {
    if (USE_SAMPLE_DATA) {
      await simulateDelay();
      const newProduct = {
        id: `PRD-${String(INVENTORY.length + 1).padStart(3, '0')}`,
        ...product,
        stock: 0
      };
      INVENTORY.push(newProduct);
      return { success: true, data: newProduct };
    }
    return apiPost('addProduct', product);
  },

  /**
   * Add a new entry (Inward or Outward).
   *
   * @param {Object} data — The form data to save
   * @returns {Promise<Object>} Created entry confirmation
   */
  async addEntry(data) {
    if (USE_SAMPLE_DATA) {
      await simulateDelay();

      // Simulate adding to local cache
      const newHeader = {
        Purchase_ID: data.purchaseId,
        Entry_Type: data.entryType || 'Inward',
        Date: new Date(data.billingDate || new Date()).toISOString(),
        Supplier: data.supplier || '',
        Item_Count: data.items?.length || 0,
        Subtotal: data.subtotal || 0,
        Logistics_Cost: data.logisticsCost || 0,
        Grand_Total: data.grandTotal || 0,
        Notes: data.notes || '',
        Created_By: data.createdBy || 'demo@example.com',
        Status: data.entryType === 'Outward' ? 'Completed' : 'Received',
      };

      // Push to sample mock data
      sampleHeaders.unshift(newHeader);

      if (data.items) {
        data.items.forEach((item, idx) => {
          sampleItems.unshift({
            Purchase_ID: data.purchaseId,
            Item_Index: idx + 1,
            Commodity: item.commodity,
            Quantity: item.quantity,
            Unit: item.unit,
            Unit_Price: item.unitPrice,
            Line_Total: item.subtotal,
          });

          // Adjust local inventory stock
          const invItem = INVENTORY.find(p => p.name === item.commodity);
          if (invItem) {
            if (newHeader.Entry_Type === 'Inward') invItem.stock += Number(item.quantity);
            else invItem.stock -= Number(item.quantity);
          }
        });
      }

      return {
        success: true,
        message: 'Entry added successfully (sample mode)',
        data: newHeader,
      };
    }

    return apiPost('addEntry', data);
  },

  /**
   * Get purchase entries with optional filters.
   *
   * @param {Object} filters — { startDate, endDate, supplier, commodity, status, search }
   * @returns {Promise<Object>} { headers: [...], items: [...] }
   */
  async getPurchases(filters = {}) {
    if (USE_SAMPLE_DATA) {
      await simulateDelay();

      let filteredHeaders = [...sampleHeaders];
      let filteredItems = [...sampleItems];

      // Apply date filters
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        filteredHeaders = filteredHeaders.filter((h) => new Date(h.Date) >= start);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59);
        filteredHeaders = filteredHeaders.filter((h) => new Date(h.Date) <= end);
      }

      // Apply supplier filter
      if (filters.supplier) {
        filteredHeaders = filteredHeaders.filter((h) =>
          h.Supplier.toLowerCase().includes(filters.supplier.toLowerCase())
        );
      }

      // Apply status filter
      if (filters.status) {
        filteredHeaders = filteredHeaders.filter((h) => h.Status === filters.status);
      }

      // Apply search filter (purchase ID, supplier, notes)
      if (filters.search) {
        const q = filters.search.toLowerCase();
        filteredHeaders = filteredHeaders.filter(
          (h) =>
            h.Purchase_ID.toLowerCase().includes(q) ||
            h.Supplier.toLowerCase().includes(q) ||
            (h.Notes && h.Notes.toLowerCase().includes(q))
        );
      }

      // Filter items to match filtered headers
      const headerIds = new Set(filteredHeaders.map((h) => h.Purchase_ID));
      filteredItems = filteredItems.filter((item) => headerIds.has(item.Purchase_ID));

      // Apply commodity filter on items
      if (filters.commodity) {
        filteredItems = filteredItems.filter((item) =>
          item.Commodity.toLowerCase().includes(filters.commodity.toLowerCase())
        );
        // Also filter headers to those that have matching items
        const itemHeaderIds = new Set(filteredItems.map((i) => i.Purchase_ID));
        filteredHeaders = filteredHeaders.filter((h) => itemHeaderIds.has(h.Purchase_ID));
      }

      // Sort by date descending (newest first)
      filteredHeaders.sort((a, b) => new Date(b.Date) - new Date(a.Date));

      return {
        success: true,
        headers: filteredHeaders,
        items: filteredItems,
        totalCount: filteredHeaders.length,
      };
    }

    return apiGet('getPurchases', filters);
  },

  /**
   * Get analytics data for a given time period.
   *
   * @param {Object} params — { period: '7d' | '30d' | '90d' | 'custom', startDate, endDate }
   * @returns {Promise<Object>} Analytics data
   */
  async getAnalytics(params = {}) {
    if (USE_SAMPLE_DATA) {
      await simulateDelay();
      return {
        success: true,
        data: getSampleAnalyticsData(),
      };
    }

    return apiGet('getAnalytics', params);
  },

  /**
   * Get dashboard KPI / summary data.
   *
   * @returns {Promise<Object>} Dashboard overview data
   */
  async getDashboardData() {
    if (USE_SAMPLE_DATA) {
      await simulateDelay();
      return {
        success: true,
        data: getSampleDashboardData(),
      };
    }

    return apiGet('getDashboardData');
  },

  /**
   * Delete a purchase by ID.
   *
   * @param {string} purchaseId — The Purchase_ID to delete
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deletePurchase(purchaseId) {
    if (USE_SAMPLE_DATA) {
      await simulateDelay();
      return {
        success: true,
        message: `Purchase ${purchaseId} deleted (sample mode)`,
      };
    }

    return apiPost('deletePurchase', { purchaseId });
  },

  /**
   * Update an existing purchase.
   *
   * @param {string} purchaseId — The Purchase_ID to update
   * @param {Object} data       — Updated fields
   * @returns {Promise<Object>} Update confirmation
   */
  async updatePurchase(purchaseId, data) {
    if (USE_SAMPLE_DATA) {
      await simulateDelay();
      return {
        success: true,
        message: `Purchase ${purchaseId} updated (sample mode)`,
        data: { ...data, Purchase_ID: purchaseId },
      };
    }

    return apiPost('updatePurchase', { purchaseId, ...data });
  },

  /**
   * Get ledger data (transactions, opening/closing balance).
   */
  async getLedgerData() {
    if (USE_SAMPLE_DATA) {
      await simulateDelay();
      return {
        success: true,
        data: getSampleLedgerData(),
      };
    }
    return apiGet('getLedgerData');
  },

  /**
   * Add a new ledger transaction.
   */
  async addTransaction(data) {
    if (USE_SAMPLE_DATA) {
      await simulateDelay();
      const currentLedger = getSampleLedgerData();
      
      const newTxn = {
        id: `TXN-NEW-${Date.now()}`,
        date: new Date().toISOString(),
        description: data.description || 'Manual Entry',
        type: data.type || 'credit',
        amount: Number(data.amount) || 0,
        balance: currentLedger.currentBalance + (data.type === 'debit' ? -Number(data.amount) : Number(data.amount)),
      };

      currentLedger.transactions.unshift(newTxn);
      currentLedger.currentBalance = newTxn.balance;

      return {
        success: true,
        message: 'Transaction added successfully',
        data: newTxn,
      };
    }

    return apiPost('addTransaction', data);
  },
};

export { api };
export default api;
