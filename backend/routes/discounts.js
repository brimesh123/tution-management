// routes/discounts.js
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

// Apply a discount to a student's fee (admin only)
router.post('/apply', authMiddleware, adminCheck, async (req, res) => {
  const { student_id, fee_id, discount_name, discount_type, discount_value, academic_year, reason } = req.body;
  
  if (!student_id || !discount_name || !discount_type || !discount_value || !academic_year) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  try {
    // If fee_id is provided, verify the fee exists and belongs to this student
    if (fee_id) {
      const [feeCheck] = await db.promise().query(
        'SELECT * FROM fees WHERE id = ? AND student_id = ?',
        [fee_id, student_id]
      );
      
      if (feeCheck.length === 0) {
        return res.status(404).json({ message: 'Fee not found for this student' });
      }
    }
    
    // Apply the discount
    const [result] = await db.promise().query(
      `INSERT INTO discounts 
       (student_id, fee_id, discount_name, discount_type, discount_value, academic_year, reason, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [student_id, fee_id, discount_name, discount_type, discount_value, academic_year, reason, req.user.id]
    );
    
    res.status(201).json({ 
      message: 'Discount applied successfully', 
      discountId: result.insertId 
    });
  } catch (error) {
    console.error('Error applying discount:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all discounts for a student
router.get('/student/:studentId', authMiddleware, async (req, res) => {
  const { studentId } = req.params;
  const { academic_year } = req.query;
  
  // Check authorization - admin or the student themselves or their parent
  if (req.user.role !== 'admin' && req.user.id !== parseInt(studentId) && req.user.role !== 'parent') {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  try {
    let query = `
      SELECT d.*, u.name as created_by_name, f.total_amount as fee_amount, fs.fee_name
      FROM discounts d
      LEFT JOIN users u ON d.created_by = u.id
      LEFT JOIN fees f ON d.fee_id = f.id
      LEFT JOIN fee_structures fs ON f.fee_structure_id = fs.id
      WHERE d.student_id = ?
    `;
    const params = [studentId];
    
    if (academic_year) {
      query += ` AND d.academic_year = ?`;
      params.push(academic_year);
    }
    
    query += ` ORDER BY d.created_at DESC`;
    
    const [rows] = await db.promise().query(query, params);
    
    res.json({ discounts: rows });
  } catch (error) {
    console.error('Error fetching student discounts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a discount (admin only)
router.delete('/:id', authMiddleware, adminCheck, async (req, res) => {
  const { id } = req.params;
  
  try {
    await db.promise().query('DELETE FROM discounts WHERE id = ?', [id]);
    res.json({ message: 'Discount deleted successfully' });
  } catch (error) {
    console.error('Error deleting discount:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;