// routes/feedback.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Endpoint to add feedback
router.post('/add', async (req, res) => {
  const { user_id, feedback_text } = req.body;
  console.log('Received feedback add request:', req.body);
  if (!user_id || !feedback_text) {
    console.log('Missing fields in feedback request');
    return res.status(400).json({ message: 'Missing fields' });
  }
  try {
    const [result] = await db.promise().query(
      'INSERT INTO feedback (user_id, feedback_text) VALUES (?, ?)',
      [user_id, feedback_text]
    );
    console.log('Feedback record created with ID:', result.insertId);
    res.status(201).json({ message: 'Feedback added successfully', feedbackId: result.insertId });
  } catch (error) {
    console.error('Error adding feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Endpoint to fetch feedback records (optionally filter by user_id)
router.get('/', async (req, res) => {
  console.log('Fetching feedback records');
  try {
    const { user_id } = req.query;
    let query = 'SELECT * FROM feedback';
    let params = [];
    if (user_id) {
      query += ' WHERE user_id = ?';
      params.push(user_id);
    }
    const [rows] = await db.promise().query(query, params);
    console.log('Feedback records fetched:', rows.length);
    res.json({ feedback: rows });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
