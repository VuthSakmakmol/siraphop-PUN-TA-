const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const seedAdmin = require('./seeders/adminSeeder');
const multer = require('multer');  // <-- Move this here

dotenv.config();
connectDB();
seedAdmin();

const app = express();
app.use(cors());
app.use(express.json());

// Correct path to candidateRoutes.js
const candidateRoutes = require('./routes/candidateRoutes');  // Ensure correct relative path
const jobRequisitionRoutes = require('./routes/jobRequisitionRoutes');

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/departments', require('./routes/departmentRoutes'));
app.use('/api/candidates', candidateRoutes);
app.use('/api/job-requisitions', jobRequisitionRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
