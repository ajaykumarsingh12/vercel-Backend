const mongoose = require('mongoose');
require('dotenv').config();

async function createTestNotification() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MongoDB URI not found in .env file');
      console.log('Please set MONGODB_URI in your .env file');
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
    
    const Notification = require('./models/Notification');
    const User = require('./models/User');
    
    // Find hall owner
    console.log('👤 Finding hall owner...');
    const hallOwner = await User.findOne({ role: 'hall_owner' });
    
    if (!hallOwner) {
      console.log('❌ No hall owner found!');
      console.log('💡 Please create a hall owner account first');
      process.exit(1);
    }
    
    console.log('✅ Hall Owner found:');
    console.log(`   Name: ${hallOwner.name}`);
    console.log(`   Email: ${hallOwner.email}`);
    console.log(`   ID: ${hallOwner._id}\n`);
    
    // Create test notification
    console.log('🧪 Creating test notification...');
    const testNotification = new Notification({
      user: hallOwner._id,
      message: `🧪 TEST NOTIFICATION - New booking confirmed! Test User has successfully paid ₹5000 for Test Hall on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} (10:00 AM - 6:00 PM)`,
      type: 'payment',
      isRead: false
    });
    
    await testNotification.save();
    
    console.log('✅ Test notification created successfully!\n');
    console.log('📋 Notification Details:');
    console.log(`   ID: ${testNotification._id}`);
    console.log(`   User ID: ${testNotification.user}`);
    console.log(`   Message: ${testNotification.message}`);
    console.log(`   Type: ${testNotification.type}`);
    console.log(`   IsRead: ${testNotification.isRead}`);
    console.log(`   Created: ${testNotification.createdAt}\n`);
    
    // Verify in database
    const verify = await Notification.findById(testNotification._id);
    if (verify) {
      console.log('✅ Verified in database!\n');
    }
    
    console.log('='.repeat(60));
    console.log('🎯 NEXT STEPS:');
    console.log('='.repeat(60));
    console.log('1. Refresh your app in browser');
    console.log('2. Login as hall owner:', hallOwner.email);
    console.log('3. Look at the notification bell icon');
    console.log('4. You should see a red badge with "1"');
    console.log('5. Click the bell to see the test notification');
    console.log('='.repeat(60));
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

createTestNotification();
