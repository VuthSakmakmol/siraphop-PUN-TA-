const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  const exists = await Admin.findOne({ email: 'admin@hr.com' });
  if (!exists) {
    const hash = await bcrypt.hash('admin123', 10);
    await Admin.create({
      name: 'Super Admin',
      email: 'admin@hr.com',  
      password: hash,
    });
    console.log('✅ Admin seeded');
  }
};
module.exports = seedAdmin;
