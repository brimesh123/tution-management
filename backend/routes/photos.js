// routes/photos.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Setup multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log('Created uploads directory:', uploadPath);
    }
    console.log('Uploading file, destination folder:', uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const finalFilename = uniqueSuffix + '-' + file.originalname;
    console.log('Uploading file, generated filename:', finalFilename);
    cb(null, finalFilename);
  }
});

const upload = multer({ storage: storage });

// Endpoint to upload a photo
router.post('/upload', upload.single('photo'), async (req, res) => {
  console.log('Photo upload request received:', req.file);
  if (!req.file) {
    console.log('No file uploaded');
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const file_url = `/uploads/${req.file.filename}`;
  try {
    const [result] = await db.promise().query(
      'INSERT INTO photos (file_url) VALUES (?)',
      [file_url]
    );
    console.log('Photo record created with ID:', result.insertId);
    res.status(201).json({ message: 'Photo uploaded successfully', photoId: result.insertId, file_url });
  } catch (error) {
    console.error('Error saving photo record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Endpoint to fetch all photos
router.get('/', async (req, res) => {
  console.log('Fetching all photos');
  try {
    const [rows] = await db.promise().query('SELECT * FROM photos');
    console.log('Photos fetched:', rows.length);
    res.json({ photos: rows });
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
