// index.js or app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (e.g. for photo uploads)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Import route files
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const testsRoutes = require('./routes/tests');
const resultsRoutes = require('./routes/results');
const photosRoutes = require('./routes/photos');
const feedbackRoutes = require('./routes/feedback');
const feesRoutes = require('./routes/fees');
const reportsRoutes = require('./routes/reports');
const usersRoutes = require('./routes/users');
const subjectsRoutes = require('./routes/subjects');


//new
// Add these lines to your existing index.js file after the other route imports

const feeStructuresRoutes = require('./routes/feeStructures');
const studentFeesRoutes = require('./routes/studentFees');
const paymentsRoutes = require('./routes/payments');
const invoicesRoutes = require('./routes/invoices');
const discountsRoutes = require('./routes/discounts');

// Add these lines after your other app.use('/api/...') statements

app.use('/api/fee-structures', feeStructuresRoutes);
app.use('/api/student-fees', studentFeesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/discounts', discountsRoutes);

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/tests', testsRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/photos', photosRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/fees', feesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/subjects', subjectsRoutes);

// Root endpoint for testing
app.get('/', (req, res) => {
  console.log('Received a request at the root endpoint');
  res.send('Backend server is running!');
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
