// routes/results.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Endpoint to add a test result for a student
router.post('/add', async (req, res) => {
  const { student_id, test_id, marks, performance } = req.body;
  console.log('Received add result request:', req.body);
  if (!student_id || !test_id || marks === undefined || !performance) {
    console.log('Missing fields in add result request');
    return res.status(400).json({ message: 'Missing fields' });
  }
  try {
    const [result] = await db.promise().query(
      'INSERT INTO results (student_id, test_id, marks, performance) VALUES (?, ?, ?, ?)',
      [student_id, test_id, marks, performance]
    );
    console.log('Result record created with ID:', result.insertId);
    res.status(201).json({ message: 'Result added successfully', resultId: result.insertId });
  } catch (error) {
    console.error('Error adding result:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Endpoint to fetch results for a specific student
router.get('/student/:studentId', async (req, res) => {
  const { studentId } = req.params;
  console.log('Fetching results for student:', studentId);
  try {
    const [rows] = await db.promise().query('SELECT * FROM results WHERE student_id = ?', [studentId]);
    console.log('Results fetched:', rows.length);
    res.json({ results: rows });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
