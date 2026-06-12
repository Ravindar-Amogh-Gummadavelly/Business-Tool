/**
 * useAnalytics.js
 * ─────────────────────────────────────────────────
 * Custom hook for fetching analytics and dashboard
 * KPI data for charts and summary views.
 *
 * Auto-fetches on mount and transforms the raw
 * sample data into the shapes expected by
 * DashboardPage and AnalyticsPage.
 * ─────────────────────────────────────────────────
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import api from '../services/api';
import { useApp } from '../context/AppContext';

/* ============================================================
   Data Transformers
   ============================================================ */

/**
 * Transform raw dashboard data (from getSampleDashboardData)
 * into the shape expected by DashboardPage:
 *   { stats, weeklyTrend, monthlyTrend, recentEntries, commodityDistribution }
 */
function transformDashboardData(raw) {
  if (!raw) return null;

  // --- Stats for the 4 stat cards ---
  const stats = {
    totalSpend: raw.totalSpend || 0,
    totalRevenue: raw.totalRevenue || 0,
    totalItemsIn: raw.totalItemsIn || 0,
    totalItemsOut: raw.totalItemsOut || 0,
    spendChange: 5.2,
    revenueChange: 12.4,
    itemsInChange: 8.4,
    itemsOutChange: 4.1,
  };

  // Compute weekly total from dailySpend (last 7 entries)
  const last7 = (raw.dailySpend || []).slice(-7);

  // --- Weekly trend bar chart (last 7 days) ---
  const weeklyTrend = last7.map((d) => ({
    day: d.label || d.date,
    value: d.spend || 0,
  }));

  // --- Monthly trend line/area chart (last 30 days) ---
  const monthlyTrend = (raw.dailySpend || []).map((d) => ({
    date: d.label || d.date,
    value: d.spend || 0,
  }));

  // --- Recent entries for the table ---
  const recentEntries = (raw.latestPurchases || []).map((h) => ({
    id: h.Purchase_ID,
    date: h.Date
      ? new Date(h.Date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '—',
    voucherNumber: h.Purchase_ID,
    supplierName: h.Supplier || '',
    items: Array.from({ length: h.Item_Count || 0 }),
    grandTotal: h.Grand_Total || 0,
  }));

  // --- Commodity distribution donut chart ---
  const commodityDistribution = Object.entries(raw.spendByCommodity || {}).map(
    ([name, value]) => ({ name, value: Math.round(value * 100) / 100 })
  );

  return {
    stats,
    weeklyTrend,
    monthlyTrend,
    recentEntries,
    commodityDistribution,
  };
}

/**
 * Transform raw analytics data (from getSampleAnalyticsData)
 * into the shape expected by AnalyticsPage:
 *   { daily, weekly, monthly, commodityTrends, availableCommodities }
 */
function transformAnalyticsData(raw, dashboardRaw) {
  if (!raw) return null;

  const allHeaders = dashboardRaw?.latestPurchases || [];

  // ── DAILY tab ──────────────────────────
  const today = new Date().toISOString().split('T')[0];

  // Find today's entries from commodity data
  const dailyCommodityBreakdown = (raw.commodityData || []).map((c) => ({
    name: c.name,
    value: Math.round((c.spend / Math.max(raw.commodityData.length, 1)) * 100) / 100,
  }));

  const daily = {
    entriesCount: raw.weeklySpend?.[raw.weeklySpend.length - 1]?.orders || 0,
    totalValue: raw.weeklySpend?.[raw.weeklySpend.length - 1]?.spend || 0,
    avgValue: 0,
    topCommodity: raw.commodityData?.[0]?.name || '—',
    commodityBreakdown: dailyCommodityBreakdown,
    entries: [], // today's individual entries — typically empty in sample mode
  };
  if (daily.entriesCount > 0) {
    daily.avgValue = Math.round((daily.totalValue / daily.entriesCount) * 100) / 100;
  }

  // ── WEEKLY tab ──────────────────────────
  const weeklyTotalSpend = raw.weeklySpend?.reduce((s, w) => s + w.spend, 0) || 0;
  const weeklyTotalOrders = raw.weeklySpend?.reduce((s, w) => s + w.orders, 0) || 0;

  // Build daily trend for the 7-day product vs logistics chart
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dailyTrend = weekDays.map((day, i) => {
    // Distribute the weekly spend across weekdays
    const ws = raw.weeklySpend || [];
    const weekData = ws[ws.length - 1] || { spend: 0 };
    const daySpend = Math.round((weekData.spend / 7) * (0.7 + Math.random() * 0.6) * 100) / 100;
    const dayLogistics = Math.round(daySpend * (0.05 + Math.random() * 0.1) * 100) / 100;
    return {
      day,
      product: daySpend,
      logistics: dayLogistics,
    };
  });

  // Build commodity-by-day stacked bar data
  const commodityNames = (raw.commodityData || []).slice(0, 5).map((c) => c.name);
  const commodityByDay = weekDays.map((day) => {
    const entry = { day };
    commodityNames.forEach((name) => {
      const cd = raw.commodityData?.find((c) => c.name === name);
      entry[name] = cd ? Math.round((cd.spend / 7) * (0.5 + Math.random()) * 100) / 100 : 0;
    });
    return entry;
  });

  // Top commodities this week
  const topCommodities = (raw.commodityData || []).slice(0, 5).map((c) => ({
    name: c.name,
    quantity: c.quantity,
    unit: 'pcs',
    value: Math.round(c.spend * 100) / 100,
  }));

  // Estimate product vs logistics split
  const totalLogistics = raw.logisticsRatio?.reduce((s, l) => s + l.logistics, 0) || 0;
  const totalProduct = raw.logisticsRatio?.reduce((s, l) => s + l.subtotal, 0) || 0;

  const weekly = {
    entriesCount: weeklyTotalOrders,
    totalValue: Math.round(weeklyTotalSpend * 100) / 100,
    totalChange: raw.monthComparison?.changePercent || 0,
    productValue: Math.round(totalProduct * 100) / 100,
    logisticsValue: Math.round(totalLogistics * 100) / 100,
    dailyTrend,
    commodityByDay,
    commodityNames,
    topCommodities,
  };

  // ── MONTHLY tab ──────────────────────────
  const monthCurrent = raw.monthComparison?.current || 0;
  const monthPrevious = raw.monthComparison?.previous || 0;
  const daysInMonth = new Date().getDate();

  // Build cumulative 30-day trend
  const cumulativeTrend = [];
  let cumSum = 0;
  for (let i = 29; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const dayLabel = day.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    // Simulate daily spend contribution
    const daySpend = Math.round((monthCurrent / 30) * (0.3 + Math.random() * 1.4) * 100) / 100;
    cumSum += daySpend;
    cumulativeTrend.push({
      date: dayLabel,
      cumulative: Math.round(cumSum * 100) / 100,
    });
  }

  // Commodity distribution pie for monthly
  const monthlyCommodityDist = (raw.commodityData || []).map((c) => ({
    name: c.name,
    value: Math.round(c.spend * 100) / 100,
  }));

  // Supplier breakdown
  const totalSupplierSpend = raw.supplierRanking?.reduce((s, sr) => s + sr.spend, 0) || 1;
  const supplierBreakdown = (raw.supplierRanking || []).map((sr) => ({
    name: sr.name,
    count: sr.orders,
    value: Math.round(sr.spend * 100) / 100,
    share: Math.round((sr.spend / totalSupplierSpend) * 10000) / 100,
  }));

  const monthly = {
    entriesCount: weeklyTotalOrders,
    entriesChange: raw.monthComparison?.changePercent || 0,
    totalValue: Math.round(monthCurrent * 100) / 100,
    totalChange: raw.monthComparison?.changePercent || 0,
    dailyAvg: daysInMonth > 0 ? Math.round((monthCurrent / daysInMonth) * 100) / 100 : 0,
    avgChange: raw.monthComparison?.changePercent ? raw.monthComparison.changePercent * 0.7 : 0,
    topSupplier: raw.supplierRanking?.[0]?.name || '—',
    cumulativeTrend,
    commodityDistribution: monthlyCommodityDist,
    supplierBreakdown,
  };

  // ── COMMODITY TRENDS (always-visible section) ──────
  const allCommodityNames = (raw.commodityData || []).map((c) => c.name);

  // Build a date-indexed trend from priceTrends
  const dateSet = new Set();
  Object.values(raw.priceTrends || {}).forEach((entries) => {
    entries.forEach((e) => dateSet.add(e.date));
  });
  const sortedDates = [...dateSet].sort();

  const commodityTrends = sortedDates.map((date) => {
    const entry = {
      date: new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    };
    allCommodityNames.forEach((name) => {
      const priceEntries = (raw.priceTrends?.[name] || []).filter((e) => e.date === date);
      if (priceEntries.length > 0) {
        entry[name] = Math.round(
          (priceEntries.reduce((s, e) => s + e.price, 0) / priceEntries.length) * 100
        ) / 100;
      }
    });
    return entry;
  });

  return {
    daily,
    weekly,
    monthly,
    commodityTrends,
    availableCommodities: allCommodityNames,
  };
}

/* ============================================================
   Hook
   ============================================================ */

/**
 * useAnalytics — provides analytics data and dashboard KPIs.
 *
 * @returns {Object} { analytics, dashboardData, loading, error, fetchAnalytics, getDashboardData }
 */
export function useAnalytics() {
  const { addToast } = useApp();

  // ── State ────────────────────────────────────
  const [analytics, setAnalytics] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Track whether initial fetch has been done
  const hasFetched = useRef(false);

  // Store raw data for cross-referencing
  const rawDashboardRef = useRef(null);

  /* ────────────────────────────────────────────
     Fetch Analytics
     ──────────────────────────────────────────── */

  /**
   * Fetch analytics data for a given time period.
   *
   * @param {string} period — '7d', '30d', '90d', or 'custom'
   * @param {Object} dateRange — { startDate, endDate } for custom period
   */
  const fetchAnalytics = useCallback(async (period = '30d', dateRange = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = { period, ...dateRange };
      const result = await api.getAnalytics(params);

      if (result.success !== false) {
        const rawData = result.data || result;
        const transformed = transformAnalyticsData(rawData, rawDashboardRef.current);
        setAnalytics(transformed);
      } else {
        throw new Error(result.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      addToast({
        type: 'error',
        title: 'Analytics Error',
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  /* ────────────────────────────────────────────
     Get Dashboard Data
     ──────────────────────────────────────────── */

  /**
   * Fetch dashboard KPI and summary data.
   */
  const getDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.getDashboardData();

      if (result.success !== false) {
        const rawData = result.data || result;
        rawDashboardRef.current = rawData;
        setDashboardData(transformDashboardData(rawData));
      } else {
        throw new Error(result.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      addToast({
        type: 'error',
        title: 'Dashboard Error',
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  /* ────────────────────────────────────────────
     Refresh All
     ──────────────────────────────────────────── */

  /**
   * Refresh both analytics and dashboard data.
   *
   * @param {string} period — Analytics period
   */
  const refreshAll = useCallback(async (period = '30d') => {
    setLoading(true);
    setError(null);

    try {
      const [analyticsResult, dashboardResult] = await Promise.all([
        api.getAnalytics({ period }),
        api.getDashboardData(),
      ]);

      if (dashboardResult.success !== false) {
        const rawDash = dashboardResult.data || dashboardResult;
        rawDashboardRef.current = rawDash;
        setDashboardData(transformDashboardData(rawDash));
      }

      if (analyticsResult.success !== false) {
        const rawAnalytics = analyticsResult.data || analyticsResult;
        setAnalytics(transformAnalyticsData(rawAnalytics, rawDashboardRef.current));
      }
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      addToast({
        type: 'error',
        title: 'Refresh Error',
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
      refreshAll();
    }
  }, [refreshAll]);

  /* ────────────────────────────────────────────
     Merge analytics into a single unified object
     for backward-compatibility with pages that
     read from `analytics` directly.
     ──────────────────────────────────────────── */
  const mergedAnalytics = analytics
    ? {
        ...analytics,
        // Also include dashboard data so DashboardPage can use it
        ...(dashboardData || {}),
      }
    : dashboardData || null;

  /* ────────────────────────────────────────────
     Return
     ──────────────────────────────────────────── */

  return {
    analytics: mergedAnalytics,
    dashboardData,
    loading,
    error,
    fetchAnalytics,
    getDashboardData,
    refreshAll,
  };
}

export default useAnalytics;
