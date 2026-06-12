require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const salesRoutes = require('./src/routes/salesRoutes');
const purchaseRoutes = require('./src/routes/purchaseRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const ledgerRoutes = require('./src/routes/ledgerRoutes');

const app = express();
const PORT = process.env.PORT || 5005;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ledger', ledgerRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'StockFlow AI Backend Running' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`StockFlow AI Backend running on port ${PORT}`);
});
