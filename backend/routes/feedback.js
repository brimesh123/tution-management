// routes/feedback.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Endpoint to add feedback with role-based access
router.post('/add', authMiddleware, async (req, res) => {
  const { feedback_text, to_role = null, to_user_id = null } = req.body;
  console.log('Received feedback add request:', req.body);
  
  if (!feedback_text) {
    console.log('Missing feedback text in request');
    return res.status(400).json({ message: 'Feedback text is required' });
  }
  
  // Get user ID and role from auth token
  const user_id = req.user.id;
  const from_role = req.user.role;
  
  try {
    // Validation: If to_user_id is provided, check if user exists
    if (to_user_id) {
      const [userCheck] = await db.promise().query('SELECT id, role FROM users WHERE id = ?', [to_user_id]);
      
      if (userCheck.length === 0) {
        return res.status(404).json({ message: 'Recipient user not found' });
      }
      
      // If to_role is not provided but to_user_id is, set to_role to the user's role
      if (!to_role) {
        to_role = userCheck[0].role;
      }
    }
    
    const [result] = await db.promise().query(
      `INSERT INTO feedback (user_id, from_role, to_role, to_user_id, feedback_text, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [user_id, from_role, to_role, to_user_id, feedback_text]
    );
    
    console.log('Feedback record created with ID:', result.insertId);
    res.status(201).json({ 
      message: 'Feedback added successfully', 
      feedbackId: result.insertId 
    });
  } catch (error) {
    console.error('Error adding feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Endpoint to fetch feedback records with filtering
router.get('/', authMiddleware, async (req, res) => {
  console.log('Fetching feedback records');
  
  const { 
    user_id, 
    from_role, 
    to_role, 
    to_user_id, 
    status,
    direction = 'received' // 'received' or 'sent'
  } = req.query;
  
  try {
    let query = `
      SELECT f.*, 
             u1.name as from_user_name,
             u2.name as to_user_name
      FROM feedback f
      JOIN users u1 ON f.user_id = u1.id
      LEFT JOIN users u2 ON f.to_user_id = u2.id
      WHERE 1=1
    `;
    const params = [];
    
    // If direction is 'received', get feedback directed to this user or their role
    if (direction === 'received') {
      query += ' AND (f.to_user_id = ? OR (f.to_role = ? AND f.to_user_id IS NULL))';
      params.push(req.user.id, req.user.role);
    } 
    // If direction is 'sent', get feedback sent by this user
    else if (direction === 'sent') {
      query += ' AND f.user_id = ?';
      params.push(req.user.id);
    }
    
    // Apply additional filters if provided
    if (user_id && user_id !== req.user.id) {
      // Only admins can filter by any user_id
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized: You can only view your own feedback' });
      }
      query += ' AND f.user_id = ?';
      params.push(user_id);
    }
    
    if (from_role) {
      query += ' AND f.from_role = ?';
      params.push(from_role);
    }
    
    if (to_role) {
      query += ' AND f.to_role = ?';
      params.push(to_role);
    }
    
    if (to_user_id) {
      query += ' AND f.to_user_id = ?';
      params.push(to_user_id);
    }
    
    if (status) {
      query += ' AND f.status = ?';
      params.push(status);
    }
    
    // Order by newest first
    query += ' ORDER BY f.created_at DESC';
    
    const [rows] = await db.promise().query(query, params);
    
    console.log('Feedback records fetched:', rows.length);
    res.json({ feedback: rows });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Endpoint to mark feedback as read
router.put('/:id/read', authMiddleware, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if feedback exists and is directed to this user or their role
    const [feedback] = await db.promise().query(
      `SELECT * FROM feedback 
       WHERE id = ? AND (to_user_id = ? OR (to_role = ? AND to_user_id IS NULL))`,
      [id, req.user.id, req.user.role]
    );
    
    if (feedback.length === 0) {
      return res.status(404).json({ message: 'Feedback not found or not directed to you' });
    }
    
    // Update feedback status
    await db.promise().query(
      'UPDATE feedback SET status = "read" WHERE id = ?',
      [id]
    );
    
    res.json({ message: 'Feedback marked as read' });
  } catch (error) {
    console.error('Error marking feedback as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Endpoint to respond to feedback
router.post('/:id/respond', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { response } = req.body;
  
  if (!response) {
    return res.status(400).json({ message: 'Response text is required' });
  }
  
  try {
    // Check if feedback exists and is directed to this user or their role
    const [feedback] = await db.promise().query(
      `SELECT * FROM feedback 
       WHERE id = ? AND (to_user_id = ? OR (to_role = ? AND to_user_id IS NULL))`,
      [id, req.user.id, req.user.role]
    );
    
    if (feedback.length === 0) {
      return res.status(404).json({ message: 'Feedback not found or not directed to you' });
    }
    
    // Insert response as new feedback
    const [result] = await db.promise().query(
      `INSERT INTO feedback (
        user_id, from_role, to_role, to_user_id, feedback_text, status
      ) VALUES (?, ?, ?, ?, ?, 'pending')`,
      [
        req.user.id,
        req.user.role,
        feedback[0].from_role,
        feedback[0].user_id,
        response
      ]
    );
    
    // Update original feedback status
    await db.promise().query(
      'UPDATE feedback SET status = "responded" WHERE id = ?',
      [id]
    );
    
    res.status(201).json({
      message: 'Response added successfully',
      responseId: result.insertId
    });
  } catch (error) {
    console.error('Error responding to feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get feedback statistics for admins
router.get('/stats', authMiddleware, async (req, res) => {
  // Only admins can view feedback stats
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized: Only admins can view feedback statistics' });
  }
  
  try {
    // Count feedback by status
    const [statusStats] = await db.promise().query(
      `SELECT status, COUNT(*) as count
       FROM feedback
       GROUP BY status`
    );
    
    // Count feedback by from_role
    const [roleStats] = await db.promise().query(
      `SELECT from_role, COUNT(*) as count
       FROM feedback
       GROUP BY from_role`
    );
    
    // Count feedback by to_role
    const [toRoleStats] = await db.promise().query(
      `SELECT to_role, COUNT(*) as count
       FROM feedback
       WHERE to_role IS NOT NULL
       GROUP BY to_role`
    );
    
    // Recent feedback (pending)
    const [recentPending] = await db.promise().query(
      `SELECT f.*, u1.name as from_user_name, u2.name as to_user_name
       FROM feedback f
       JOIN users u1 ON f.user_id = u1.id
       LEFT JOIN users u2 ON f.to_user_id = u2.id
       WHERE f.status = 'pending'
       ORDER BY f.created_at DESC
       LIMIT 5`
    );
    
    res.json({
      statusStats,
      roleStats,
      toRoleStats,
      recentPending,
      total: statusStats.reduce((sum, stat) => sum + stat.count, 0)
    });
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete feedback (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  
  // Only admins can delete feedback
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized: Only admins can delete feedback' });
  }
  
  try {
    // Check if feedback exists
    const [feedback] = await db.promise().query('SELECT * FROM feedback WHERE id = ?', [id]);
    
    if (feedback.length === 0) {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    
    // Delete feedback
    await db.promise().query('DELETE FROM feedback WHERE id = ?', [id]);
    
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;