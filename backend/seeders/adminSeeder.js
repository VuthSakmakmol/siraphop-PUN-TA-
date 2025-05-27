const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  try {
    const exists = await Admin.findOne({ email: 'admin@hr.com' });
    if (!exists) {
      const hash = await bcrypt.hash('admin123', 10);
      await Admin.create({
        name: 'Super Admin',
        email: 'admin@hr.com',
        password: hash,
      });
      console.log('✅ Admin seeded');
    } else {
      console.log('ℹ️ Admin already exists');
    }
  } catch (err) {
    console.error('❌ Admin seeding error:', err.message);
  }
};

module.exports = seedAdmin;
