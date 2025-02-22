const express = require('express');
const router = express.Router();
const db = require('../db');

// 1) GET /api/attendance/day?date=YYYY-MM-DD
router.get('/day', async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ message: "Date is required" });
  }
  try {
    const [rows] = await db.promise().query(
      `SELECT DISTINCT a.student_id, u.name, u.standard, u.division, a.attendance_date, a.status 
         FROM attendance a
         JOIN users u ON a.student_id = u.id
        WHERE a.attendance_date = ?`,
      [date]
    );
    res.json({ attendance: rows });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 2) POST /api/attendance/mark
router.post('/mark', async (req, res) => {
  const { student_id, attendance_date, status } = req.body;
  if (!student_id || !attendance_date || !status) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    // Check if attendance already exists for this student on this date
    const [existing] = await db.promise().query(
      'SELECT * FROM attendance WHERE student_id = ? AND attendance_date = ?',
      [student_id, attendance_date]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Attendance already marked for this student on this date' });
    }
    // Insert new attendance record with locked = 0
    const [result] = await db.promise().query(
      'INSERT INTO attendance (student_id, attendance_date, status, locked) VALUES (?, ?, ?, 0)',
      [student_id, attendance_date, status]
    );
    res.status(201).json({ message: 'Attendance marked successfully', recordId: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Attendance already marked for this student on this date' });
    }
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 3) POST /api/attendance/mark-bulk
// Expects { date, attendance: [ { student_id, status } ] }
router.post('/mark-bulk', async (req, res) => {
  const { date, attendance } = req.body;
  if (!date || !attendance || !Array.isArray(attendance)) {
    return res.status(400).json({ message: "Date and an attendance array are required" });
  }
  try {
    const queries = attendance.map(record => {
      return db.promise().query(
        'INSERT INTO attendance (student_id, attendance_date, status, locked) VALUES (?, ?, ?, 0)',
        [record.student_id, date, record.status]
      );
    });
    await Promise.all(queries);
    res.status(201).json({ message: "Attendance marked successfully" });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.log("Duplicate attendance entry for student/date in bulk");
      return res.status(400).json({ message: "Attendance already exists for one of these students on that date" });
    }
    console.error("Error marking bulk attendance:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 4) GET /api/attendance/:studentId
router.get('/:studentId', async (req, res) => {
  const { studentId } = req.params;
  try {
    const [rows] = await db.promise().query(
      'SELECT * FROM attendance WHERE student_id = ?',
      [studentId]
    );
    res.json({ attendance: rows });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// 5) GET /api/attendance/check-lock?standard=XX&division=YY&date=YYYY-MM-DD
router.get('/check-lock', async (req, res) => {
  const { standard, division, date } = req.query;
  if (!standard || !division || !date) {
    return res.status(400).json({ message: "Missing parameters" });
  }
  try {
    const [rows] = await db.promise().query(
      `SELECT COUNT(*) as lockedCount
         FROM attendance a
         JOIN users u ON a.student_id = u.id
        WHERE a.attendance_date = ?
          AND u.standard = ?
          AND u.division = ?
          AND a.locked = 1`,
      [date, standard, division]
    );
    const locked = rows.length > 0 && Number(rows[0].lockedCount) > 0;
    res.json({ locked });
  } catch (error) {
    console.error("Error checking attendance lock:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// 7) PUT /api/attendance/update
// Expects body: { student_id, attendance_date, status }
// Alternative: UPSERT endpoint (optional)
router.put('/update', async (req, res) => {
  const { student_id, attendance_date, status } = req.body;
  if (!student_id || !attendance_date || !status) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    await db.promise().query(
      `INSERT INTO attendance (student_id, attendance_date, status, locked)
       VALUES (?, ?, ?, 0)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [student_id, attendance_date, status]
    );
    res.json({ message: 'Attendance updated successfully' });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// 6) POST /api/attendance/lock
// Expects body: { standard, division, date }
router.post('/lock', async (req, res) => {
  const { standard, division, date } = req.body;
  if (!standard || !division || !date) {
    return res.status(400).json({ message: "Missing standard, division, or date" });
  }
  try {
    await db.promise().query(
      `UPDATE attendance
         SET locked = 1
       WHERE attendance_date = ?
         AND student_id IN (
           SELECT id FROM users WHERE standard = ? AND division = ?
         )`,
      [date, standard, division]
    );
    res.json({ message: "Attendance locked successfully" });
  } catch (error) {
    console.error("Error locking attendance:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
