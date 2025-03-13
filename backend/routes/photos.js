// routes/photos.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/authMiddleware');

// Setup multer storage configuration with better organization
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Organize uploads by category and year
    const category = req.body.category || 'general';
    const year = req.body.year || new Date().getFullYear();
    
    const uploadPath = path.join(__dirname, `../public/uploads/${category}/${year}`);
    
    // Create directories if they don't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log('Created uploads directory:', uploadPath);
    }
    
    console.log('Uploading file, destination folder:', uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    const basename = path.basename(file.originalname, extension);
    
    // Sanitize the filename and add unique identifier
    const sanitizedName = basename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const finalFilename = `${sanitizedName}-${uniqueSuffix}${extension}`;
    
    console.log('Uploading file, generated filename:', finalFilename);
    cb(null, finalFilename);
  }
});

// Filter files by type
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

// Configure multer with storage and limits
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  }
});

// Endpoint to upload a photo with enhanced metadata
router.post('/upload', authMiddleware, upload.single('photo'), async (req, res) => {
  console.log('Photo upload request received:', req.file);
  
  if (!req.file) {
    console.log('No file uploaded');
    return res.status(400).json({ message: 'No file uploaded' });
  }
  
  const { category = 'general', year = new Date().getFullYear(), description = '', related_to = '' } = req.body;
  
  // Calculate the file path relative to the uploads directory
  const relativePath = path.relative(
    path.join(__dirname, '../public'),
    req.file.path
  ).replace(/\\/g, '/'); // Convert Windows backslashes to forward slashes if needed
  
  const file_url = `/${relativePath}`;
  
  try {
    const [result] = await db.promise().query(
      'INSERT INTO photos (file_url, category, year, description, related_to) VALUES (?, ?, ?, ?, ?)',
      [file_url, category, year, description, related_to]
    );
    
    console.log('Photo record created with ID:', result.insertId);
    res.status(201).json({
      message: 'Photo uploaded successfully',
      photoId: result.insertId,
      file_url
    });
  } catch (error) {
    console.error('Error saving photo record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Endpoint to fetch photos with filtering
router.get('/', async (req, res) => {
  console.log('Fetching photos with query params:', req.query);
  
  const { category, year, related_to, limit = 20, offset = 0 } = req.query;
  
  let query = 'SELECT * FROM photos WHERE 1=1';
  const params = [];
  
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  
  if (year) {
    query += ' AND year = ?';
    params.push(year);
  }
  
  if (related_to) {
    query += ' AND related_to = ?';
    params.push(related_to);
  }
  
  // Order by most recent first
  query += ' ORDER BY uploaded_at DESC';
  
  // Add pagination
  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  try {
    const [photos] = await db.promise().query(query, params);
    console.log('Photos fetched:', photos.length);
    
    // Get categories and years for filtering
    const [categories] = await db.promise().query(
      'SELECT DISTINCT category FROM photos WHERE category IS NOT NULL'
    );
    
    const [years] = await db.promise().query(
      'SELECT DISTINCT year FROM photos WHERE year IS NOT NULL ORDER BY year DESC'
    );
    
    // Get total count for pagination
    const [countResult] = await db.promise().query(
      `SELECT COUNT(*) as total FROM photos WHERE 1=1
       ${category ? ' AND category = ?' : ''}
       ${year ? ' AND year = ?' : ''}
       ${related_to ? ' AND related_to = ?' : ''}`,
      params.slice(0, -2) // Remove limit and offset from params
    );
    
    res.json({
      photos,
      pagination: {
        total: countResult[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      },
      filters: {
        categories: categories.map(c => c.category),
        years: years.map(y => y.year)
      }
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get last year's result photos
router.get('/results/:year', async (req, res) => {
  const { year } = req.params;
  
  try {
    const [photos] = await db.promise().query(
      'SELECT * FROM photos WHERE category = "results" AND year = ? ORDER BY uploaded_at DESC',
      [year]
    );
    
    res.json({ photos });
  } catch (error) {
    console.error('Error fetching result photos:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single photo by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const [photos] = await db.promise().query('SELECT * FROM photos WHERE id = ?', [id]);
    
    if (photos.length === 0) {
      return res.status(404).json({ message: 'Photo not found' });
    }
    
    res.json({ photo: photos[0] });
  } catch (error) {
    console.error('Error fetching photo:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update photo details
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { category, year, description, related_to } = req.body;
  
  // Only admins and teachers can update photos
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Unauthorized: Only admins and teachers can update photos' });
  }
  
  try {
    // Check if photo exists
    const [photoCheck] = await db.promise().query('SELECT * FROM photos WHERE id = ?', [id]);
    
    if (photoCheck.length === 0) {
      return res.status(404).json({ message: 'Photo not found' });
    }
    
    await db.promise().query(
      'UPDATE photos SET category = ?, year = ?, description = ?, related_to = ? WHERE id = ?',
      [category, year, description, related_to, id]
    );
    
    res.json({ message: 'Photo details updated successfully' });
  } catch (error) {
    console.error('Error updating photo details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a photo
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  
  // Only admins and teachers can delete photos
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Unauthorized: Only admins and teachers can delete photos' });
  }
  
  try {
    // Get the photo details first
    const [photos] = await db.promise().query('SELECT * FROM photos WHERE id = ?', [id]);
    
    if (photos.length === 0) {
      return res.status(404).json({ message: 'Photo not found' });
    }
    
    const photo = photos[0];
    
    // Delete the file from the filesystem
    const filePath = path.join(__dirname, '../public', photo.file_url);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete the record from the database
    await db.promise().query('DELETE FROM photos WHERE id = ?', [id]);
    
    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;