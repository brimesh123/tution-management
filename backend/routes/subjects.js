const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/subjects/add - Add a subject for a given standard
router.post('/add', async (req, res) => {
  const { standard, subject_name } = req.body;
  if (!standard || !subject_name) {
    return res.status(400).json({ message: "Standard and subject name are required" });
  }
  try {
    const [result] = await db.promise().query(
      'INSERT INTO subjects (standard, subject_name) VALUES (?, ?)',
      [standard, subject_name]
    );
    res.status(201).json({ message: "Subject added successfully", subjectId: result.insertId });
  } catch (error) {
    console.error("Error adding subject:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/subjects/all - Get all subjects (across all standards)
router.get('/all', async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT * FROM subjects');
    res.json({ subjects: rows });
  } catch (error) {
    console.error("Error fetching all subjects:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/subjects?standard=XX - Get subjects for a given standard
router.get('/', async (req, res) => {
  const { standard } = req.query;
  if (!standard) {
    return res.status(400).json({ message: "Standard is required" });
  }
  try {
    const [rows] = await db.promise().query(
      'SELECT * FROM subjects WHERE standard = ?',
      [standard]
    );
    res.json({ subjects: rows });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/subjects/:id - Delete a subject by its ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.promise().query(
      'DELETE FROM subjects WHERE id = ?',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Subject not found" });
    }
    res.json({ message: "Subject deleted successfully" });
  } catch (error) {
    console.error("Error deleting subject:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
