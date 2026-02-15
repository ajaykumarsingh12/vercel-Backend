/**
 * Script to verify revenue creation for paid bookings
 * Checks if all paid bookings have corresponding revenue records
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import all models BEFORE connecting to ensure they're registered
const Booking = require('../models/Booking');
const OwnerRevenue = require('../models/OwnerRevenue');
const Hall = require('../models/Hall');
const User = require('../models/User');

const verifyRevenueCreation = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Verify models are registered
    console.log('📋 Registered models:', mongoose.modelNames().join(', '));
    console.log('');

    // Find all completed bookings with paid status
    const paidBookings = await Booking.find({
      status: 'completed',
      paymentStatus: 'paid'
    }).populate('hall', 'name owner').populate('user', 'name');

    console.log(`📊 Found ${paidBookings.length} paid bookings\n`);

    let withRevenue = 0;
    let withoutRevenue = 0;
    let missingRevenue = [];

    for (const booking of paidBookings) {
      // Check if revenue record exists
      const revenue = await OwnerRevenue.findOne({ booking: booking._id });

      if (revenue) {
        withRevenue++;
        console.log(`✅ Booking ${booking._id.toString().slice(-6)}: Has revenue (₹${revenue.hallOwnerCommission})`);
      } else {
        withoutRevenue++;
        missingRevenue.push(booking);
        console.log(`❌ Booking ${booking._id.toString().slice(-6)}: Missing revenue (₹${booking.totalAmount})`);
        console.log(`   Hall: ${booking.hall?.name || 'Unknown'}`);
        console.log(`   User: ${booking.user?.name || 'Unknown'}`);
        console.log(`   Date: ${booking.bookingDate?.toLocaleDateString() || 'Unknown'}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY:');
    console.log('='.repeat(60));
    console.log(`Total Paid Bookings: ${paidBookings.length}`);
    console.log(`✅ With Revenue: ${withRevenue}`);
    console.log(`❌ Without Revenue: ${withoutRevenue}`);
    console.log('='.repeat(60));

    if (missingRevenue.length > 0) {
      console.log('\n⚠️  MISSING REVENUE RECORDS:');
      console.log('Run fixOldBookings.js to create missing revenue records');
      console.log('Command: node scripts/fixOldBookings.js\n');
    } else {
      console.log('\n🎉 All paid bookings have revenue records!\n');
    }

    // Calculate total revenue
    const allRevenue = await OwnerRevenue.find({ status: 'completed' });
    const totalRevenue = allRevenue.reduce((sum, rev) => sum + (rev.hallOwnerCommission || 0), 0);
    const totalPlatformFee = allRevenue.reduce((sum, rev) => sum + (rev.platformFee || 0), 0);

    console.log('💰 REVENUE SUMMARY:');
    console.log('='.repeat(60));
    console.log(`Total Revenue Records: ${allRevenue.length}`);
    console.log(`Hall Owner Earnings: ₹${totalRevenue.toLocaleString('en-IN')}`);
    console.log(`Platform Fees: ₹${totalPlatformFee.toLocaleString('en-IN')}`);
    console.log(`Total Processed: ₹${(totalRevenue + totalPlatformFee).toLocaleString('en-IN')}`);
    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Run the script
verifyRevenueCreation();
