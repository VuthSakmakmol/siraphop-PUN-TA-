const express    = require('express');
const dotenv     = require('dotenv');
const cors       = require('cors');
const path       = require('path');
const connectDB  = require('./config/db');
const seedAdmin  = require('./seeders/adminSeeder');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth',             require('./routes/authRoutes'));
app.use('/api/departments',      require('./routes/departmentRoutes'));
app.use('/api/candidates',       require('./routes/candidateRoutes'));
app.use('/api/job-requisitions', require('./routes/jobRequisitionRoutes'));
app.use('/api/dashboard',        require('./routes/dashboardRoutes'));
app.use('/api/roadmap',          require('./routes/roadmapRoutes'));
app.use('/api/report',           require('./routes/reportRoutes'));

// Frontend serving
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Run server after DB connects
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    console.log('✅ MongoDB connected');
    return seedAdmin(); // only seed after connection
  })
  .then(() => {
    app.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );
  })
  .catch((err) => {
    console.error('❌ Startup error:', err);
    process.exit(1);
  });
