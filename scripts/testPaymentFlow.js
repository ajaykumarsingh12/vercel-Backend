/**
 * Script to test payment flow and revenue creation
 * This simulates a payment and checks if revenue is created
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const OwnerRevenue = require('../models/OwnerRevenue');
const Hall = require('../models/Hall');
const User = require('../models/User');

const testPaymentFlow = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a paid booking
    const paidBooking = await Booking.findOne({
      paymentStatus: 'paid',
      status: 'completed'
    }).populate('hall').populate('user');

    if (!paidBooking) {
      console.log('❌ No paid bookings found');
      console.log('   Please make a test payment first\n');
      process.exit(0);
    }

    console.log('📋 FOUND PAID BOOKING:');
    console.log('='.repeat(60));
    console.log(`Booking ID: ${paidBooking._id}`);
    console.log(`Hall: ${paidBooking.hall?.name || 'N/A'}`);
    console.log(`Customer: ${paidBooking.user?.name || 'N/A'}`);
    console.log(`Amount: ₹${paidBooking.totalAmount}`);
    console.log(`Payment Status: ${paidBooking.paymentStatus}`);
    console.log(`Booking Status: ${paidBooking.status}`);
    console.log('='.repeat(60) + '\n');

    // Check if revenue exists
    const existingRevenue = await OwnerRevenue.findOne({ 
      booking: paidBooking._id 
    });

    if (existingRevenue) {
      console.log('✅ REVENUE RECORD EXISTS:');
      console.log('='.repeat(60));
      console.log(`Revenue ID: ${existingRevenue._id}`);
      console.log(`Hall Owner Commission: ₹${existingRevenue.hallOwnerCommission}`);
      console.log(`Platform Fee: ₹${existingRevenue.platformFee}`);
      console.log(`Total Amount: ₹${existingRevenue.totalAmount}`);
      console.log(`Status: ${existingRevenue.status}`);
      console.log(`Transaction ID: ${existingRevenue.transactionId}`);
      console.log('='.repeat(60) + '\n');
      
      console.log('🎉 Payment flow is working correctly!\n');
    } else {
      console.log('❌ NO REVENUE RECORD FOUND');
      console.log('='.repeat(60));
      console.log('This means revenue was not created automatically.');
      console.log('Let me try to create it now...\n');

      // Try to create revenue manually
      try {
        const totalAmount = Math.abs(paidBooking.totalAmount);
        const hallOwnerCommission = Math.round(totalAmount * 0.9);
        const platformFee = Math.round(totalAmount * 0.1);

        console.log('💵 CREATING REVENUE RECORD:');
        console.log(`   Total Amount: ₹${totalAmount}`);
        console.log(`   Hall Owner (90%): ₹${hallOwnerCommission}`);
        console.log(`   Platform Fee (10%): ₹${platformFee}`);
        console.log('');

        // Check all required fields
        console.log('📝 CHECKING REQUIRED FIELDS:');
        console.log(`   ✓ Booking ID: ${paidBooking._id}`);
        console.log(`   ✓ Hall ID: ${paidBooking.hall?._id || '❌ MISSING'}`);
        console.log(`   ✓ Hall Name: ${paidBooking.hall?.name || '❌ MISSING'}`);
        console.log(`   ✓ Hall Owner: ${paidBooking.hall?.owner || '❌ MISSING'}`);
        console.log(`   ✓ Customer ID: ${paidBooking.user?._id || '❌ MISSING'}`);
        console.log(`   ✓ Customer Name: ${paidBooking.user?.name || '❌ MISSING'}`);
        console.log(`   ✓ Customer Email: ${paidBooking.user?.email || '❌ MISSING'}`);
        console.log(`   ✓ Customer Phone: ${paidBooking.user?.phone || 'N/A'}`);
        console.log(`   ✓ Date: ${paidBooking.bookingDate}`);
        console.log(`   ✓ Start Time: ${paidBooking.startTime}`);
        console.log(`   ✓ End Time: ${paidBooking.endTime}`);
        console.log(`   ✓ Duration: ${paidBooking.totalHours} hours`);
        console.log('');

        const revenueRecord = new OwnerRevenue({
          booking: paidBooking._id,
          hall: paidBooking.hall._id,
          hallOwner: paidBooking.hall.owner,
          hallName: paidBooking.hall.name,
          customer: paidBooking.user._id,
          customerName: paidBooking.user.name,
          customerEmail: paidBooking.user.email,
          customerPhone: paidBooking.user.phone || 'N/A',
          date: paidBooking.bookingDate,
          startTime: paidBooking.startTime,
          endTime: paidBooking.endTime,
          duration: paidBooking.totalHours,
          totalAmount: totalAmount,
          hallOwnerCommission: hallOwnerCommission,
          platformFee: platformFee,
          status: 'completed',
          transactionId: paidBooking.razorpayPaymentId || `TXN_${paidBooking._id}_${Date.now()}`,
          completedAt: new Date(),
          hallLocation: {
            city: paidBooking.hall.location?.city,
            state: paidBooking.hall.location?.state,
            address: paidBooking.hall.location?.address
          },
          specialRequests: paidBooking.specialRequests,
          paymentMethod: 'online'
        });

        await revenueRecord.save();

        console.log('✅ REVENUE RECORD CREATED SUCCESSFULLY!');
        console.log('='.repeat(60));
        console.log(`Revenue ID: ${revenueRecord._id}`);
        console.log(`Transaction ID: ${revenueRecord.transactionId}`);
        console.log(`Hall Owner Commission: ₹${hallOwnerCommission}`);
        console.log(`Platform Fee: ₹${platformFee}`);
        console.log('='.repeat(60) + '\n');

        console.log('🎉 Revenue created successfully!\n');
        console.log('💡 TIP: Check your Hall Owner Dashboard to see the earnings.\n');

      } catch (createError) {
        console.error('❌ ERROR CREATING REVENUE:');
        console.error('='.repeat(60));
        console.error('Error:', createError.message);
        console.error('Stack:', createError.stack);
        console.error('='.repeat(60) + '\n');
        
        if (createError.name === 'ValidationError') {
          console.log('📋 VALIDATION ERRORS:');
          Object.keys(createError.errors).forEach(field => {
            console.log(`   ❌ ${field}: ${createError.errors[field].message}`);
          });
          console.log('');
        }
      }
    }

    // Show summary
    console.log('📊 SUMMARY:');
    console.log('='.repeat(60));
    const allRevenues = await OwnerRevenue.find({ status: 'completed' });
    const totalRevenue = allRevenues.reduce((sum, rev) => sum + (rev.hallOwnerCommission || 0), 0);
    const totalPlatformFee = allRevenues.reduce((sum, rev) => sum + (rev.platformFee || 0), 0);
    
    console.log(`Total Revenue Records: ${allRevenues.length}`);
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
testPaymentFlow();
