const express = require('express');
const multer = require('multer');
const db = require('../db/googleSheetsDb');
const { verifyToken, requireRole } = require('../middleware/auth');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.use(verifyToken);

// Get all purchases
router.get('/', async (req, res) => {
  try {
    const purchases = await db.readTable(req.auth.userId, 'Purchases');
    res.json(purchases);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Create a purchase entry
router.post('/', requireRole(['Owner', 'Manager', 'Employee']), upload.single('billFile'), async (req, res) => {
  try {
    const { supplierName, product, quantity, purchasePrice, amountPaid } = req.body;
    const userId = req.auth.userId;
    
    if (!product || !quantity || !purchasePrice) {
      return res.status(400).json({ error: 'Missing required purchase details' });
    }

    const purchaseId = `PUR-${Date.now()}`;
    const totalAmount = quantity * purchasePrice;
    const dateStr = new Date().toISOString();

    let billUrl = '';
    if (req.file) {
      try {
        const fileName = `${purchaseId}-${req.file.originalname}`;
        billUrl = await db.uploadReceiptToDrive(userId, req.file.buffer, fileName, req.file.mimetype);
      } catch (uploadErr) {
        console.error("Failed to upload bill to Drive:", uploadErr);
      }
    }

    // 1. Insert Purchase Record
    const newPurchase = {
      'Purchase ID': purchaseId,
      'Supplier': supplierName || 'Cash Supplier',
      'Product': product,
      'Quantity': quantity,
      'Amount': totalAmount,
      'Date': dateStr,
      'Bill URL': billUrl
    };
    await db.insertRow(userId, 'Purchases', newPurchase);

    // 2. Increment Product Stock
    const products = await db.readTable(userId, 'Products');
    const targetProduct = products.find(p => p['Product Name'] === product);
    if (targetProduct) {
      const newQty = (targetProduct.Quantity || 0) + quantity;
      // Also optionally update purchase price to the latest one
      await db.updateRow(userId, 'Products', p => p['Product Name'] === product, { 'Quantity': newQty, 'Purchase Price': purchasePrice });
    } else {
      // Optionally auto-create product if it doesn't exist
      await db.insertRow(userId, 'Products', {
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
      const suppliers = await db.readTable(userId, 'Suppliers');
      let sup = suppliers.find(s => s.Name === supplierName);
      
      if (!sup) {
        // Create new supplier
        await db.insertRow(userId, 'Suppliers', {
          'Supplier ID': `SUP-${Date.now()}`,
          'Name': supplierName,
          'Contact': '',
          'Balance': balanceDue
        });
      } else {
        // Update balance
        await db.updateRow(userId, 'Suppliers', s => s.Name === supplierName, { 'Balance': Number(sup.Balance || 0) + balanceDue });
      }
    }

    // 4. Log Payment Transaction
    if (amountPaid > 0) {
      await db.insertRow(userId, 'Transactions', {
        'Transaction ID': `TXN-${Date.now()}`,
        'Type': 'Debit (Purchase)',
        'Amount': amountPaid,
        'Date': dateStr
      });
    }

    res.status(201).json(newPurchase);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
