/**
 * sampleData.js
 * ─────────────────────────────────────────────────
 * Generates realistic sample purchase entries for
 * the Stock Inward Dashboard (dev & demo mode).
 *
 * 25+ purchase headers with 1-4 line items each,
 * spread across the last 30 days with weekday bias.
 * ─────────────────────────────────────────────────
 */

/* ============================================================
   Master Data
   ============================================================ */

export const INVENTORY = [
  { id: 'PRD-001', name: 'Roti Maker Basic', defaultPrice: 500, stock: 0, minPrice: 450, maxPrice: 550 },
  { id: 'PRD-002', name: 'Roti Maker Premium', defaultPrice: 950, stock: 0, minPrice: 850, maxPrice: 1050 },
  { id: 'PRD-003', name: 'Roti Maker Deluxe', defaultPrice: 1500, stock: 0, minPrice: 1400, maxPrice: 1700 },
  { id: 'PRD-004', name: 'Chapati Press Standard', defaultPrice: 400, stock: 0, minPrice: 350, maxPrice: 450 },
  { id: 'PRD-005', name: 'Dough Mixer Compact', defaultPrice: 2500, stock: 0, minPrice: 2200, maxPrice: 2800 },
];

const SUPPLIERS = [
  'Sharma Kitchen Appliances',
  'Gupta Manufacturing Co.',
  'Sri Krishna Enterprises',
  'Patel Industries',
  'Agarwal Traders',
];

const NOTES = [
  'Regular monthly order',
  'Urgent restock — low inventory',
  'Bulk discount applied',
  'Replacement for defective units',
  'New supplier trial order',
  'Festival season preparation',
  'Quality check passed',
  'Partial delivery — rest pending',
  'Seasonal demand increase',
  '', // blank note
  '', // blank note
  '', // blank note
];

const UNITS_DISTRIBUTION = [
  'pcs', 'pcs', 'pcs', 'pcs', 'pcs', 'pcs', 'pcs', // heavily weighted to pcs
  'boxes', 'boxes',
  'dozens',
];

/* ============================================================
   Helpers
   ============================================================ */

