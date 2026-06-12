/**
 * usePurchases.js
 * ─────────────────────────────────────────────────
 * Custom hook for managing purchase data —
 * fetching, adding, and state management.
 *
 * Auto-fetches on mount and transforms raw API
 * data ({ headers, items }) into flat purchase
 * entries for HistoryPage consumption.
 * ─────────────────────────────────────────────────
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import api from '../services/api';
import { useApp } from '../context/AppContext';

/**
 * Transform raw API data ({ headers, items }) into
 * flat purchase entries for HistoryPage.
 *
 * Each entry: { id, billingDate, voucherNumber, supplierName,
 *   logisticsCharges, productSubtotal, grandTotal, notes, items[] }
 */
function transformPurchases(raw) {
  const { headers = [], items = [] } = raw;

  // Group items by Purchase_ID for fast lookup
  const itemsByPurchaseId = {};
  items.forEach((item) => {
    const pid = item.Purchase_ID;
    if (!itemsByPurchaseId[pid]) itemsByPurchaseId[pid] = [];
    itemsByPurchaseId[pid].push({
      commodity: item.Commodity,
      quantity: item.Quantity,
      unit: item.Unit,
      unitPrice: item.Unit_Price,
      subtotal: item.Line_Total,
    });
  });

  return headers.map((h) => ({
    id: h.Purchase_ID,
    billingDate: h.Date ? h.Date.split('T')[0] : '',
    voucherNumber: h.Purchase_ID,
    supplierName: h.Supplier || '',
    logisticsCharges: h.Logistics_Cost || 0,
    productSubtotal: h.Subtotal || 0,
    grandTotal: h.Grand_Total || 0,
    notes: h.Notes || '',
    status: h.Status || 'Received',
    items: itemsByPurchaseId[h.Purchase_ID] || [],
  }));
}

/**
 * usePurchases — provides purchase data and CRUD operations.
 *
 * @returns {Object} { purchases, loading, error, fetchPurchases, addPurchase }
 */
export function usePurchases() {
  const { addToast } = useApp();

  // ── State ────────────────────────────────────
  const [rawPurchases, setRawPurchases] = useState({
    headers: [],
    items: [],
    totalCount: 0,
  });
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Track whether initial fetch has been done
  const hasFetched = useRef(false);

  /* ────────────────────────────────────────────
     Fetch Purchases
     ──────────────────────────────────────────── */

  /**
   * Fetch purchases with optional filters.
   *
   * @param {Object} filters — { startDate, endDate, supplier, commodity, status, search }
   */
  const fetchPurchases = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.getPurchases(filters);

      if (result.success !== false) {
        const raw = {
          headers: result.headers || [],
          items: result.items || [],
          totalCount: result.totalCount || result.headers?.length || 0,
        };
        setRawPurchases(raw);
        setPurchases(transformPurchases(raw));
      } else {
        throw new Error(result.message || 'Failed to fetch purchases');
      }
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      addToast({
        type: 'error',
        title: 'Fetch Error',
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  /* ────────────────────────────────────────────
     Auto-fetch on mount
     ──────────────────────────────────────────── */
  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchPurchases();
    }
  }, [fetchPurchases]);

  /* ────────────────────────────────────────────
     Add Purchase
     ──────────────────────────────────────────── */

  /**
   * Add a new purchase and refresh the list.
   *
   * @param {Object} data — Purchase data (header + items)
   * @returns {Promise<Object|null>} The created purchase or null on error
   */
  const addPurchase = useCallback(async (data) => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.addPurchase(data);

      if (result.success) {
        addToast({
          type: 'success',
          title: 'Purchase Added',
          message: `Purchase ${data.purchaseId || ''} has been recorded successfully.`,
        });

        // Refresh the purchases list
        await fetchPurchases();

        return result.data;
      } else {
        throw new Error(result.message || 'Failed to add purchase');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to add purchase';
      setError(errorMessage);
      addToast({
        type: 'error',
        title: 'Add Error',
        message: errorMessage,
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [addToast, fetchPurchases]);

  /* ────────────────────────────────────────────
     Delete Purchase
     ──────────────────────────────────────────── */

  /**
   * Delete a purchase by ID and refresh the list.
   *
   * @param {string} purchaseId — The Purchase_ID to delete
   * @returns {Promise<boolean>} True if successful
   */
  const deletePurchase = useCallback(async (purchaseId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.deletePurchase(purchaseId);

      if (result.success) {
        addToast({
          type: 'success',
          title: 'Purchase Deleted',
          message: `Purchase ${purchaseId} has been removed.`,
        });

        // Refresh the purchases list
        await fetchPurchases();

        return true;
      } else {
        throw new Error(result.message || 'Failed to delete purchase');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to delete purchase';
      setError(errorMessage);
      addToast({
        type: 'error',
        title: 'Delete Error',
        message: errorMessage,
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [addToast, fetchPurchases]);

  /* ────────────────────────────────────────────
     Return
     ──────────────────────────────────────────── */

  return {
    purchases,
    rawPurchases,
    loading,
    error,
    fetchPurchases,
    addPurchase,
    deletePurchase,
  };
}

export default usePurchases;
