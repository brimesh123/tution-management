const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Get all test categories
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT * FROM test_categories');
    res.json({ categories: rows });
  } catch (error) {
    console.error('Error fetching test categories:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new test with enhanced fields
router.post('/create', authMiddleware, async (req, res) => {
  const { 
    exam, 
    standards, 
    divisions, 
    total_marks,
    max_marks = 100, 
    subject, 
    teacher_id,
    type = 'other',
    test_date,
    scheduled_date = new Date(),
    description = ''
  } = req.body;
  
  console.log("Received test creation request:", req.body);
  
  if (!exam || !standards || !divisions || !total_marks || !subject || !test_date) {
    console.log("Missing fields in test creation");
    return res.status(400).json({ message: "All required fields must be provided" });
  }
  
  // Use requesting user's ID if teacher_id not provided
  const tId = teacher_id || req.user.id;
  
  try {
    const [result] = await db.promise().query(
      `INSERT INTO tests (exam, standards, divisions, total_marks, max_marks, subject, teacher_id, type, test_date, scheduled_date, description) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [exam, standards, divisions, total_marks, max_marks, subject, tId, type, test_date, scheduled_date, description]
    );
    
    console.log("Test created with ID:", result.insertId);
    res.status(201).json({ 
      message: "Test created successfully", 
      testId: result.insertId,
      testDetails: {
        id: result.insertId,
        exam,
        standards,
        divisions,
        total_marks,
        max_marks,
        subject,
        teacher_id: tId,
        type,
        test_date,
        scheduled_date
      }
    });
  } catch (error) {
    console.error("Error creating test:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all tests (with filtering options)
router.get('/', async (req, res) => {
  console.log('Fetching tests with query params:', req.query);
  
  const { 
    teacher_id, 
    standard, 
    division, 
    type, 
    subject,
    from_date,
    to_date,
    exam
  } = req.query;
  
  let query = 'SELECT t.*, u.name as teacher_name FROM tests t LEFT JOIN users u ON t.teacher_id = u.id WHERE 1=1';
  const params = [];
  
  // Add filter conditions if provided
  if (teacher_id) {
    query += ' AND t.teacher_id = ?';
    params.push(teacher_id);
  }
  
  if (standard) {
    query += ' AND t.standards LIKE ?';
    params.push(`%${standard}%`);
  }
  
  if (division) {
    query += ' AND t.divisions LIKE ?';
    params.push(`%${division}%`);
  }
  
  if (type) {
    query += ' AND t.type = ?';
    params.push(type);
  }
  
  if (subject) {
    query += ' AND t.subject = ?';
    params.push(subject);
  }
  
  if (exam) {
    query += ' AND t.exam LIKE ?';
    params.push(`%${exam}%`);
  }
  
  if (from_date) {
    query += ' AND t.test_date >= ?';
    params.push(from_date);
  }
  
  if (to_date) {
    query += ' AND t.test_date <= ?';
    params.push(to_date);
  }
  
  // Order by newest test first
  query += ' ORDER BY t.test_date DESC, t.created_at DESC';
  
  try {
    const [rows] = await db.promise().query(query, params);
    console.log('Tests fetched:', rows.length);
    res.json({ tests: rows });
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get upcoming tests (for dashboard)
router.get('/upcoming', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    const [rows] = await db.promise().query(
      `SELECT t.*, u.name as teacher_name 
       FROM tests t 
       LEFT JOIN users u ON t.teacher_id = u.id 
       WHERE t.test_date >= ? 
       ORDER BY t.test_date ASC 
       LIMIT 5`,
      [today]
    );
    res.json({ tests: rows });
  } catch (error) {
    console.error('Error fetching upcoming tests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tests for a specific student (filtered by standard & division)
router.get('/student/:studentId', async (req, res) => {
  const { studentId } = req.params;
  
  try {
    // First get the student's standard and division
    const [student] = await db.promise().query(
      'SELECT standard, division FROM users WHERE id = ? AND role = "student"',
      [studentId]
    );
    
    if (student.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const { standard, division } = student[0];
    
    // Then fetch tests that are applicable to this student
    const [tests] = await db.promise().query(
      `SELECT t.*, u.name as teacher_name
       FROM tests t
       LEFT JOIN users u ON t.teacher_id = u.id
       WHERE (t.standards LIKE ? OR t.standards LIKE ? OR t.standards LIKE ?)
       AND (t.divisions LIKE ? OR t.divisions LIKE ? OR t.divisions LIKE ?)
       ORDER BY t.test_date DESC`,
      [`%${standard}%`, `${standard},%`, `%,${standard}`,
       `%${division}%`, `${division},%`, `%,${division}`]
    );
    
    res.json({ tests });
  } catch (error) {
    console.error('Error fetching tests for student:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific test by ID with detailed info
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  console.log('Fetching test with ID:', id);
  
  try {
    // Fetch test details with teacher name
    const [rows] = await db.promise().query(
      `SELECT t.*, u.name as teacher_name 
       FROM tests t 
       LEFT JOIN users u ON t.teacher_id = u.id 
       WHERE t.id = ?`,
      [id]
    );
    
    if (rows.length === 0) {
      console.log('Test not found with ID:', id);
      return res.status(404).json({ message: 'Test not found' });
    }
    
    const test = rows[0];
    
    // Get students who have taken this test
    const [results] = await db.promise().query(
      `SELECT r.*, u.name as student_name, u.standard, u.division
       FROM results r
       JOIN users u ON r.student_id = u.id
       WHERE r.test_id = ?`,
      [id]
    );
    
    console.log('Test fetched with results:', results.length);
    res.json({ 
      test,
      results
    });
  } catch (error) {
    console.error('Error fetching test:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a test
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { 
    exam, 
    standards, 
    divisions, 
    total_marks,
    max_marks, 
    subject, 
    type,
    test_date,
    scheduled_date,
    description
  } = req.body;
  
  try {
    // Check if test exists and requester is owner or admin
    const [testCheck] = await db.promise().query(
      'SELECT teacher_id FROM tests WHERE id = ?',
      [id]
    );
    
    if (testCheck.length === 0) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
    // Only allow update if user is admin or the teacher who created the test
    if (req.user.role !== 'admin' && testCheck[0].teacher_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this test' });
    }
    
    let query = 'UPDATE tests SET ';
    const updates = [];
    const params = [];
    
    if (exam) {
      updates.push('exam = ?');
      params.push(exam);
    }
    
    if (standards) {
      updates.push('standards = ?');
      params.push(standards);
    }
    
    if (divisions) {
      updates.push('divisions = ?');
      params.push(divisions);
    }
    
    if (total_marks) {
      updates.push('total_marks = ?');
      params.push(total_marks);
    }
    
    if (max_marks) {
      updates.push('max_marks = ?');
      params.push(max_marks);
    }
    
    if (subject) {
      updates.push('subject = ?');
      params.push(subject);
    }
    
    if (type) {
      updates.push('type = ?');
      params.push(type);
    }
    
    if (test_date) {
      updates.push('test_date = ?');
      params.push(test_date);
    }
    
    if (scheduled_date) {
      updates.push('scheduled_date = ?');
      params.push(scheduled_date);
    }
    
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No updates provided' });
    }
    
    query += updates.join(', ') + ' WHERE id = ?';
    params.push(id);
    
    await db.promise().query(query, params);
    res.json({ message: 'Test updated successfully' });
  } catch (error) {
    console.error('Error updating test:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a test
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if test exists and requester is owner or admin
    const [testCheck] = await db.promise().query(
      'SELECT teacher_id FROM tests WHERE id = ?',
      [id]
    );
    
    if (testCheck.length === 0) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
    // Only allow deletion if user is admin or the teacher who created the test
    if (req.user.role !== 'admin' && testCheck[0].teacher_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this test' });
    }
    
    await db.promise().query('DELETE FROM tests WHERE id = ?', [id]);
    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Error deleting test:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