/** Random integer between min and max (inclusive) */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Pick a random element from an array */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Random float between min and max, rounded to 2 decimals */
function randPrice(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

/**
 * Generate a date within the last `daysBack` days,
 * biased towards weekdays (Mon-Fri).
 */
function generateDate(daysBack) {
  const now = new Date();
  let date;
  let attempts = 0;

  do {
    const offset = randInt(0, daysBack);
    date = new Date(now);
    date.setDate(date.getDate() - offset);
    // Set a realistic work-hours time
    date.setHours(randInt(8, 18), randInt(0, 59), randInt(0, 59), 0);
    attempts++;
    // 70% chance to accept weekdays, always accept after 10 attempts
  } while (date.getDay() === 0 || (date.getDay() === 6 && Math.random() > 0.3 && attempts < 10));

  return date;
}

/* ============================================================
   Generate Sample Data
   ============================================================ */

/** Number of purchase headers to generate */
const HEADER_COUNT = 28;

/**
 * Build the full sample dataset.
 * This is called once and cached.
 */
function buildSampleData() {
  const headers = [];
  const items = [];

  // Generate dates first, then sort chronologically
  const dates = [];
  for (let i = 0; i < HEADER_COUNT; i++) {
    dates.push(generateDate(30));
  }
  dates.sort((a, b) => a - b);

    for (let i = 0; i < HEADER_COUNT; i++) {
    const date = dates[i];
    const isOutward = Math.random() < 0.4; // 40% chance it's a sale (Outward)
    const entryType = isOutward ? 'Outward' : 'Inward';
    const prefix = isOutward ? 'SLS' : 'PH';
    const purchaseId = `${prefix}-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${String(1001 + i).padStart(4, '0')}`;
    
    const itemCount = randInt(1, 4);
    const supplier = isOutward 
      ? (Math.random() > 0.2 ? 'Walk-in Customer' : 'Retail Client X') 
      : (Math.random() > 0.15 ? pick(SUPPLIERS) : ''); 
      
    const logistics = isOutward ? 0 : randInt(200, 2500); // Usually no logistics on counter sales
    const note = isOutward ? (Math.random() > 0.5 ? 'Counter Sale' : 'Bulk Sale') : pick(NOTES);

    // Build line items for this entry
    let purchaseTotal = 0;
    const purchaseItems = [];

    // Pick unique commodities for this entry
    const shuffled = [...INVENTORY].sort(() => Math.random() - 0.5);
    const selectedCommodities = shuffled.slice(0, itemCount);

    for (let j = 0; j < itemCount; j++) {
      const commodity = selectedCommodities[j];
      const qty = randInt(1, 20); // smaller quantities for outward
      
      // If inward, add to stock. If outward, subtract.
      if (entryType === 'Inward') {
        commodity.stock += qty;
      } else {
        commodity.stock -= qty;
      }

      // Outward uses a marked up price
      const unitPrice = isOutward 
        ? Math.round(commodity.defaultPrice * 1.2) 
        : randPrice(commodity.minPrice, commodity.maxPrice);
        
      const unit = pick(UNITS_DISTRIBUTION);
      const lineTotal = Math.round(qty * unitPrice * 100) / 100;
      purchaseTotal += lineTotal;

      purchaseItems.push({
        Purchase_ID: purchaseId,
        Item_Index: j + 1,
        Commodity: commodity.name,
        Quantity: qty,
        Unit: unit,
        Unit_Price: unitPrice,
        Line_Total: lineTotal,
      });
    }

    const grandTotal = Math.round((purchaseTotal + logistics) * 100) / 100;

    headers.push({
      Purchase_ID: purchaseId,
      Entry_Type: entryType,
      Date: date.toISOString(),
      Supplier: supplier,
      Item_Count: itemCount,
      Subtotal: Math.round(purchaseTotal * 100) / 100,
      Logistics_Cost: logistics,
      Grand_Total: grandTotal,
      Notes: note,
      Created_By: 'demo@example.com',
      Status: entryType === 'Outward' ? 'Completed' : pick(['Received', 'Received', 'Received', 'Pending', 'In Transit']),
    });

    items.push(...purchaseItems);
  }

  return { headers, items };
}

// Build and cache the sample data
const _cache = buildSampleData();

/* ============================================================
   Exported Data
   ============================================================ */

/** Column definitions for purchase headers table */
export const sampleHeaders = _cache.headers;

/** Line item rows for purchases */
export const sampleItems = _cache.items;

/**
 * Get inventory items with current stock.
 */
export function getSampleInventory() {
  return INVENTORY;
}

/**
 * Get aggregated dashboard KPI data derived from sample entries.
 *
 * @returns {Object} Dashboard data object
 */
export function getSampleDashboardData() {
  const headers = _cache.headers;
  const items = _cache.items;

  // Total purchases (Inward entries)
  const purchases = headers.filter(h => h.Entry_Type !== 'Outward');
  const sales = headers.filter(h => h.Entry_Type === 'Outward');

  const totalPurchases = purchases.length;
  const totalSales = sales.length;

  // Total spend (Purchases)
  const totalSpend = purchases.reduce((sum, h) => sum + h.Grand_Total, 0);

  // Total Revenue (Sales)
  const totalRevenue = sales.reduce((sum, h) => sum + h.Grand_Total, 0);

  // Total items received/sold
  const totalItemsIn = items.filter(i => purchases.some(p => p.Purchase_ID === i.Purchase_ID)).reduce((sum, item) => sum + item.Quantity, 0);
  const totalItemsOut = items.filter(i => sales.some(s => s.Purchase_ID === i.Purchase_ID)).reduce((sum, item) => sum + item.Quantity, 0);

  // Unique suppliers
  const uniqueSuppliers = new Set(purchases.filter((h) => h.Supplier).map((h) => h.Supplier)).size;

  // Average order value
  const avgOrderValue = totalSpend / (totalPurchases || 1);

  // Total logistics cost
  const totalLogistics = purchases.reduce((sum, h) => sum + h.Logistics_Cost, 0);

  // Recent purchases (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentPurchases = headers.filter((h) => new Date(h.Date) >= sevenDaysAgo);

  // Spend by supplier
  const spendBySupplier = {};
  headers.forEach((h) => {
    const name = h.Supplier || 'Unknown';
    spendBySupplier[name] = (spendBySupplier[name] || 0) + h.Grand_Total;
  });

  // Spend by commodity
  const spendByCommodity = {};
  const qtyByCommodity = {};
  items.forEach((item) => {
    spendByCommodity[item.Commodity] = (spendByCommodity[item.Commodity] || 0) + item.Line_Total;
    qtyByCommodity[item.Commodity] = (qtyByCommodity[item.Commodity] || 0) + item.Quantity;
  });

  // Daily spend for the last 30 days (for trend chart)
  const dailySpend = [];
  for (let i = 29; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    day.setHours(0, 0, 0, 0);
    const dayStr = day.toISOString().split('T')[0];

    const dayTotal = headers
      .filter((h) => h.Date.split('T')[0] === dayStr)
      .reduce((sum, h) => sum + h.Grand_Total, 0);

    dailySpend.push({
      date: dayStr,
      label: day.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      spend: Math.round(dayTotal * 100) / 100,
    });
  }

  // Status breakdown
  const statusBreakdown = {};
  headers.forEach((h) => {
    statusBreakdown[h.Status] = (statusBreakdown[h.Status] || 0) + 1;
  });

  // Top 5 recent purchases
  const latestPurchases = [...headers]
    .sort((a, b) => new Date(b.Date) - new Date(a.Date))
    .slice(0, 5);

  return {
    totalPurchases,
    totalSales,
    totalSpend: Math.round(totalSpend * 100) / 100,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalItemsIn,
    totalItemsOut,
    uniqueSuppliers,
    avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    totalLogistics: Math.round(totalLogistics * 100) / 100,
    recentPurchasesCount: recentPurchases.length,
    spendBySupplier,
    spendByCommodity,
    qtyByCommodity,
    dailySpend,
    statusBreakdown,
    latestPurchases,
  };
}

/**
 * Get analytics data for charts and deep-dive views.
 *
 * @returns {Object} Analytics data object
 */
export function getSampleAnalyticsData() {
  const headers = _cache.headers;
  const items = _cache.items;

  // Weekly spend aggregation
  const weeklySpend = [];
  for (let w = 3; w >= 0; w--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (w + 1) * 7);
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() - w * 7);

    const weekTotal = headers
      .filter((h) => {
        const d = new Date(h.Date);
        return d >= weekStart && d < weekEnd;
      })
      .reduce((sum, h) => sum + h.Grand_Total, 0);

    weeklySpend.push({
      week: `Week ${4 - w}`,
      spend: Math.round(weekTotal * 100) / 100,
      orders: headers.filter((h) => {
        const d = new Date(h.Date);
        return d >= weekStart && d < weekEnd;
      }).length,
    });
  }

  // Supplier performance (spend + order count)
  const supplierPerformance = {};
  headers.forEach((h) => {
    const name = h.Supplier || 'Unknown';
    if (!supplierPerformance[name]) {
      supplierPerformance[name] = { spend: 0, orders: 0, avgDelivery: 0 };
    }
    supplierPerformance[name].spend += h.Grand_Total;
    supplierPerformance[name].orders += 1;
  });

  // Convert to array and sort by spend
  const supplierRanking = Object.entries(supplierPerformance)
    .map(([name, data]) => ({
      name,
      spend: Math.round(data.spend * 100) / 100,
      orders: data.orders,
      avgOrderValue: Math.round((data.spend / data.orders) * 100) / 100,
    }))
    .sort((a, b) => b.spend - a.spend);

  // Commodity breakdown (for pie / bar charts)
  const commodityBreakdown = {};
  items.forEach((item) => {
    if (!commodityBreakdown[item.Commodity]) {
      commodityBreakdown[item.Commodity] = { quantity: 0, spend: 0, orders: 0 };
    }
    commodityBreakdown[item.Commodity].quantity += item.Quantity;
    commodityBreakdown[item.Commodity].spend += item.Line_Total;
    commodityBreakdown[item.Commodity].orders += 1;
  });

  const commodityData = Object.entries(commodityBreakdown)
    .map(([name, data]) => ({
      name,
      quantity: data.quantity,
      spend: Math.round(data.spend * 100) / 100,
      orders: data.orders,
    }))
    .sort((a, b) => b.spend - a.spend);

  const priceTrends = {};
  // Group items by date and commodity
  items.forEach((item) => {
    const header = headers.find((h) => h.Purchase_ID === item.Purchase_ID);
    if (!header) return;
    const dateStr = header.Date.split('T')[0];
    if (!priceTrends[item.Commodity]) priceTrends[item.Commodity] = [];
    priceTrends[item.Commodity].push({
      date: dateStr,
      price: item.Unit_Price,
    });
  });

  // Logistics cost ratio
  const logisticsRatio = headers.map((h) => ({
    purchaseId: h.Purchase_ID,
    date: h.Date.split('T')[0],
    logistics: h.Logistics_Cost,
    subtotal: h.Subtotal,
    ratio: h.Subtotal > 0
      ? Math.round((h.Logistics_Cost / h.Subtotal) * 10000) / 100
      : 0,
  }));

  // Monthly comparison (current vs previous)
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const thisMonthSpend = headers
    .filter((h) => new Date(h.Date) >= thisMonthStart)
    .reduce((sum, h) => sum + h.Grand_Total, 0);

  const lastMonthSpend = headers
    .filter((h) => {
      const d = new Date(h.Date);
      return d >= lastMonthStart && d < thisMonthStart;
    })
    .reduce((sum, h) => sum + h.Grand_Total, 0);

  const monthOverMonthChange = lastMonthSpend > 0
    ? Math.round(((thisMonthSpend - lastMonthSpend) / lastMonthSpend) * 10000) / 100
    : 0;

  return {
    weeklySpend,
    supplierRanking,
    commodityData,
    priceTrends,
    logisticsRatio,
    monthComparison: {
      current: Math.round(thisMonthSpend * 100) / 100,
      previous: Math.round(lastMonthSpend * 100) / 100,
      changePercent: monthOverMonthChange,
    },
  };
}

