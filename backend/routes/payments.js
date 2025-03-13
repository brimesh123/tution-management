// routes/payments.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware to check if user is admin
const adminCheck = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

// Record a payment (admin only)
router.post('/add', authMiddleware, adminCheck, async (req, res) => {
  const { fee_id, student_id, amount, payment_date, payment_method, transaction_id, notes } = req.body;
  
  if (!fee_id || !student_id || !amount || !payment_date || !payment_method) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  try {
    // Verify that the fee belongs to the specified student
    const [feeCheck] = await db.promise().query(
      'SELECT * FROM fees WHERE id = ? AND student_id = ?',
      [fee_id, student_id]
    );
    
    if (feeCheck.length === 0) {
      return res.status(404).json({ message: 'Fee not found for this student' });
    }
    
    // Check if payment amount is valid (not exceeding the remaining balance)
    if (parseFloat(amount) > parseFloat(feeCheck[0].balance)) {
      return res.status(400).json({ 
        message: `Payment amount exceeds remaining balance of ${feeCheck[0].balance}` 
      });
    }
    
    // Record the payment
    const [result] = await db.promise().query(
      `INSERT INTO payments 
       (fee_id, student_id, amount, payment_date, payment_method, transaction_id, notes, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [fee_id, student_id, amount, payment_date, payment_method, transaction_id, notes, req.user.id]
    );
    
    // The after_payment_insert trigger will automatically update fee status
    
    // Get the generated receipt number
    const [paymentInfo] = await db.promise().query(
      'SELECT * FROM payments WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({ 
      message: 'Payment recorded successfully', 
      paymentId: result.insertId,
      receiptNumber: paymentInfo[0].receipt_number
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all payments for a student
router.get('/student/:studentId', authMiddleware, async (req, res) => {
  const { studentId } = req.params;
  
  // Check authorization - admin or the student themselves or their parent
  if (req.user.role !== 'admin' && req.user.id !== parseInt(studentId) && req.user.role !== 'parent') {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  try {
    const [rows] = await db.promise().query(
      `SELECT p.*, f.total_amount, fs.fee_name, u.name as recorded_by
       FROM payments p
       JOIN fees f ON p.fee_id = f.id
       JOIN fee_structures fs ON f.fee_structure_id = fs.id
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.student_id = ?
       ORDER BY p.payment_date DESC, p.id DESC`,
      [studentId]
    );
    
    res.json({ payments: rows });
  } catch (error) {
    console.error('Error fetching student payments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get payment details by receipt number
router.get('/receipt/:receiptNumber', authMiddleware, async (req, res) => {
  const { receiptNumber } = req.params;
  
  try {
    const [payments] = await db.promise().query(
      `SELECT p.*, f.total_amount, f.academic_year, fs.fee_name, u.name as recorded_by,
              s.name as student_name, s.custom_id, s.standard, s.division
       FROM payments p
       JOIN fees f ON p.fee_id = f.id
       JOIN fee_structures fs ON f.fee_structure_id = fs.id
       JOIN users s ON p.student_id = s.id
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.receipt_number = ?`,
      [receiptNumber]
    );
    
    if (payments.length === 0) {
      return res.status(404).json({ message: 'Receipt not found' });
    }
    
    // Check authorization - admin or the student themselves or their parent
    if (req.user.role !== 'admin' && 
        req.user.id !== payments[0].student_id && 
        req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json({ payment: payments[0] });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add this new route near the top (after your adminCheck middleware)
router.get('/recent', authMiddleware, async (req, res) => {
  try {
    const { standard, division, startDate, endDate } = req.query;
    let query = `
      SELECT p.*, u.name as student_name 
      FROM payments p 
      JOIN users u ON p.student_id = u.id
    `;
    let conditions = [];
    let params = [];
    if (standard) {
      conditions.push("u.standard = ?");
      params.push(standard);
    }
    if (division) {
      conditions.push("u.division = ?");
      params.push(division);
    }
    if (startDate) {
      conditions.push("p.payment_date >= ?");
      params.push(startDate);
    }
    if (endDate) {
      conditions.push("p.payment_date <= ?");
      params.push(endDate);
    }
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY p.payment_date DESC LIMIT 10";
    const [rows] = await db.promise().query(query, params);
    res.json({ payments: rows });
  } catch (error) {
    console.error('Error fetching recent payments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a payment (admin only)
router.delete('/:id', authMiddleware, adminCheck, async (req, res) => {
  const { id } = req.params;
  
  try {
    await db.promise().query('DELETE FROM payments WHERE id = ?', [id]);
    
    // Call the stored procedure to update fee status
    await db.promise().query('CALL update_fee_status()');
    
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;