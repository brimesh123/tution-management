// routes/tests.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Enhanced Test Creation Endpoint
// In your routes/tests.js, update the endpoint:
router.post('/create', async (req, res) => {
    const { exam, standards, divisions, total_marks, subject, teacher_id } = req.body;
    console.log("Received test creation request:", req.body);
    if (!exam || !standards || !divisions || !total_marks || !subject) {
      console.log("Missing fields in test creation");
      return res.status(400).json({ message: "All fields are required" });
    }
    // Optionally, require teacher_id if needed; otherwise, set to null.
    const tId = teacher_id || null;
    try {
      const [result] = await db.promise().query(
        'INSERT INTO tests (exam, standards, divisions, total_marks, subject, teacher_id) VALUES (?, ?, ?, ?, ?, ?)',
        [exam, standards, divisions, total_marks, subject, tId]
      );
      console.log("Test created with ID:", result.insertId);
      res.status(201).json({ message: "Test created successfully", testId: result.insertId });
    } catch (error) {
      console.error("Error creating test:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  

// Endpoint to fetch all tests
router.get('/', async (req, res) => {
  console.log('Fetching all tests');
  try {
    const [rows] = await db.promise().query('SELECT * FROM tests');
    console.log('Tests fetched:', rows.length);
    res.json({ tests: rows });
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Endpoint to fetch a specific test by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  console.log('Fetching test with ID:', id);
  try {
    const [rows] = await db.promise().query('SELECT * FROM tests WHERE id = ?', [id]);
    if (rows.length === 0) {
      console.log('Test not found with ID:', id);
      return res.status(404).json({ message: 'Test not found' });
    }
    console.log('Test fetched:', rows[0]);
    res.json({ test: rows[0] });
  } catch (error) {
    console.error('Error fetching test:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
