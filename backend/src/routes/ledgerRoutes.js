const express = require('express');
const db = require('../db/googleSheetsDb');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const userId = req.auth.userId;
    const transactions = await db.readTable(userId, 'Transactions');
    const customers = await db.readTable(userId, 'Customers');
    const suppliers = await db.readTable(userId, 'Suppliers');

    // We want to return a unified ledger view or just transactions
    // For the sake of the Ledger page which expects Transactions + balances
    const totalCustomerReceivable = customers.reduce((sum, c) => sum + Number(c.Balance || 0), 0);
    const totalSupplierPayable = suppliers.reduce((sum, s) => sum + Number(s.Balance || 0), 0);

    // Map to frontend expectation
    const formattedTransactions = transactions.map(t => ({
      id: t['Transaction ID'],
      date: t['Date'],
      description: t['Type'],
      type: t['Type'] && t['Type'].toLowerCase().includes('credit') ? 'credit' : 'debit',
      amount: Number(t['Amount']),
      balance: 0 // Frontend computes running balance dynamically usually
    }));

    res.json({
      transactions: formattedTransactions.reverse(), // newest first
      currentBalance: totalCustomerReceivable - totalSupplierPayable,
      openingBalance: 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
