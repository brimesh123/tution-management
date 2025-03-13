// routes/fees.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Endpoint to add a fee record (enhanced)
router.post('/add', authMiddleware, async (req, res) => {
  const { 
    student_id, 
    fee_amount, 
    status, 
    due_date,
    fee_type = 'tuition',
    payment_date = null,
    payment_method = null,
    transaction_id = null,
    remarks = null
  } = req.body;
  
  console.log('Received fee add request:', req.body);
  
  // Only admins can add fee records
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized: Only admins can add fee records' });
  }
  
  if (!student_id || fee_amount === undefined || !status || !due_date) {
    console.log('Missing fields in fee add request');
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  try {
    // Check if student exists
    const [studentCheck] = await db.promise().query(
      'SELECT id, name FROM users WHERE id = ? AND role = "student"',
      [student_id]
    );
    
    if (studentCheck.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const [result] = await db.promise().query(
      `INSERT INTO fees (
        student_id, fee_amount, status, due_date, fee_type,
        payment_date, payment_method, transaction_id, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        student_id, fee_amount, status, due_date, fee_type,
        payment_date, payment_method, transaction_id, remarks
      ]
    );
    
    console.log('Fee record created with ID:', result.insertId);
    res.status(201).json({ 
      message: 'Fee record added successfully', 
      feeId: result.insertId,
      feeDetails: {
        id: result.insertId,
        student_id,
        student_name: studentCheck[0].name,
        fee_amount,
        status,
        due_date
      }
    });
  } catch (error) {
    console.error('Error adding fee record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk add fees for multiple students (for a class)
router.post('/bulk-add', authMiddleware, async (req, res) => {
  const { standard, division, fee_amount, fee_type, due_date, remarks } = req.body;
  
  // Only admins can add fee records
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized: Only admins can add fee records' });
  }
  
  if (!standard || !division || !fee_amount || !fee_type || !due_date) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  try {
    // Get all students in the class
    const [students] = await db.promise().query(
      'SELECT id FROM users WHERE standard = ? AND division = ? AND role = "student"',
      [standard, division]
    );
    
    if (students.length === 0) {
      return res.status(404).json({ message: 'No students found in this class' });
    }
    
    // Insert fee records for all students
    const insertPromises = students.map(student => {
      return db.promise().query(
        `INSERT INTO fees (
          student_id, fee_amount, status, due_date, fee_type, remarks
        ) VALUES (?, ?, 'pending', ?, ?, ?)`,
        [student.id, fee_amount, due_date, fee_type, remarks]
      );
    });
    
    await Promise.all(insertPromises);
    
    res.status(201).json({ 
      message: `Fee records added successfully for ${students.length} students`,
      studentsCount: students.length
    });
  } catch (error) {
    console.error('Error adding bulk fee records:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Endpoint to fetch fee records for a student
router.get('/student/:studentId', async (req, res) => {
  const { studentId } = req.params;
  console.log('Fetching fee status for student:', studentId);
  
  try {
    // Get student details
    const [student] = await db.promise().query(
      'SELECT id, name, standard, division FROM users WHERE id = ? AND role = "student"',
      [studentId]
    );
    
    if (student.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Get fee records
    const [fees] = await db.promise().query(
      `SELECT * FROM fees 
       WHERE student_id = ? 
       ORDER BY due_date DESC`,
      [studentId]
    );
    
    // Calculate summary stats
    const totalFees = fees.reduce((sum, fee) => sum + parseFloat(fee.fee_amount), 0);
    const paidFees = fees
      .filter(fee => fee.status === 'paid')
      .reduce((sum, fee) => sum + parseFloat(fee.fee_amount), 0);
    const pendingFees = totalFees - paidFees;
    
    console.log('Fee records fetched:', fees.length);
    res.json({ 
      student: student[0],
      fees,
      summary: {
        totalFees,
        paidFees,
        pendingFees,
        pendingCount: fees.filter(fee => fee.status === 'pending').length
      }
    });
  } catch (error) {
    console.error('Error fetching fee records:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a fee record (mark as paid)
router.put('/:id/pay', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { 
    payment_date = new Date().toISOString().split('T')[0],
    payment_method,
    transaction_id,
    remarks
  } = req.body;
  
  // Only admins can update fee records
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized: Only admins can update fee records' });
  }
  
  try {
    // Check if fee record exists
    const [feeCheck] = await db.promise().query('SELECT * FROM fees WHERE id = ?', [id]);
    
    if (feeCheck.length === 0) {
      return res.status(404).json({ message: 'Fee record not found' });
    }
    
    // Update the fee record
    await db.promise().query(
      `UPDATE fees 
       SET status = 'paid', payment_date = ?, payment_method = ?, transaction_id = ?, remarks = ?
       WHERE id = ?`,
      [payment_date, payment_method, transaction_id, remarks, id]
    );
    
    res.json({ message: 'Fee marked as paid successfully' });
  } catch (error) {
    console.error('Error marking fee as paid:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all pending fees
router.get('/pending', authMiddleware, async (req, res) => {
  // Only admins can view all pending fees
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized: Only admins can view all pending fees' });
  }
  
  try {
    const [fees] = await db.promise().query(
      `SELECT f.*, u.name as student_name, u.standard, u.division
       FROM fees f
       JOIN users u ON f.student_id = u.id
       WHERE f.status = 'pending'
       ORDER BY f.due_date ASC`
    );
    
    // Group by standard and division
    const groupedFees = fees.reduce((acc, fee) => {
      const key = `${fee.standard}-${fee.division}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(fee);
      return acc;
    }, {});
    
    // Calculate total pending amount
    const totalPending = fees.reduce((sum, fee) => sum + parseFloat(fee.fee_amount), 0);
    
    res.json({ 
      pendingFees: fees,
      groupedFees,
      summary: {
        totalPending,
        totalRecords: fees.length
      }
    });
  } catch (error) {
    console.error('Error fetching pending fees:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get fee collection report
router.get('/report', authMiddleware, async (req, res) => {
  const { start_date, end_date, standard, division } = req.query;
  
  // Only admins can view fee reports
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized: Only admins can view fee reports' });
  }
  
  try {
    let query = `
      SELECT f.*, u.name as student_name, u.standard, u.division
      FROM fees f
      JOIN users u ON f.student_id = u.id
      WHERE 1=1
    `;
    const params = [];
    
    if (start_date) {
      query += ' AND f.payment_date >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      query += ' AND f.payment_date <= ?';
      params.push(end_date);
    }
    
    if (standard) {
      query += ' AND u.standard = ?';
      params.push(standard);
    }
    
    if (division) {
      query += ' AND u.division = ?';
      params.push(division);
    }
    
    query += ' ORDER BY f.payment_date DESC';
    
    const [fees] = await db.promise().query(query, params);
    
    // Calculate summary stats
    const totalCollected = fees
      .filter(fee => fee.status === 'paid')
      .reduce((sum, fee) => sum + parseFloat(fee.fee_amount), 0);
    
    // Group by payment method
    const paymentMethodStats = fees
      .filter(fee => fee.status === 'paid')
      .reduce((acc, fee) => {
        const method = fee.payment_method || 'Unknown';
        if (!acc[method]) {
          acc[method] = {
            count: 0,
            amount: 0
          };
        }
        acc[method].count += 1;
        acc[method].amount += parseFloat(fee.fee_amount);
        return acc;
      }, {});
    
    res.json({
      fees,
      summary: {
        totalCollected,
        paidCount: fees.filter(fee => fee.status === 'paid').length,
        pendingCount: fees.filter(fee => fee.status === 'pending').length,
        paymentMethodStats
      }
    });
  } catch (error) {
    console.error('Error generating fee report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a fee record
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  
  // Only admins can delete fee records
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized: Only admins can delete fee records' });
  }
  
  try {
    // Check if fee record exists
    const [feeCheck] = await db.promise().query('SELECT * FROM fees WHERE id = ?', [id]);
    
    if (feeCheck.length === 0) {
      return res.status(404).json({ message: 'Fee record not found' });
    }
    
    await db.promise().query('DELETE FROM fees WHERE id = ?', [id]);
    res.json({ message: 'Fee record deleted successfully' });
  } catch (error) {
    console.error('Error deleting fee record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;