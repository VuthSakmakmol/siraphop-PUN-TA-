// server.js
const express      = require('express');
const dotenv       = require('dotenv');
const cors         = require('cors');
const path         = require('path');
const connectDB    = require('./config/db');
const seedAdmin    = require('./seeders/adminSeeder');

// Load env vars
dotenv.config();

// Connect & seed
connectDB();
seedAdmin();

const app = express();

// ─── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());


// ─── API ROUTES ────────────────────────────────────────────────────────────────
app.use('/api/auth',             require('./routes/authRoutes'));
app.use('/api/departments',      require('./routes/departmentRoutes'));
app.use('/api/candidates',       require('./routes/candidateRoutes'));
app.use('/api/job-requisitions', require('./routes/jobRequisitionRoutes'));
app.use('/api/dashboard',        require('./routes/dashboardRoutes'));
app.use('/api/roadmap',          require('./routes/roadmapRoutes'));
app.use('/api/report',           require('./routes/reportRoutes'));


// ─── SERVE FRONTEND ─────────────────────────────────────────────────────────────

const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));

// ─── SPA FALLBACK ───────────────────────────────────────────────────────────────
// Option A: regex

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});  

// Option B (alternate): uncomment instead of the regex above
// app.use((req, res) => {
//   res.sendFile(path.join(frontendDist, 'index.html'));
// });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
