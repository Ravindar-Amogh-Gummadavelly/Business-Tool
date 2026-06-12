const express = require('express');
const db = require('../db/excelDb');
const { verifyToken, requireRole } = require('../middleware/auth');
const router = express.Router();

router.use(verifyToken);

// Get all purchases
router.get('/', (req, res) => {
  const purchases = db.readTable('Purchases');
  res.json(purchases);
});

// Create a purchase entry
router.post('/', requireRole(['Owner', 'Manager', 'Employee']), (req, res) => {
  const { supplierName, product, quantity, purchasePrice, amountPaid } = req.body;
  
  if (!product || !quantity || !purchasePrice) {
    return res.status(400).json({ error: 'Missing required purchase details' });
  }

  const purchaseId = `PUR-${Date.now()}`;
  const totalAmount = quantity * purchasePrice;
  const dateStr = new Date().toISOString();

  // 1. Insert Purchase Record
  const newPurchase = {
    'Purchase ID': purchaseId,
    'Supplier': supplierName || 'Cash Supplier',
    'Product': product,
    'Quantity': quantity,
    'Amount': totalAmount,
    'Date': dateStr
  };
  db.insertRow('Purchases', newPurchase);

  // 2. Increment Product Stock
  const products = db.readTable('Products');
  const targetProduct = products.find(p => p['Product Name'] === product);
  if (targetProduct) {
    const newQty = (targetProduct.Quantity || 0) + quantity;
    // Also optionally update purchase price to the latest one
    db.updateRow('Products', p => p['Product Name'] === product, { 'Quantity': newQty, 'Purchase Price': purchasePrice });
  } else {
    // Optionally auto-create product if it doesn't exist
    db.insertRow('Products', {
      'Product ID': `PRD-${Date.now()}`,
      'Product Name': product,
      'Category': 'General',
      'Purchase Price': purchasePrice,
      'Selling Price': purchasePrice * 1.2, // Arbitrary 20% markup default
      'Quantity': quantity,
      'Supplier': supplierName || ''
    });
  }

  // 3. Handle Supplier Ledger (if credit)
  const balanceDue = totalAmount - (amountPaid || 0);
  if (supplierName && supplierName !== 'Cash Supplier') {
    const suppliers = db.readTable('Suppliers');
    let sup = suppliers.find(s => s.Name === supplierName);
    
    if (!sup) {
      // Create new supplier
      db.insertRow('Suppliers', {
        'Supplier ID': `SUP-${Date.now()}`,
        'Name': supplierName,
        'Contact': '',
        'Balance': balanceDue
      });
    } else {
      // Update balance
      db.updateRow('Suppliers', s => s.Name === supplierName, { 'Balance': (sup.Balance || 0) + balanceDue });
    }
  }

  // 4. Log Payment Transaction
  if (amountPaid > 0) {
    db.insertRow('Transactions', {
      'Transaction ID': `TXN-${Date.now()}`,
      'Type': 'Debit (Purchase)',
      'Amount': amountPaid,
      'Date': dateStr
    });
  }

  res.status(201).json(newPurchase);
});

module.exports = router;