/* ============================================================
   Ledger / Transactions Data
   ============================================================ */

/**
 * Generate sample ledger transactions (credit/debit).
 * Represents daily sales, expenses, and capital.
 */
function buildSampleLedger() {
  const txns = [];
  let balance = 150000; // Starting balance: 1.5 Lakhs

  // Generate for last 30 days
  const now = new Date();
  for (let i = 30; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    day.setHours(9, 0, 0, 0);

    // Skip Sundays
    if (day.getDay() === 0) continue;

    const dateStr = day.toISOString();

    // 1. Daily Sales (Credit)
    const salesAmount = randInt(5000, 25000);
    balance += salesAmount;
    txns.push({
      id: `TXN-S-${i}`,
      date: dateStr,
      description: 'Daily Sales (Counter)',
      type: 'credit',
      amount: salesAmount,
      balance: balance,
    });

    // 2. Random Expenses (Debit)
    if (Math.random() > 0.6) {
      const expenseAmount = randInt(1000, 5000);
      balance -= expenseAmount;
      const desc = pick(['Electricity Bill', 'Office Supplies', 'Maintenance', 'Fuel Charges']);
      txns.push({
        id: `TXN-E-${i}`,
        date: new Date(day.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
        description: desc,
        type: 'debit',
        amount: expenseAmount,
        balance: balance,
      });
    }

    // 3. Purchase Payments (Debit) - connect vaguely to our stock inwards
    if (Math.random() > 0.8) {
      const paymentAmount = randInt(10000, 40000);
      balance -= paymentAmount;
      txns.push({
        id: `TXN-P-${i}`,
        date: new Date(day.getTime() + 4 * 60 * 60 * 1000).toISOString(),
        description: `Payment to ${pick(SUPPLIERS)}`,
        type: 'debit',
        amount: paymentAmount,
        balance: balance,
      });
    }
  }

  // Sort descending (newest first) for UI
  txns.sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    transactions: txns,
    currentBalance: balance,
    openingBalance: 150000,
  };
}

const _ledgerCache = buildSampleLedger();

export function getSampleLedgerData() {
  return _ledgerCache;
}
