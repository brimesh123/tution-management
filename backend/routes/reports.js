// routes/reports.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Endpoint to generate a monthly average report for a student
router.get('/monthly-average/:studentId', async (req, res) => {
  const { studentId } = req.params;
  console.log('Generating monthly average report for student:', studentId);
  
  try {
    // Check if student exists
    const [studentCheck] = await db.promise().query(
      'SELECT * FROM users WHERE id = ? AND role = "student"',
      [studentId]
    );
    
    if (studentCheck.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Get the results grouped by month
    const [rows] = await db.promise().query(
      `SELECT 
         DATE_FORMAT(t.test_date, '%Y-%m') AS month, 
         AVG(r.marks) AS average_marks,
         COUNT(*) AS test_count,
         MAX(r.marks) AS highest_marks,
         MIN(r.marks) AS lowest_marks,
         GROUP_CONCAT(DISTINCT t.subject) AS subjects
       FROM results r
       JOIN tests t ON r.test_id = t.id
       WHERE r.student_id = ? 
       GROUP BY month
       ORDER BY month DESC`,
      [studentId]
    );
    
    // Get the saved monthly reports
    const [savedReports] = await db.promise().query(
      `SELECT mr.*, u.name as created_by_name
       FROM monthly_reports mr
       JOIN users u ON mr.created_by = u.id
       WHERE mr.student_id = ?
       ORDER BY mr.month DESC`,
      [studentId]
    );
    
    // Get the student details
    const [student] = await db.promise().query(
      'SELECT id, name, standard, division FROM users WHERE id = ?',
      [studentId]
    );
    
    console.log('Monthly average report generated:', rows);
    res.json({ 
      student: student[0],
      calculatedReports: rows,
      savedReports: savedReports
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save monthly report with teacher notes
router.post('/monthly-average', authMiddleware, async (req, res) => {
  const { student_id, month, average_marks, tests_taken, teacher_notes } = req.body;
  
  // Only teachers and admins can save reports
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized: Only teachers and admins can save reports' });
  }
  
  if (!student_id || !month || !average_marks || !tests_taken) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  try {
    // Check if student exists
    const [studentCheck] = await db.promise().query(
      'SELECT * FROM users WHERE id = ? AND role = "student"',
      [student_id]
    );
    
    if (studentCheck.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Check if report for this month already exists
    const [reportCheck] = await db.promise().query(
      'SELECT * FROM monthly_reports WHERE student_id = ? AND month = ?',
      [student_id, month]
    );
    
    if (reportCheck.length > 0) {
      // Update existing report
      await db.promise().query(
        `UPDATE monthly_reports 
         SET average_marks = ?, tests_taken = ?, teacher_notes = ?, created_by = ?
         WHERE student_id = ? AND month = ?`,
        [average_marks, tests_taken, teacher_notes, req.user.id, student_id, month]
      );
      
      return res.json({ 
        message: 'Monthly report updated successfully',
        reportId: reportCheck[0].id
      });
    }
    
    // Insert new report
    const [result] = await db.promise().query(
      `INSERT INTO monthly_reports 
       (student_id, month, average_marks, tests_taken, teacher_notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [student_id, month, average_marks, tests_taken, teacher_notes, req.user.id]
    );
    
    res.status(201).json({ 
      message: 'Monthly report saved successfully',
      reportId: result.insertId
    });
  } catch (error) {
    console.error('Error saving monthly report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get performance report for a class
router.get('/class-performance', authMiddleware, async (req, res) => {
  const { standard, division, month } = req.query;
  
  // Only teachers and admins can view class reports
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized: Only teachers and admins can view class reports' });
  }
  
  if (!standard || !division) {
    return res.status(400).json({ message: 'Standard and division are required' });
  }
  
  try {
    // Get all students in the class
    const [students] = await db.promise().query(
      'SELECT id, name FROM users WHERE standard = ? AND division = ? AND role = "student"',
      [standard, division]
    );
    
    if (students.length === 0) {
      return res.status(404).json({ message: 'No students found in this class' });
    }
    
    let query = `
      SELECT 
        u.id as student_id,
        u.name as student_name,
        t.subject,
        AVG(r.marks) as average_marks,
        COUNT(r.id) as tests_taken
      FROM users u
      LEFT JOIN results r ON u.id = r.student_id
      LEFT JOIN tests t ON r.test_id = t.id
      WHERE u.standard = ? AND u.division = ? AND u.role = "student"
    `;
    const params = [standard, division];
    
    if (month) {
      query += ' AND DATE_FORMAT(t.test_date, "%Y-%m") = ?';
      params.push(month);
    }
    
    query += ' GROUP BY u.id, t.subject';
    
    const [subjectWisePerformance] = await db.promise().query(query, params);
    
    // Calculate overall class average
    const [overallAvg] = await db.promise().query(
      `SELECT AVG(r.marks) as class_average
       FROM results r
       JOIN tests t ON r.test_id = t.id
       JOIN users u ON r.student_id = u.id
       WHERE u.standard = ? AND u.division = ?`,
      [standard, division]
    );
    
    // Get recent tests for this class
    const [recentTests] = await db.promise().query(
      `SELECT t.*, COUNT(r.id) as submissions
       FROM tests t
       LEFT JOIN results r ON t.id = r.test_id
       WHERE t.standards LIKE ? AND t.divisions LIKE ?
       GROUP BY t.id
       ORDER BY t.test_date DESC
       LIMIT 5`,
      [`%${standard}%`, `%${division}%`]
    );
    
    res.json({
      classInfo: {
        standard,
        division,
        studentCount: students.length,
        overallAverage: overallAvg[0]?.class_average || 0
      },
      studentPerformance: subjectWisePerformance,
      recentTests
    });
  } catch (error) {
    console.error('Error generating class performance report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get yearly performance report for a student
router.get('/yearly/:studentId/:year', async (req, res) => {
  const { studentId, year } = req.params;
  
  try {
    // Check if student exists
    const [studentCheck] = await db.promise().query(
      'SELECT * FROM users WHERE id = ? AND role = "student"',
      [studentId]
    );
    
    if (studentCheck.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Get monthly averages for the specified year
    const [monthlyAverages] = await db.promise().query(
      `SELECT 
         SUBSTRING(month, 6) as month_num,
         CASE SUBSTRING(month, 6)
           WHEN '01' THEN 'January'
           WHEN '02' THEN 'February'
           WHEN '03' THEN 'March'
           WHEN '04' THEN 'April'
           WHEN '05' THEN 'May'
           WHEN '06' THEN 'June'
           WHEN '07' THEN 'July'
           WHEN '08' THEN 'August'
           WHEN '09' THEN 'September'
           WHEN '10' THEN 'October'
           WHEN '11' THEN 'November'
           WHEN '12' THEN 'December'
         END as month_name,
         average_marks,
         tests_taken
       FROM monthly_reports
       WHERE student_id = ? AND month LIKE ?
       ORDER BY month`,
      [studentId, `${year}-%`]
    );
    
    // Get subject-wise performance for the year
    const [subjectPerformance] = await db.promise().query(
      `SELECT 
         t.subject,
         AVG(r.marks) as average_marks,
         COUNT(r.id) as tests_taken,
         MAX(r.marks) as highest_marks
       FROM results r
       JOIN tests t ON r.test_id = t.id
       WHERE r.student_id = ? AND YEAR(t.test_date) = ?
       GROUP BY t.subject`,
      [studentId, year]
    );
    
    // Get overall yearly average
    const [yearlyAverage] = await db.promise().query(
      `SELECT 
         AVG(r.marks) as yearly_average,
         COUNT(r.id) as total_tests
       FROM results r
       JOIN tests t ON r.test_id = t.id
       WHERE r.student_id = ? AND YEAR(t.test_date) = ?`,
      [studentId, year]
    );
    
    res.json({
      student: studentCheck[0],
      year,
      monthlyReports: monthlyAverages,
      subjectPerformance,
      yearlyAverage: yearlyAverage[0]
    });
  } catch (error) {
    console.error('Error generating yearly report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate report card for a student
router.get('/report-card/:studentId', authMiddleware, async (req, res) => {
  const { studentId } = req.params;
  const { term } = req.query; // 'first', 'second', 'final'
  
  try {
    // Check if student exists and get details
    const [student] = await db.promise().query(
      `SELECT id, name, standard, division, custom_id, 
              parents_details, subjects
       FROM users 
       WHERE id = ? AND role = "student"`,
      [studentId]
    );
    
    if (student.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Query to get subject-wise performance
    let query = `
      SELECT 
        t.subject,
        AVG(r.marks) as average_marks,
        MAX(r.marks) as highest_marks,
        COUNT(r.id) as tests_count
      FROM results r
      JOIN tests t ON r.test_id = t.id
      WHERE r.student_id = ?
    `;
    const params = [studentId];
    
    // Apply date filters based on term
    if (term === 'first') {
      // First term: April to September
      query += ' AND (MONTH(t.test_date) BETWEEN 4 AND 9)';
    } else if (term === 'second') {
      // Second term: October to March
      query += ' AND ((MONTH(t.test_date) BETWEEN 10 AND 12) OR (MONTH(t.test_date) BETWEEN 1 AND 3))';
    }
    
    query += ' GROUP BY t.subject';
    
    const [subjectResults] = await db.promise().query(query, params);
    
    // Get attendance percentage
    const [attendance] = await db.promise().query(
      `SELECT 
         COUNT(*) as total_days,
         SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days
       FROM attendance
       WHERE student_id = ?`,
      [studentId]
    );
    
    // Get overall average
    const [overall] = await db.promise().query(
      `SELECT AVG(r.marks) as overall_average
       FROM results r
       JOIN tests t ON r.test_id = t.id
       WHERE r.student_id = ?`,
      [studentId]
    );
    
    // Get rank in class
    const [rankQuery] = await db.promise().query(
      `SELECT student_id, avg_marks, rank
       FROM (
         SELECT 
           r.student_id,
           AVG(r.marks) as avg_marks,
           RANK() OVER (ORDER BY AVG(r.marks) DESC) as rank
         FROM results r
         JOIN tests t ON r.test_id = t.id
         JOIN users u ON r.student_id = u.id
         WHERE u.standard = ? AND u.division = ?
         GROUP BY r.student_id
       ) as ranked
       WHERE student_id = ?`,
      [student[0].standard, student[0].division, studentId]
    );
    
    const rank = rankQuery.length > 0 ? rankQuery[0].rank : 'N/A';
    
    res.json({
      student: student[0],
      term: term || 'full year',
      subjectResults,
      attendance: attendance[0],
      overallAverage: overall[0].overall_average,
      classRank: rank,
      attendancePercentage: attendance[0].total_days > 0 
        ? (attendance[0].present_days / attendance[0].total_days) * 100 
        : 0
    });
  } catch (error) {
    console.error('Error generating report card:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;