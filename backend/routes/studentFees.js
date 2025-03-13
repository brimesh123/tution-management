// routes/studentFees.js
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

// Assign fees to a student (admin only)
router.post('/assign', authMiddleware, adminCheck, async (req, res) => {
  const { student_id, fee_structure_id, academic_year, due_date, notes } = req.body;
  
  if (!student_id || !fee_structure_id || !academic_year) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  try {
    // Get fee structure details
    const [feeStructures] = await db.promise().query(
      'SELECT * FROM fee_structures WHERE id = ?',
      [fee_structure_id]
    );
    
    if (feeStructures.length === 0) {
      return res.status(404).json({ message: 'Fee structure not found' });
    }
    
    const feeStructure = feeStructures[0];
    
    // Check if this fee has already been assigned to this student for this academic year
    const [existing] = await db.promise().query(
      'SELECT * FROM fees WHERE student_id = ? AND fee_structure_id = ? AND academic_year = ?',
      [student_id, fee_structure_id, academic_year]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ 
        message: 'This fee has already been assigned to this student for this academic year' 
      });
    }
    
    // Assign fee to student
    const [result] = await db.promise().query(
      `INSERT INTO fees 
       (student_id, fee_structure_id, total_amount, due_date, academic_year, notes) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        student_id, 
        fee_structure_id, 
        feeStructure.amount, 
        due_date || feeStructure.due_date, 
        academic_year,
        notes
      ]
    );
    
    res.status(201).json({ 
      message: 'Fee assigned to student successfully', 
      feeId: result.insertId 
    });
  } catch (error) {
    console.error('Error assigning fee to student:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign fees to multiple students in a standard (admin only)
router.post('/assign-bulk', authMiddleware, adminCheck, async (req, res) => {
  const { standard, division, fee_structure_id, academic_year, due_date } = req.body;
  
  if (!standard || !fee_structure_id || !academic_year) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  try {
    // Get fee structure details
    const [feeStructures] = await db.promise().query(
      'SELECT * FROM fee_structures WHERE id = ?',
      [fee_structure_id]
    );
    
    if (feeStructures.length === 0) {
      return res.status(404).json({ message: 'Fee structure not found' });
    }
    
    const feeStructure = feeStructures[0];
    
    // Get students from the specified standard (and division if provided)
    let query = 'SELECT id FROM users WHERE role = "student" AND standard = ?';
    const params = [standard];
    
    if (division) {
      query += ' AND division = ?';
      params.push(division);
    }
    
    const [students] = await db.promise().query(query, params);
    
    if (students.length === 0) {
      return res.status(404).json({ message: 'No students found for the specified criteria' });
    }
    
    // Prepare bulk insert values
    const values = students.map(student => [
      student.id,
      fee_structure_id,
      feeStructure.amount,
      due_date || feeStructure.due_date,
      academic_year,
      'Bulk assigned'
    ]);
    
    // Insert fees for all students
    const [result] = await db.promise().query(
      `INSERT INTO fees 
       (student_id, fee_structure_id, total_amount, due_date, academic_year, notes) 
       VALUES ?`,
      [values]
    );
    
    res.status(201).json({ 
      message: `Fee assigned to ${students.length} students successfully`, 
      affectedRows: result.affectedRows 
    });
  } catch (error) {
    console.error('Error assigning bulk fees:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get fees for a specific student
router.get('/student/:studentId', authMiddleware, async (req, res) => {
  const { studentId } = req.params;
  const { academic_year } = req.query;
  
  // Check authorization - admin or the student themselves or their parent
  if (req.user.role !== 'admin' && req.user.id !== parseInt(studentId) && req.user.role !== 'parent') {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  try {
    let query = `
      SELECT f.*, fs.fee_name, fs.is_mandatory, 
             u.name as student_name, u.standard, u.division
      FROM fees f
      JOIN fee_structures fs ON f.fee_structure_id = fs.id
      JOIN users u ON f.student_id = u.id
      WHERE f.student_id = ?
    `;
    const params = [studentId];
    
    if (academic_year) {
      query += ` AND f.academic_year = ?`;
      params.push(academic_year);
    }
    
    query += ` ORDER BY f.due_date`;
    
    const [rows] = await db.promise().query(query, params);
    
    // Get payments for each fee
    const [payments] = await db.promise().query(
      `SELECT * FROM payments WHERE student_id = ? ORDER BY payment_date DESC`,
      [studentId]
    );
    
    // Get discounts for each fee
    const [discounts] = await db.promise().query(
      `SELECT * FROM discounts WHERE student_id = ?`,
      [studentId]
    );
    
    // Combine the fee data with payments and discounts
    const feesWithDetails = rows.map(fee => {
      return {
        ...fee,
        payments: payments.filter(payment => payment.fee_id === fee.id),
        discounts: discounts.filter(discount => discount.fee_id === fee.id || discount.fee_id === null)
      };
    });
    
    res.json({ fees: feesWithDetails });
  } catch (error) {
    console.error('Error fetching student fees:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get fees by standard/division (admin only)
router.get('/by-class', authMiddleware, adminCheck, async (req, res) => {
  const { standard, division, academic_year } = req.query;
  
  if (!standard || !academic_year) {
    return res.status(400).json({ message: 'Standard and academic year are required' });
  }
  
  try {
    let query = `
      SELECT f.*, fs.fee_name, fs.is_mandatory, 
             u.name as student_name, u.standard, u.division, u.custom_id
      FROM fees f
      JOIN fee_structures fs ON f.fee_structure_id = fs.id
      JOIN users u ON f.student_id = u.id
      WHERE u.standard = ? AND f.academic_year = ?
    `;
    const params = [standard, academic_year];
    
    if (division) {
      query += ` AND u.division = ?`;
      params.push(division);
    }
    
    query += ` ORDER BY u.name, f.due_date`;
    
    const [rows] = await db.promise().query(query, params);
    
    // Group fees by student
    const feesByStudent = {};
    rows.forEach(fee => {
      if (!feesByStudent[fee.student_id]) {
        feesByStudent[fee.student_id] = {
          student_id: fee.student_id,
          student_name: fee.student_name,
          custom_id: fee.custom_id,
          standard: fee.standard,
          division: fee.division,
          total_due: 0,
          total_paid: 0,
          total_balance: 0,
          fees: []
        };
      }
      
      feesByStudent[fee.student_id].fees.push(fee);
      feesByStudent[fee.student_id].total_due += parseFloat(fee.total_amount);
      feesByStudent[fee.student_id].total_paid += parseFloat(fee.paid_amount);
      feesByStudent[fee.student_id].total_balance += parseFloat(fee.balance);
    });
    
    res.json({ 
      students: Object.values(feesByStudent),
      total_students: Object.keys(feesByStudent).length
    });
  } catch (error) {
    console.error('Error fetching fees by class:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a fee record (admin only)
router.put('/:id', authMiddleware, adminCheck, async (req, res) => {
  const { id } = req.params;
  const { total_amount, due_date, notes, status } = req.body;
  
  try {
    const updateFields = [];
    const params = [];
    
    if (total_amount) {
      updateFields.push('total_amount = ?');
      params.push(total_amount);
    }
    
    if (due_date) {
      updateFields.push('due_date = ?');
      params.push(due_date);
    }
    
    if (notes) {
      updateFields.push('notes = ?');
      params.push(notes);
    }
    
    if (status) {
      updateFields.push('status = ?');
      params.push(status);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    params.push(id);
    
    await db.promise().query(
      `UPDATE fees SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );
    
    // Call the stored procedure to update status
    await db.promise().query('CALL update_fee_status()');
    
    res.json({ message: 'Fee record updated successfully' });
  } catch (error) {
    console.error('Error updating fee record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a fee record (admin only)
router.delete('/:id', authMiddleware, adminCheck, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if this fee has any payments
    const [payments] = await db.promise().query(
      'SELECT COUNT(*) as count FROM payments WHERE fee_id = ?',
      [id]
    );
    
    if (payments[0].count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete: This fee has payments recorded. Please adjust the fee instead.' 
      });
    }
    
    await db.promise().query('DELETE FROM fees WHERE id = ?', [id]);
    res.json({ message: 'Fee record deleted successfully' });
  } catch (error) {
    console.error('Error deleting fee record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;