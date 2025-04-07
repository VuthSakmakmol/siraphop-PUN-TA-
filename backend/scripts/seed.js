const dotenv = require('dotenv');
const connectDB = require('../config/db');
const seedAdmin = require('../seeders/adminSeeder');

dotenv.config();
connectDB().then(async () => {
  await seedAdmin();
  console.log('✅ Seeding complete');
  process.exit();
});
