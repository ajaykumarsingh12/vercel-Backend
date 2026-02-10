require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Example: Replace with your actual details
    const adminData = {
      name: 'Ajay Singh',   
      email: 'ajaykumarsingh5963@gmail.com',   
      password: 'Ajay@123', 
      phone: '8081721560',  
      role: 'admin',
      isVerified: true
    };

    // Validate admin data
    if (adminData.email === 'admin@bookmyhall.com' || adminData.password === 'Admin@123456') {
      console.log('\nWARNING: You are using default credentials!');
      console.log('Please edit the script and change the admin details before running.\n');
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('\nAdmin with this email already exists!');
      console.log(`Email: ${existingAdmin.email}`);
      console.log(` Role: ${existingAdmin.role}`);
      console.log(`Name: ${existingAdmin.name}`);
      console.log('\nIf you forgot your password, you can reset it from the admin login page.\n');
      process.exit(1);
    }

    // Create admin user
    const admin = new User(adminData);
    await admin.save();

    console.log('\n SUCCESS! Admin account created!');
    console.log('================================');
    console.log(`Name:  ${admin.name}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Phone: ${admin.phone}`);
    console.log(`Role:  ${admin.role}`);
    console.log('================================');
    console.log('\n NEXT STEPS:');
    console.log('1. Login at: /admin/login');
    console.log('2. Change your password immediately after first login');
    console.log('3. Keep this script secure or delete it');
    console.log('\n✅ You can now access the admin dashboard!\n');

    process.exit(0);
  } catch (error) {
    console.error('\nError creating admin:', error.message);
    if (error.name === 'ValidationError') {
      console.error('\n Validation errors:');
      Object.keys(error.errors).forEach(key => {
        console.error(`   - ${key}: ${error.errors[key].message}`);
      });
    }
    console.log('');
    process.exit(1);
  }
};

// Run the script
createAdmin();
