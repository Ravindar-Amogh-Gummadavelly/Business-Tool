const express = require('express');
const db = require('../db/googleSheetsDb');
const { verifyToken, requireRole } = require('../middleware/auth');
const router = express.Router();

router.use(verifyToken);

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await db.readTable(req.auth.userId, 'Products');
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Add a product (Manager or Owner)
router.post('/', requireRole(['Owner', 'Manager']), async (req, res) => {
  try {
    const { name, category, purchasePrice, sellingPrice, quantity, supplier } = req.body;
    
    if (!name) return res.status(400).json({ error: 'Product name is required' });

    const newProduct = {
      'Product ID': `PRD-${Date.now()}`,
      'Product Name': name,
      'Category': category || 'General',
      'Purchase Price': purchasePrice || 0,
      'Selling Price': sellingPrice || 0,
      'Quantity': quantity || 0,
      'Supplier': supplier || ''
    };

    await db.insertRow(req.auth.userId, 'Products', newProduct);
    res.status(201).json(newProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Update a product
router.put('/:id', requireRole(['Owner', 'Manager']), async (req, res) => {
  try {
    const productId = req.params.id;
    const updates = req.body;

    const updatedCount = await db.updateRow(req.auth.userId, 'Products', p => p['Product ID'] === productId, updates);
    
    if (updatedCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a product
router.delete('/:id', requireRole(['Owner']), async (req, res) => {
  try {
    const productId = req.params.id;
    const deletedCount = await db.deleteRow(req.auth.userId, 'Products', p => p['Product ID'] === productId);
    
    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
