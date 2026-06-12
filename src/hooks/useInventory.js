import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export function useInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getInventory();
      if (res.success) {
        setInventory(res.data);
      } else {
        setError(res.error || 'Failed to fetch inventory');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error connecting to the server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const addProduct = async (productData) => {
    setLoading(true);
    try {
      const res = await api.addProduct(productData);
      if (res.success) {
        setInventory(prev => [...prev, res.data]);
        return res;
      }
      throw new Error(res.error || 'Failed to add product');
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { inventory, loading, error, fetchInventory, addProduct };
}
