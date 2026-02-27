// Run: node seed.js
// Creates an initial admin user for the Shamil System

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ email: 'admin@shamil.system' });
  if (existing) {
    console.log('Admin user already exists');
    process.exit(0);
  }

  const admin = new User({
    name: 'Admin',
    email: 'admin@shamil.system',
    password: 'admin123',
    role: 'admin',
  });
  await admin.save();

  console.log('Admin user created:');
  console.log('  Email: admin@shamil.system');
  console.log('  Password: admin123');
  console.log('  (Change this password after first login!)');

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
