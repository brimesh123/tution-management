// routes/auth.js
const express = require('express');
const router = express.Router(); // Initialize router
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

// Login endpoint
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;
  console.log('Login request received:', { email, role });
  
  if (!email || !password || !role) {
    console.log('Missing fields for login');
    return res.status(400).json({ message: 'Email, password, and role are required' });
  }

  try {
    // Find user by email
    const [rows] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      console.log('User not found for email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const user = rows[0];
    
    // Verify role match
    if (user.role !== role) {
      console.log('Role mismatch for email:', email);
      return res.status(400).json({ message: 'Invalid credentials: role mismatch' });
    }

    // Compare password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log('Invalid password for email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT payload
    const payload = { id: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('User logged in successfully:', email);
    res.json({ message: 'Logged in successfully', token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Registration endpoint
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    console.log('Register request received:', { name, email, role });
  
    if (!name || !email || !password || !role) {
      console.log('Missing fields for registration');
      return res.status(400).json({ message: 'All fields are required' });
    }
  
    try {
      // Check if user already exists
      const [rows] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
      if (rows.length > 0) {
        console.log('User already exists:', email);
        return res.status(400).json({ message: 'User already exists' });
      }
  
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      console.log('Password hashed successfully');
  
      // Insert new user into DB
      const [result] = await db.promise().query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, role]
      );
      console.log('User registered with ID:', result.insertId);
  
      res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    } catch (error) {
      console.error('Error during registration:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  

module.exports = router;
