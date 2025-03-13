const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Endpoint to add a test result for a student (with role check)
router.post('/add', authMiddleware, async (req, res) => {
  const { student_id, test_id, marks, performance } = req.body;
  console.log('Received add result request:', req.body);
  
  if (!student_id || !test_id || marks === undefined || !performance) {
    console.log('Missing fields in add result request');
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  // Allow only teachers and admins to add results
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized: Only teachers and admins can add results' });
  }
  
  try {
    // Verify the test exists
    const [testCheck] = await db.promise().query('SELECT * FROM tests WHERE id = ?', [test_id]);
    if (testCheck.length === 0) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
    // Verify the student exists
    const [studentCheck] = await db.promise().query('SELECT * FROM users WHERE id = ? AND role = "student"', [student_id]);
    if (studentCheck.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Check if result already exists for this student and test
    const [existingCheck] = await db.promise().query(
      'SELECT * FROM results WHERE student_id = ? AND test_id = ?',
      [student_id, test_id]
    );
    
    if (existingCheck.length > 0) {
      // Update existing result
      await db.promise().query(
        'UPDATE results SET marks = ?, performance = ? WHERE student_id = ? AND test_id = ?',
        [marks, performance, student_id, test_id]
      );
      console.log('Result updated for student:', student_id, 'test:', test_id);
      return res.json({ message: 'Result updated successfully', resultId: existingCheck[0].id });
    }
    
    // Insert new result (without remarks)
    const [result] = await db.promise().query(
      'INSERT INTO results (student_id, test_id, marks, performance) VALUES (?, ?, ?, ?)',
      [student_id, test_id, marks, performance]
    );
    
    console.log('Result record created with ID:', result.insertId);
    res.status(201).json({ 
      message: 'Result added successfully', 
      resultId: result.insertId 
    });
  } catch (error) {
    console.error('Error adding result:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Endpoint to bulk add results for multiple students
router.post('/bulk-add', authMiddleware, async (req, res) => {
  const { test_id, results } = req.body;
  
  if (!test_id || !results || !Array.isArray(results) || results.length === 0) {
    return res.status(400).json({ message: 'Invalid request data' });
  }
  
  // Allow only teachers and admins to add results
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized: Only teachers and admins can add results' });
  }
  
  try {
    // Verify the test exists
    const [testCheck] = await db.promise().query('SELECT * FROM tests WHERE id = ?', [test_id]);
    if (testCheck.length === 0) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
    // Process each result (without remarks)
    const queries = results.map(result => {
      const { student_id, marks, performance } = result;
      
      if (!student_id || marks === undefined || !performance) {
        throw new Error('Missing required fields for a student result');
      }
      
      return db.promise().query(
        `INSERT INTO results (student_id, test_id, marks, performance)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE marks = VALUES(marks), performance = VALUES(performance)`,
        [student_id, test_id, marks, performance]
      );
    });
    
    await Promise.all(queries);
    res.status(201).json({ message: 'Results added successfully' });
  } catch (error) {
    console.error('Error adding bulk results:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Endpoint to fetch results for a specific student (with role check)
router.get('/student/:studentId', authMiddleware, async (req, res) => {
  const { studentId } = req.params;
  console.log('Fetching results for student:', studentId);
  
  // Students can only view their own results, teachers and admins can view any
  if (req.user.role === 'student' && req.user.id !== parseInt(studentId)) {
    return res.status(403).json({ message: 'Unauthorized: You can only view your own results' });
  }
  
  try {
    const [results] = await db.promise().query(
      `SELECT r.*, t.exam, t.subject, t.type, t.test_date, t.max_marks, t.total_marks
       FROM results r
       JOIN tests t ON r.test_id = t.id
       WHERE r.student_id = ?
       ORDER BY t.test_date DESC, r.created_at DESC`,
      [studentId]
    );
    
    // Get student details
    const [student] = await db.promise().query(
      'SELECT id, name, standard, division FROM users WHERE id = ? AND role = "student"',
      [studentId]
    );
    
    if (student.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    console.log('Results fetched:', results.length);
    res.json({ 
      student: student[0],
      results: results 
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Endpoint to fetch results for a specific test
router.get('/test/:testId', authMiddleware, async (req, res) => {
  const { testId } = req.params;
  
  try {
    // Only teachers and admins can view all test results
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      // For students, only return their own result for this test
      const [results] = await db.promise().query(
        `SELECT r.*, u.name as student_name
         FROM results r
         JOIN users u ON r.student_id = u.id
         WHERE r.test_id = ? AND r.student_id = ?`,
        [testId, req.user.id]
      );
      return res.json({ results });
    }
    
    // For teachers and admins, return all results
    const [results] = await db.promise().query(
      `SELECT r.*, u.name as student_name, u.standard, u.division
       FROM results r
       JOIN users u ON r.student_id = u.id
       WHERE r.test_id = ?
       ORDER BY u.standard, u.division, u.name`,
      [testId]
    );
    
    // Get test details
    const [test] = await db.promise().query(
      `SELECT t.*, u.name as teacher_name
       FROM tests t
       LEFT JOIN users u ON t.teacher_id = u.id
       WHERE t.id = ?`,
      [testId]
    );
    
    if (test.length === 0) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
    // Calculate stats
    const totalStudents = results.length;
    const passedStudents = results.filter(r => r.marks >= (test[0].total_marks * 0.33)).length;
    const highestMarks = results.length > 0 ? Math.max(...results.map(r => r.marks)) : 0;
    const lowestMarks = results.length > 0 ? Math.min(...results.map(r => r.marks)) : 0;
    const averageMarks = results.length > 0 
      ? results.reduce((sum, r) => sum + r.marks, 0) / results.length 
      : 0;
    
    res.json({ 
      test: test[0],
      results,
      stats: {
        totalStudents,
        passedStudents,
        highestMarks,
        lowestMarks,
        averageMarks: parseFloat(averageMarks.toFixed(2)),
        passPercentage: totalStudents > 0 ? parseFloat(((passedStudents / totalStudents) * 100).toFixed(2)) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching test results:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student ranking in a test
router.get('/ranking/:testId', authMiddleware, async (req, res) => {
  const { testId } = req.params;
  const { standard, division } = req.query;
  
  try {
    let query = `
      SELECT r.student_id, r.marks, u.name, u.standard, u.division,
             RANK() OVER (ORDER BY r.marks DESC) as 'rank'
      FROM results r
      JOIN users u ON r.student_id = u.id
      WHERE r.test_id = ?
    `;
    const params = [testId];
    
    if (standard) {
      query += ' AND u.standard = ?';
      params.push(standard);
    }
    
    if (division) {
      query += ' AND u.division = ?';
      params.push(division);
    }
    
    const [rankings] = await db.promise().query(query, params);
    res.json({ rankings });
  } catch (error) {
    console.error('Error fetching rankings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a result
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { marks, performance } = req.body;
  
  // Only teachers and admins can update results
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized: Only teachers and admins can update results' });
  }
  
  try {
    // Check if result exists
    const [resultCheck] = await db.promise().query('SELECT * FROM results WHERE id = ?', [id]);
    if (resultCheck.length === 0) {
      return res.status(404).json({ message: 'Result not found' });
    }
    
    // Update result
    await db.promise().query(
      'UPDATE results SET marks = ?, performance = ? WHERE id = ?',
      [marks, performance, id]
    );
    
    res.json({ message: 'Result updated successfully' });
  } catch (error) {
    console.error('Error updating result:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a result
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  
  // Only teachers and admins can delete results
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized: Only teachers and admins can delete results' });
  }
  
  try {
    // Check if result exists
    const [resultCheck] = await db.promise().query('SELECT * FROM results WHERE id = ?', [id]);
    if (resultCheck.length === 0) {
      return res.status(404).json({ message: 'Result not found' });
    }
    
    // Delete result
    await db.promise().query('DELETE FROM results WHERE id = ?', [id]);
    res.json({ message: 'Result deleted successfully' });
  } catch (error) {
    console.error('Error deleting result:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
