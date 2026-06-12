const express = require('express');
const db = require('../db/excelDb');
const { verifyToken, requireRole } = require('../middleware/auth');
const router = express.Router();

router.use(verifyToken);

// Get all products
router.get('/', (req, res) => {
  const products = db.readTable('Products');
  res.json(products);
});

// Add a product (Manager or Owner)
router.post('/', requireRole(['Owner', 'Manager']), (req, res) => {
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

  db.insertRow('Products', newProduct);
  res.status(201).json(newProduct);
});

// Update a product
router.put('/:id', requireRole(['Owner', 'Manager']), (req, res) => {
  const productId = req.params.id;
  const updates = req.body;

  // Remap keys to match Excel columns if necessary, or assume body matches Excel headers
  const updatedCount = db.updateRow('Products', p => p['Product ID'] === productId, updates);
  
  if (updatedCount === 0) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.json({ message: 'Product updated successfully' });
});

// Delete a product
router.delete('/:id', requireRole(['Owner']), (req, res) => {
  const productId = req.params.id;
  const deletedCount = db.deleteRow('Products', p => p['Product ID'] === productId);
  
  if (deletedCount === 0) {
    return res.status(404).json({ error: 'Product not found' });
  }

  res.json({ message: 'Product deleted successfully' });
});

module.exports = router;
