const express = require('express');
const multer = require('multer');
const db = require('../db/googleSheetsDb');
const { verifyToken, requireRole } = require('../middleware/auth');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.use(verifyToken);

// Get all sales
router.get('/', async (req, res) => {
  try {
    const sales = await db.readTable(req.auth.userId, 'Sales');
    res.json(sales);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Create a sale entry
router.post('/', requireRole(['Owner', 'Manager', 'Employee']), upload.single('billFile'), async (req, res) => {
  try {
    const { customerName, product, quantity, sellingPrice, amountPaid } = req.body;
    const userId = req.auth.userId;
    
    if (!product || !quantity || !sellingPrice) {
      return res.status(400).json({ error: 'Missing required sale details' });
    }

    const invoiceId = `INV-${Date.now()}`;
    const totalAmount = quantity * sellingPrice;
    const dateStr = new Date().toISOString();

    let billUrl = '';
    if (req.file) {
      try {
        const fileName = `${invoiceId}-${req.file.originalname}`;
        billUrl = await db.uploadReceiptToDrive(userId, req.file.buffer, fileName, req.file.mimetype);
      } catch (uploadErr) {
        console.error("Failed to upload bill to Drive:", uploadErr);
      }
    }

    // 1. Insert Sale Record
    const newSale = {
      'Invoice ID': invoiceId,
      'Customer': customerName || 'Walk-in Customer',
      'Product': product,
      'Quantity': quantity,
      'Amount': totalAmount,
      'Date': dateStr,
      'Bill URL': billUrl
    };
    await db.insertRow(userId, 'Sales', newSale);

    // 2. Decrement Product Stock
    const products = await db.readTable(userId, 'Products');
    const targetProduct = products.find(p => p['Product Name'] === product);
    if (targetProduct) {
      const newQty = Math.max(0, (targetProduct.Quantity || 0) - quantity);
      await db.updateRow(userId, 'Products', p => p['Product Name'] === product, { 'Quantity': newQty });
    }

    // 3. Handle Customer Ledger (if credit)
    const balanceDue = totalAmount - (amountPaid || 0);
    if (customerName && customerName !== 'Walk-in Customer') {
      const customers = await db.readTable(userId, 'Customers');
      let cust = customers.find(c => c.Name === customerName);
      
      if (!cust) {
        // Create new customer
        await db.insertRow(userId, 'Customers', {
          'Customer ID': `CUS-${Date.now()}`,
          'Name': customerName,
          'Contact': '',
          'Balance': balanceDue
        });
      } else {
        // Update balance
        await db.updateRow(userId, 'Customers', c => c.Name === customerName, { 'Balance': Number(cust.Balance || 0) + balanceDue });
      }
    }

    // 4. Log Payment Transaction
    if (amountPaid > 0) {
      await db.insertRow(userId, 'Transactions', {
        'Transaction ID': `TXN-${Date.now()}`,
        'Type': 'Credit (Sale)',
        'Amount': amountPaid,
        'Date': dateStr
      });
    }

    res.status(201).json(newSale);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
