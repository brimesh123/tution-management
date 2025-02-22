// routes/fees.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Endpoint to add a fee record
router.post('/add', async (req, res) => {
  const { student_id, fee_amount, status, due_date } = req.body;
  console.log('Received fee add request:', req.body);
  if (!student_id || fee_amount === undefined || !status) {
    console.log('Missing fields in fee add request');
    return res.status(400).json({ message: 'Missing fields' });
  }
  try {
    const [result] = await db.promise().query(
      'INSERT INTO fees (student_id, fee_amount, status, due_date) VALUES (?, ?, ?, ?)',
      [student_id, fee_amount, status, due_date]
    );
    console.log('Fee record created with ID:', result.insertId);
    res.status(201).json({ message: 'Fee record added successfully', feeId: result.insertId });
  } catch (error) {
    console.error('Error adding fee record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Endpoint to fetch fee records for a student
router.get('/student/:studentId', async (req, res) => {
  const { studentId } = req.params;
  console.log('Fetching fee status for student:', studentId);
  try {
    const [rows] = await db.promise().query('SELECT * FROM fees WHERE student_id = ?', [studentId]);
    console.log('Fee records fetched:', rows.length);
    res.json({ fees: rows });
  } catch (error) {
    console.error('Error fetching fee records:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
