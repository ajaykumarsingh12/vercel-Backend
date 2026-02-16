const mongoose = require('mongoose');
require('dotenv').config();

async function testNotificationCreation() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const Notification = require('./models/Notification');
    const User = require('./models/User');
    const Hall = require('./models/Hall');
    const Booking = require('./models/Booking');
    
    // Step 1: Find hall owner
    console.log('👤 Step 1: Finding hall owner...');
    const hallOwner = await User.findOne({ role: 'hall_owner' });
    if (!hallOwner) {
      console.log('❌ No hall owner found in database');
      console.log('💡 Please create a hall owner account first');
      process.exit(1);
    }
    console.log('✅ Hall Owner found:');
    console.log(`   Name: ${hallOwner.name}`);
    console.log(`   Email: ${hallOwner.email}`);
    console.log(`   ID: ${hallOwner._id}\n`);
    
    // Step 2: Find halls owned by this user
    console.log('🏛️  Step 2: Finding halls owned by this user...');
    const halls = await Hall.find({ owner: hallOwner._id });
    console.log(`✅ Found ${halls.length} hall(s)`);
    if (halls.length > 0) {
      halls.forEach((hall, index) => {
        console.log(`   ${index + 1}. ${hall.name} (ID: ${hall._id})`);
      });
    } else {
      console.log('⚠️  No halls found for this owner');
      console.log('💡 Please add a hall first');
    }
    console.log('');
    
    // Step 3: Find bookings for these halls
    console.log('📅 Step 3: Finding bookings...');
    const hallIds = halls.map(h => h._id);
    const bookings = await Booking.find({ 
      hall: { $in: hallIds },
      paymentStatus: 'paid'
    }).populate('user', 'name email').populate('hall', 'name');
    console.log(`✅ Found ${bookings.length} paid booking(s)`);
    if (bookings.length > 0) {
      bookings.forEach((booking, index) => {
        console.log(`   ${index + 1}. ${booking.user?.name} booked ${booking.hall?.name} - ₹${booking.totalAmount}`);
      });
    } else {
      console.log('⚠️  No paid bookings found');
      console.log('💡 Please complete a booking with payment');
    }
    console.log('');
    
    // Step 4: Check existing notifications
    console.log('🔔 Step 4: Checking existing notifications...');
    const existingNotifications = await Notification.find({ user: hallOwner._id }).sort({ createdAt: -1 });
    console.log(`✅ Found ${existingNotifications.length} notification(s)`);
    if (existingNotifications.length > 0) {
      console.log('\n📬 Latest 3 Notifications:');
      existingNotifications.slice(0, 3).forEach((notif, index) => {
        console.log(`\n   ${index + 1}. ${notif.isRead ? '✓' : '○'} ${notif.message}`);
        console.log(`      Type: ${notif.type}`);
        console.log(`      Created: ${notif.createdAt}`);
        console.log(`      ID: ${notif._id}`);
      });
    } else {
      console.log('⚠️  No notifications found');
    }
    console.log('');
    
    // Step 5: Create test notification
    console.log('🧪 Step 5: Creating test notification...');
    const testNotification = new Notification({
      user: hallOwner._id,
      message: `🧪 TEST NOTIFICATION - Created at ${new Date().toLocaleString('en-IN')}. If you can see this in the UI, the notification system is working!`,
      type: 'payment',
      relatedId: bookings.length > 0 ? bookings[0]._id : null,
      isRead: false
    });
    
    await testNotification.save();
    console.log('✅ Test notification created successfully!');
    console.log(`   Notification ID: ${testNotification._id}`);
    console.log(`   User ID: ${testNotification.user}`);
    console.log(`   Message: ${testNotification.message}`);
    console.log('');
    
    // Step 6: Verify notification was saved
    console.log('✔️  Step 6: Verifying notification in database...');
    const verifyNotif = await Notification.findById(testNotification._id);
    if (verifyNotif) {
      console.log('✅ Notification verified in database');
      console.log(`   User: ${verifyNotif.user}`);
      console.log(`   IsRead: ${verifyNotif.isRead}`);
      console.log(`   Type: ${verifyNotif.type}`);
    } else {
      console.log('❌ Notification not found in database');
    }
    console.log('');
    
    // Step 7: Summary
    console.log('=' .repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Hall Owner: ${hallOwner.name} (${hallOwner.email})`);
    console.log(`Hall Owner ID: ${hallOwner._id}`);
    console.log(`Halls: ${halls.length}`);
    console.log(`Paid Bookings: ${bookings.length}`);
    console.log(`Total Notifications: ${existingNotifications.length + 1}`);
    console.log(`Test Notification ID: ${testNotification._id}`);
    console.log('='.repeat(60));
    console.log('');
    
    console.log('🎯 NEXT STEPS:');
    console.log('1. Login as hall owner: ' + hallOwner.email);
    console.log('2. Check the notification bell icon in navbar');
    console.log('3. You should see a badge with notification count');
    console.log('4. Click the bell to see the test notification');
    console.log('');
    console.log('💡 If you still don\'t see notifications:');
    console.log('   - Check browser console for errors');
    console.log('   - Check Network tab for API calls');
    console.log('   - Verify you\'re logged in as the correct user');
    console.log('   - Make sure user role is "hall_owner"');
    console.log('');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testNotificationCreation();
