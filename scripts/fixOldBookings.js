/**
 * Script to fix old bookings that have paymentStatus="paid" but status="confirmed"
 * This will update them to status="completed" and create revenue records
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const OwnerRevenue = require('../models/OwnerRevenue');
const Hall = require('../models/Hall'); // Ensure Hall model is registered
const User = require('../models/User'); // Ensure User model is registered

const fixOldBookings = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all paid bookings (regardless of status)
    const paidBookings = await Booking.find({
      paymentStatus: 'paid'
    }).populate('hall').populate('user');

    console.log(`\n📊 Found ${paidBookings.length} paid bookings\n`);

    let statusUpdated = 0;
    let revenueCreated = 0;

    for (const booking of paidBookings) {
      console.log(`Processing booking ${booking._id}...`);

      // Update booking status to completed if not already
      if (booking.status !== 'completed') {
        booking.status = 'completed';
        await booking.save();
        statusUpdated++;
        console.log(`  ✅ Updated status to "completed"`);
      } else {
        console.log(`  ℹ️  Already completed`);
      }

      // Check if revenue record already exists
      const existingRevenue = await OwnerRevenue.findOne({ booking: booking._id });

      if (!existingRevenue) {
        // Calculate commission
        const totalAmount = Math.abs(booking.totalAmount);
        const hallOwnerCommission = Math.round(totalAmount * 0.9);
        const platformFee = Math.round(totalAmount * 0.1);

        // Create revenue record with all required fields
        const revenueRecord = new OwnerRevenue({
          booking: booking._id,
          hall: booking.hall._id,
          hallOwner: booking.hall.owner,
          hallName: booking.hall.name,
          customer: booking.user._id,
          customerName: booking.user.name,
          customerEmail: booking.user.email,
          customerPhone: booking.user.phone || 'N/A',
          date: booking.bookingDate,
          startTime: booking.startTime,
          endTime: booking.endTime,
          duration: booking.totalHours,
          totalAmount: totalAmount,
          hallOwnerCommission: hallOwnerCommission,
          platformFee: platformFee,
          status: 'completed',
          transactionId: `TXN_${booking._id}_${Date.now()}`,
          completedAt: booking.updatedAt || new Date(),
          hallLocation: {
            city: booking.hall.location?.city,
            state: booking.hall.location?.state,
            address: booking.hall.location?.address
          },
          specialRequests: booking.specialRequests,
          paymentMethod: 'online'
        });

        await revenueRecord.save();
        revenueCreated++;
        console.log(`  ✅ Created revenue record: ₹${hallOwnerCommission} (Owner) + ₹${platformFee} (Platform)`);
      } else {
        console.log(`  ⚠️  Revenue record already exists`);
      }

      console.log('');
    }

    console.log('\n🎉 Fix Complete!');
    console.log(`✅ Bookings status updated: ${statusUpdated}`);
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
