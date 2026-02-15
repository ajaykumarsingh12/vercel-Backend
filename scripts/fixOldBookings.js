/**
 * Script to fix old bookings that have paymentStatus="paid" but status="confirmed"
 * This will update them to status="completed" and create revenue records
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const OwnerRevenue = require('../models/OwnerRevenue');

const fixOldBookings = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all bookings that are paid but not completed
    const oldBookings = await Booking.find({
      paymentStatus: 'paid',
      status: { $ne: 'completed' }
    }).populate('hall');

    console.log(`\n📊 Found ${oldBookings.length} bookings to fix\n`);

    let fixed = 0;
    let revenueCreated = 0;

    for (const booking of oldBookings) {
      console.log(`Processing booking ${booking._id}...`);

      // Update booking status to completed
      booking.status = 'completed';
      await booking.save();
      fixed++;
      console.log(`  ✅ Updated status to "completed"`);

      // Check if revenue record already exists
      const existingRevenue = await OwnerRevenue.findOne({ booking: booking._id });

      if (!existingRevenue) {
        // Calculate commission
        const totalAmount = Math.abs(booking.totalAmount);
        const hallOwnerCommission = Math.round(totalAmount * 0.9);
        const platformFee = Math.round(totalAmount * 0.1);

        // Create revenue record
        const revenueRecord = new OwnerRevenue({
          booking: booking._id,
          hall: booking.hall._id,
          hallOwner: booking.hall.owner || booking.hall._id,
          totalAmount: totalAmount,
          hallOwnerCommission: hallOwnerCommission,
          platformFee: platformFee,
          status: 'completed',
          transactionId: `TXN_${booking._id}_${Date.now()}`,
          paymentDate: booking.updatedAt || new Date(),
          settlementStatus: 'pending',
        });

        await revenueRecord.save();
        revenueCreated++;
        console.log(`  ✅ Created revenue record: ₹${hallOwnerCommission}`);
      } else {
        console.log(`  ⚠️  Revenue record already exists`);
      }

      console.log('');
    }

    console.log('\n🎉 Fix Complete!');
    console.log(`✅ Bookings updated: ${fixed}`);
    console.log(`✅ Revenue records created: ${revenueCreated}`);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Run the script
fixOldBookings();
