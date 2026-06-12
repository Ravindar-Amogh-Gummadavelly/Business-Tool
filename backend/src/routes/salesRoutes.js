const express = require('express');
const db = require('../db/excelDb');
const { verifyToken, requireRole } = require('../middleware/auth');
const router = express.Router();

router.use(verifyToken);

// Get all sales
router.get('/', (req, res) => {
  const sales = db.readTable('Sales');
  res.json(sales);
});

// Create a sale entry
router.post('/', requireRole(['Owner', 'Manager', 'Employee']), (req, res) => {
  const { customerName, product, quantity, sellingPrice, amountPaid } = req.body;
  
  if (!product || !quantity || !sellingPrice) {
    return res.status(400).json({ error: 'Missing required sale details' });
  }

  const invoiceId = `INV-${Date.now()}`;
  const totalAmount = quantity * sellingPrice;
  const dateStr = new Date().toISOString();

  // 1. Insert Sale Record
  const newSale = {
    'Invoice ID': invoiceId,
    'Customer': customerName || 'Walk-in Customer',
    'Product': product,
    'Quantity': quantity,
    'Amount': totalAmount,
    'Date': dateStr
  };
  db.insertRow('Sales', newSale);

  // 2. Decrement Product Stock
  const products = db.readTable('Products');
  const targetProduct = products.find(p => p['Product Name'] === product);
  if (targetProduct) {
    const newQty = Math.max(0, (targetProduct.Quantity || 0) - quantity);
    db.updateRow('Products', p => p['Product Name'] === product, { 'Quantity': newQty });
  }

  // 3. Handle Customer Ledger (if credit)
  const balanceDue = totalAmount - (amountPaid || 0);
  if (customerName && customerName !== 'Walk-in Customer') {
    const customers = db.readTable('Customers');
    let cust = customers.find(c => c.Name === customerName);
    
    if (!cust) {
      // Create new customer
      db.insertRow('Customers', {
        'Customer ID': `CUS-${Date.now()}`,
        'Name': customerName,
        'Contact': '',
        'Balance': balanceDue
      });
    } else {
      // Update balance
      db.updateRow('Customers', c => c.Name === customerName, { 'Balance': (cust.Balance || 0) + balanceDue });
    }
  }

  // 4. Log Payment Transaction
  if (amountPaid > 0) {
    db.insertRow('Transactions', {
      'Transaction ID': `TXN-${Date.now()}`,
      'Type': 'Credit (Sale)',
      'Amount': amountPaid,
      'Date': dateStr
    });
  }

  res.status(201).json(newSale);
});

module.exports = router;
