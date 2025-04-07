const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      token: generateToken(admin._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
