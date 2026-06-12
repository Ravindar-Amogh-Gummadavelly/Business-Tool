const express = require('express');
const db = require('../db/excelDb');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

router.use(verifyToken);

router.get('/', (req, res) => {
  const sales = db.readTable('Sales');
  const purchases = db.readTable('Purchases');
  const products = db.readTable('Products');
  const customers = db.readTable('Customers');
  const suppliers = db.readTable('Suppliers');

  // 1. Calculate KPI Totals
  const totalSales = sales.reduce((sum, s) => sum + Number(s.Amount || 0), 0);
  const totalPurchases = purchases.reduce((sum, p) => sum + Number(p.Amount || 0), 0);
  
  const pendingCustomerPayments = customers.reduce((sum, c) => sum + Number(c.Balance || 0), 0);
  const pendingSupplierPayments = suppliers.reduce((sum, s) => sum + Number(s.Balance || 0), 0);

  const availableStockValue = products.reduce((sum, p) => sum + (Number(p.Quantity || 0) * Number(p['Selling Price'] || 0)), 0);

  // 2. Monthly Trends (Last 6 Months)
  // Simple grouping by YYYY-MM
  const salesByMonth = {};
  const purchasesByMonth = {};
  
  sales.forEach(s => {
    if (!s.Date) return;
    const month = s.Date.substring(0, 7); // YYYY-MM
    salesByMonth[month] = (salesByMonth[month] || 0) + Number(s.Amount || 0);
  });
  
  purchases.forEach(p => {
    if (!p.Date) return;
    const month = p.Date.substring(0, 7);
    purchasesByMonth[month] = (purchasesByMonth[month] || 0) + Number(p.Amount || 0);
  });

  const allMonths = [...new Set([...Object.keys(salesByMonth), ...Object.keys(purchasesByMonth)])].sort().slice(-6);
  
  const monthlyTrends = allMonths.map(month => ({
    name: month,
    sales: salesByMonth[month] || 0,
    purchases: purchasesByMonth[month] || 0
  }));

  // 3. Commodity Breakdown
  const commodityMap = {};
  sales.forEach(s => {
    const prod = s.Product || 'Unknown';
    commodityMap[prod] = (commodityMap[prod] || 0) + Number(s.Amount || 0);
  });
  
  const commodityBreakdown = Object.entries(commodityMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5

  res.json({
    totalSales,
    totalPurchases,
    pendingCustomerPayments,
    pendingSupplierPayments,
    availableStockValue,
    monthlyTrends,
    commodityBreakdown,
    totalProducts: products.length,
    totalCustomers: customers.length,
    totalSuppliers: suppliers.length
  });
});

module.exports = router;
