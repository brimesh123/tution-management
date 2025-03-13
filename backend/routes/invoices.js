// routes/invoices.js
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

// Helper function to generate invoice number
const generateInvoiceNumber = async () => {
  const [result] = await db.promise().query(
    `SELECT IFNULL(MAX(CAST(SUBSTRING_INDEX(invoice_number, '-', -1) AS UNSIGNED)), 0) + 1 AS next_num
     FROM invoices`
  );
  const nextNum = result[0].next_num;
  return `INV-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${nextNum.toString().padStart(4, '0')}`;
};

// Create a new invoice (admin only)
router.post('/create', authMiddleware, adminCheck, async (req, res) => {
  const { student_id, fee_ids, invoice_date, due_date, notes } = req.body;
  
  if (!student_id || !fee_ids || !Array.isArray(fee_ids) || fee_ids.length === 0) {
    return res.status(400).json({ message: 'Student ID and at least one fee ID are required' });
  }
  
  try {
    // Start a transaction
    await db.promise().query('START TRANSACTION');
    
    // Fetch the fee details
    const [fees] = await db.promise().query(
      `SELECT f.*, fs.fee_name 
       FROM fees f
       JOIN fee_structures fs ON f.fee_structure_id = fs.id
       WHERE f.id IN (?) AND f.student_id = ?`,
      [fee_ids, student_id]
    );
    
    if (fees.length === 0) {
      await db.promise().query('ROLLBACK');
      return res.status(404).json({ message: 'No valid fees found for this student' });
    }
    
    // Calculate the total amount
    const totalAmount = fees.reduce((sum, fee) => sum + parseFloat(fee.balance), 0);
    
    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();
    
    // Create the invoice
    const [invoiceResult] = await db.promise().query(
      `INSERT INTO invoices 
       (invoice_number, student_id, invoice_date, due_date, total_amount, status, notes, created_by) 
       VALUES (?, ?, ?, ?, ?, 'issued', ?, ?)`,
      [invoiceNumber, student_id, invoice_date || new Date(), due_date, totalAmount, notes, req.user.id]
    );
    
    const invoiceId = invoiceResult.insertId;
    
    // Add invoice items
    const invoiceItems = fees.map(fee => [
      invoiceId,
      fee.id,
      fee.fee_name,
      fee.balance
    ]);
    
    await db.promise().query(
      `INSERT INTO invoice_items (invoice_id, fee_id, fee_name, amount) VALUES ?`,
      [invoiceItems]
    );
    
    // Commit the transaction
    await db.promise().query('COMMIT');
    
    res.status(201).json({ 
      message: 'Invoice created successfully', 
      invoiceId, 
      invoiceNumber 
    });
  } catch (error) {
    await db.promise().query('ROLLBACK');
    console.error('Error creating invoice:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get invoice by ID or invoice number
router.get('/:identifier', authMiddleware, async (req, res) => {
  const { identifier } = req.params;
  
  try {
    let query = `
      SELECT i.*, s.name as student_name, s.custom_id, s.standard, s.division,
             u.name as created_by_name
      FROM invoices i
      JOIN users s ON i.student_id = s.id
      LEFT JOIN users u ON i.created_by = u.id
      WHERE i.id = ? OR i.invoice_number = ?
    `;
    
    const [invoices] = await db.promise().query(query, [identifier, identifier]);
    
    if (invoices.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    const invoice = invoices[0];
    
    // Check authorization - admin or the student themselves or their parent
    if (req.user.role !== 'admin' && 
        req.user.id !== invoice.student_id && 
        req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get invoice items
    const [items] = await db.promise().query(
      `SELECT ii.*, f.total_amount as fee_total_amount, f.paid_amount as fee_paid_amount,
              f.balance as fee_balance, f.status as fee_status
       FROM invoice_items ii
       JOIN fees f ON ii.fee_id = f.id
       WHERE ii.invoice_id = ?`,
      [invoice.id]
    );
    
    // Get payments related to this invoice's fee items
    const feeIds = items.map(item => item.fee_id);
    let payments = [];
    
    if (feeIds.length > 0) {
      const [paymentRows] = await db.promise().query(
        `SELECT p.*
         FROM payments p
         WHERE p.fee_id IN (?)
         ORDER BY p.payment_date DESC`,
        [feeIds]
      );
      payments = paymentRows;
    }
    
    res.json({ 
      invoice: {
        ...invoice,
        items,
        payments
      } 
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all invoices for a student
router.get('/student/:studentId', authMiddleware, async (req, res) => {
  const { studentId } = req.params;
  
  // Check authorization - admin or the student themselves or their parent
  if (req.user.role !== 'admin' && 
      req.user.id !== parseInt(studentId) && 
      req.user.role !== 'parent') {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  try {
    const [invoices] = await db.promise().query(
      `SELECT i.*, s.name as student_name, s.custom_id, s.standard, s.division,
              u.name as created_by_name
       FROM invoices i
       JOIN users s ON i.student_id = s.id
       LEFT JOIN users u ON i.created_by = u.id
       WHERE i.student_id = ?
       ORDER BY i.created_at DESC`,
      [studentId]
    );
    
    res.json({ invoices });
  } catch (error) {
    console.error('Error fetching student invoices:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get invoices by class (admin only)
router.get('/by-class/all', authMiddleware, adminCheck, async (req, res) => {
  const { standard, division, status } = req.query;
  
  try {
    let query = `
      SELECT i.*, s.name as student_name, s.custom_id, s.standard, s.division
      FROM invoices i
      JOIN users s ON i.student_id = s.id
    `;
    const params = [];
    
    const conditions = [];
    
    if (standard) {
      conditions.push('s.standard = ?');
      params.push(standard);
    }
    
    if (division) {
      conditions.push('s.division = ?');
      params.push(division);
    }
    
    if (status) {
      conditions.push('i.status = ?');
      params.push(status);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY i.created_at DESC';
    
    const [invoices] = await db.promise().query(query, params);
    
    res.json({ invoices });
  } catch (error) {
    console.error('Error fetching invoices by class:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update invoice status (admin only)
router.put('/:id/status', authMiddleware, adminCheck, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }
  
  try {
    await db.promise().query(
      'UPDATE invoices SET status = ? WHERE id = ?',
      [status, id]
    );
    
    res.json({ message: 'Invoice status updated successfully' });
  } catch (error) {
    console.error('Error updating invoice status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete an invoice (admin only)
router.delete('/:id', authMiddleware, adminCheck, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Start a transaction
    await db.promise().query('START TRANSACTION');
    
    // Delete invoice items first (due to foreign key constraints)
    await db.promise().query('DELETE FROM invoice_items WHERE invoice_id = ?', [id]);
    
    // Delete the invoice
    await db.promise().query('DELETE FROM invoices WHERE id = ?', [id]);
    
    // Commit the transaction
    await db.promise().query('COMMIT');
    
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    await db.promise().query('ROLLBACK');
    console.error('Error deleting invoice:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;