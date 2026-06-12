const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/excelDb');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Register User
router.post('/register', async (req, res) => {
  const { name, email, password, role = 'Employee' } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please provide name, email and password' });
  }

  const users = db.readTable('Users');
  const userExists = users.find(u => u.Email === email);
  if (userExists) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = `U-${Date.now()}`;

  const newUser = {
    'User ID': userId,
    'Name': name,
    'Email': email,
    'Password': hashedPassword,
    'Role': role // Owner, Manager, Employee
  };

  db.insertRow('Users', newUser);

  res.status(201).json({ message: 'User registered successfully', userId });
});

// Login User
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password' });
  }

  const users = db.readTable('Users');
  const user = users.find(u => u.Email === email);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.Password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user['User ID'], email: user.Email, role: user.Role, name: user.Name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: user['User ID'],
      name: user.Name,
      email: user.Email,
      role: user.Role
    }
  });
});

module.exports = router;
