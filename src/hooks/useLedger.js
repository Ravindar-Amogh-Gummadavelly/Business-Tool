/**
 * useLedger.js
 * ─────────────────────────────────────────────────
 * Custom hook for fetching and managing ledger data.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import api from '../services/api';
import { useApp } from '../context/AppContext';

export function useLedger() {
  const { addToast } = useApp();

  const [ledger, setLedger] = useState({
    transactions: [],
    currentBalance: 0,
    openingBalance: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const hasFetched = useRef(false);

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.getLedgerData();
      if (result.success !== false) {
        setLedger(result.data || result);
      } else {
        throw new Error(result.message || 'Failed to fetch ledger');
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

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchLedger();
    }
  }, [fetchLedger]);

  const addTransaction = useCallback(async (data) => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.addTransaction(data);
      if (result.success) {
        addToast({
          type: 'success',
          title: 'Transaction Added',
          message: `Transaction recorded successfully.`,
        });
        await fetchLedger();
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to add transaction');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to add transaction';
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
  }, [addToast, fetchLedger]);

  return {
    ledger,
    loading,
    error,
    fetchLedger,
    addTransaction,
  };
}

export default useLedger;
