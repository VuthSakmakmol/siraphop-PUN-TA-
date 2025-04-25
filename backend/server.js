const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const seedAdmin = require('./seeders/adminSeeder');

// Load env vars
dotenv.config();

// Connect DB and seed admin
connectDB();
seedAdmin();

// Init app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// ✅ API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/departments', require('./routes/departmentRoutes'));  // Department + Recruiter logic
app.use('/api/candidates', require('./routes/candidateRoutes'));
app.use('/api/job-requisitions', require('./routes/jobRequisitionRoutes'));


const dashboardRoutes = require('./api/dashboard'); // or wherever your file is
app.use('/api/dashboard', dashboardRoutes);


//Roadmap
const roadmapRoutes = require('./routes/roadmapRoutes');
app.use('/api/roadmap', roadmapRoutes);

//Report
const reportRoutes = require('./routes/reportRoutes')
app.use('/api/report', reportRoutes)


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
