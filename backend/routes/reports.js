// routes/reports.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Endpoint to generate a monthly average report for a student
router.get('/monthly-average/:studentId', async (req, res) => {
  const { studentId } = req.params;
  console.log('Generating monthly average report for student:', studentId);
  try {
    const [rows] = await db.promise().query(
      `SELECT 
         DATE_FORMAT(created_at, '%Y-%m') AS month, 
         AVG(marks) AS average_marks,
         COUNT(*) AS test_count
       FROM results 
       WHERE student_id = ? 
       GROUP BY month`,
      [studentId]
    );
    console.log('Monthly average report generated:', rows);
    res.json({ report: rows });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
