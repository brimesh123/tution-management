// routes/users.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');

// ------------------------
// Add Student Endpoint
// ------------------------
router.post('/add-student', async (req, res) => {
  const { custom_id, name, email, password, details, parents_details, subjects, division, standard } = req.body;
  console.log("Add Student request:", req.body);

  if (!custom_id || !name || !email || !password || !details || !parents_details || !subjects || !division || !standard) {
    console.log("Missing fields in add student");
    return res.status(400).json({ message: "All fields are required for student" });
  }

  try {
    const [existing] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      console.log("Student already exists with email:", email);
      return res.status(400).json({ message: "Student already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("Password hashed successfully");

    const [result] = await db.promise().query(
      `INSERT INTO users (custom_id, name, email, password, role, details, parents_details, subjects, division, standard)
       VALUES (?, ?, ?, ?, 'student', ?, ?, ?, ?, ?)`,
      [custom_id, name, email, hashedPassword, details, parents_details, subjects, division, standard]
    );
    console.log("Student created with ID:", result.insertId);
    res.status(201).json({ message: "Student created", studentId: result.insertId });
  } catch (error) {
    console.error("Error adding student:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------------
// Add Teacher Endpoint
// ------------------------
// Add Teacher Endpoint
router.post('/add-teacher', async (req, res) => {
  const { custom_id, name, email, password, details, subject, teaching_standard, division, mobile_number, address } = req.body;
  console.log("Add Teacher request:", req.body);

  if (!custom_id || !name || !email || !password || !details || !subject || !teaching_standard || !division || !mobile_number) {
    console.log("Missing fields in add teacher");
    return res.status(400).json({ message: "All fields are required for teacher (address is optional)" });
  }

  try {
    const [existing] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      console.log("Teacher already exists with email:", email);
      return res.status(400).json({ message: "Teacher already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("Password hashed successfully");

    const [result] = await db.promise().query(
      `INSERT INTO users (custom_id, name, email, password, role, details, subject, teaching_standard, division, mobile_number, address)
       VALUES (?, ?, ?, ?, 'teacher', ?, ?, ?, ?, ?, ?)`,
      [custom_id, name, email, hashedPassword, details, subject, teaching_standard, division, mobile_number, address]
    );
    console.log("Teacher created with ID:", result.insertId);
    res.status(201).json({ message: "Teacher created", teacherId: result.insertId });
  } catch (error) {
    console.error("Error adding teacher:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// ------------------------
// Get Students (with filtering)
// ------------------------
router.get('/students', async (req, res) => {
  const { standard, division } = req.query;
  console.log("Fetching students with standard:", standard, "and division:", division);
  try {
    let query = "SELECT id, custom_id, name, email, standard, division FROM users WHERE role = 'student'";
    const params = [];
    if (standard) {
      query += " AND standard = ?";
      params.push(standard);
    }
    if (division) {
      query += " AND division = ?";
      params.push(division);
    }
    const [rows] = await db.promise().query(query, params);
    console.log("Students fetched:", rows.length);
    res.json({ students: rows });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------------
// Get Teachers
// ------------------------
router.get('/teachers', async (req, res) => {
  console.log("Fetching teachers");
  try {
    const [rows] = await db.promise().query("SELECT id, custom_id, name, email, division FROM users WHERE role = 'teacher'");
    console.log("Teachers fetched:", rows.length);
    res.json({ teachers: rows });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------------
// Update User Endpoint (PUT /api/users/:id)
// ------------------------
router.put('/:id', async (req, res) => {
  const userId = req.params.id;
  const { name, email, details, parents_details, subjects, division, standard, subject, teaching_standard, password } = req.body;
  console.log("Update user request for ID:", userId, req.body);

  try {
    // Check if user exists
    const [rows] = await db.promise().query('SELECT * FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      console.log("User not found with ID:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare update fields dynamically. For password, hash it if provided.
    let updateFields = [];
    let params = [];
    if (name) {
      updateFields.push("name = ?");
      params.push(name);
    }
    if (email) {
      updateFields.push("email = ?");
      params.push(email);
    }
    if (details) {
      updateFields.push("details = ?");
      params.push(details);
    }
    if (parents_details) {
      updateFields.push("parents_details = ?");
      params.push(parents_details);
    }
    if (subjects) {
      updateFields.push("subjects = ?");
      params.push(subjects);
    }
    if (division) {
      updateFields.push("division = ?");
      params.push(division);
    }
    if (standard) {
      updateFields.push("standard = ?");
      params.push(standard);
    }
    if (subject) {
      updateFields.push("subject = ?");
      params.push(subject);
    }
    if (teaching_standard) {
      updateFields.push("teaching_standard = ?");
      params.push(teaching_standard);
    }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateFields.push("password = ?");
      params.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const query = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;
    params.push(userId);

    await db.promise().query(query, params);
    console.log("User updated successfully for ID:", userId);
    res.json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ------------------------
// Delete User Endpoint (DELETE /api/users/:id)
// ------------------------
router.delete('/:id', async (req, res) => {
  const userId = req.params.id;
  console.log("Delete user request for ID:", userId);
  try {
    await db.promise().query('DELETE FROM users WHERE id = ?', [userId]);
    console.log("User deleted successfully for ID:", userId);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
});



// GET /api/users/next-teacher-id
router.get('/next-teacher-id', async (req, res) => {
  try {
    // Assumes custom_id for teachers is stored as strings like "T001", "T002", etc.
    const [rows] = await db.promise().query(
      "SELECT MAX(custom_id) as maxId FROM users WHERE role = 'teacher'"
    );
    let nextId = "T001";
    if (rows[0].maxId) {
      const maxNum = parseInt(rows[0].maxId.substring(1), 10);
      const nextNum = maxNum + 1;
      nextId = "T" + String(nextNum).padStart(3, '0');
    }
    res.json({ nextId });
  } catch (error) {
    console.error("Error generating next teacher id:", error);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
