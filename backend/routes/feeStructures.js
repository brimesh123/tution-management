// routes/feeStructures.js
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

// Create a new fee structure (admin only)
router.post('/create', authMiddleware, adminCheck, async (req, res) => {
  const { standard, fee_name, amount, academic_year, due_date, is_mandatory } = req.body;
  
  if (!standard || !fee_name || !amount || !academic_year) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const [result] = await db.promise().query(
      `INSERT INTO fee_structures 
       (standard, fee_name, amount, academic_year, due_date, is_mandatory, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [standard, fee_name, amount, academic_year, due_date, is_mandatory ? 1 : 0, req.user.id]
    );
    
    res.status(201).json({ 
      message: 'Fee structure created successfully', 
      feeStructureId: result.insertId 
    });
  } catch (error) {
    console.error('Error creating fee structure:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all fee structures (admin only)
router.get('/', authMiddleware, adminCheck, async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT fs.*, u.name as created_by_name 
       FROM fee_structures fs
       LEFT JOIN users u ON fs.created_by = u.id
       ORDER BY fs.academic_year DESC, fs.standard`
    );
    
    res.json({ feeStructures: rows });
  } catch (error) {
    console.error('Error fetching fee structures:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get fee structures by standard
router.get('/standard/:standard', authMiddleware, async (req, res) => {
  const { standard } = req.params;
  const { academic_year } = req.query;
  
  try {
    let query = `SELECT * FROM fee_structures WHERE standard = ?`;
    const params = [standard];
    
    if (academic_year) {
      query += ` AND academic_year = ?`;
      params.push(academic_year);
    }
    
    query += ` AND is_active = 1 ORDER BY fee_name`;
    
    const [rows] = await db.promise().query(query, params);
    res.json({ feeStructures: rows });
  } catch (error) {
    console.error('Error fetching fee structures by standard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a fee structure (admin only)
router.put('/:id', authMiddleware, adminCheck, async (req, res) => {
  const { id } = req.params;
  const { fee_name, amount, academic_year, due_date, is_mandatory, is_active } = req.body;
  
  try {
    const updateFields = [];
    const params = [];
    
    if (fee_name) {
      updateFields.push('fee_name = ?');
      params.push(fee_name);
    }
    
    if (amount) {
      updateFields.push('amount = ?');
      params.push(amount);
    }
    
    if (academic_year) {
      updateFields.push('academic_year = ?');
      params.push(academic_year);
    }
    
    if (due_date) {
      updateFields.push('due_date = ?');
      params.push(due_date);
    }
    
    if (is_mandatory !== undefined) {
      updateFields.push('is_mandatory = ?');
      params.push(is_mandatory ? 1 : 0);
    }
    
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    params.push(id);
    
    await db.promise().query(
      `UPDATE fee_structures SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );
    
    res.json({ message: 'Fee structure updated successfully' });
  } catch (error) {
    console.error('Error updating fee structure:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a fee structure (admin only)
router.delete('/:id', authMiddleware, adminCheck, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if this fee structure is already assigned to students
    const [assigned] = await db.promise().query(
      'SELECT COUNT(*) as count FROM fees WHERE fee_structure_id = ?',
      [id]
    );
    
    if (assigned[0].count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete: Fee structure is already assigned to students. Please deactivate instead.' 
      });
    }
    
    await db.promise().query('DELETE FROM fee_structures WHERE id = ?', [id]);
    res.json({ message: 'Fee structure deleted successfully' });
  } catch (error) {
    console.error('Error deleting fee structure:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;