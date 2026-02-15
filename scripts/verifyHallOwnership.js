/**
 * Script to verify hall ownership data integrity
 * Checks if all halls have valid owner references
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Hall = require('../models/Hall');
const User = require('../models/User');

const verifyHallOwnership = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all halls
    const allHalls = await Hall.find().populate('owner', 'name email role');
    console.log(`📊 Total Halls: ${allHalls.length}\n`);

    // Get all hall owners
    const hallOwners = await User.find({ role: 'hall_owner' });
    console.log(`👥 Total Hall Owners: ${hallOwners.length}\n`);

    // Group halls by owner
    const hallsByOwner = {};
    let hallsWithoutOwner = 0;
    let hallsWithInvalidOwner = 0;

    for (const hall of allHalls) {
      if (!hall.owner) {
        hallsWithoutOwner++;
        console.log(`❌ Hall "${hall.name}" (${hall._id}) has NO owner`);
        continue;
      }

      if (!hall.owner._id) {
        hallsWithInvalidOwner++;
        console.log(`❌ Hall "${hall.name}" (${hall._id}) has INVALID owner reference`);
        continue;
      }

      const ownerId = hall.owner._id.toString();
      if (!hallsByOwner[ownerId]) {
        hallsByOwner[ownerId] = {
          ownerName: hall.owner.name,
          ownerEmail: hall.owner.email,
          ownerRole: hall.owner.role,
          halls: []
        };
      }
      hallsByOwner[ownerId].halls.push({
        id: hall._id.toString(),
        name: hall.name,
        isApproved: hall.isApproved
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('📋 HALLS BY OWNER:');
    console.log('='.repeat(80));

    for (const [ownerId, data] of Object.entries(hallsByOwner)) {
      console.log(`\n👤 Owner: ${data.ownerName} (${data.ownerEmail})`);
      console.log(`   Role: ${data.ownerRole}`);
      console.log(`   Owner ID: ${ownerId}`);
      console.log(`   Total Halls: ${data.halls.length}`);
      data.halls.forEach((hall, index) => {
        console.log(`   ${index + 1}. ${hall.name} (${hall.isApproved})`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY:');
    console.log('='.repeat(80));
    console.log(`Total Halls: ${allHalls.length}`);
    console.log(`Unique Owners: ${Object.keys(hallsByOwner).length}`);
    console.log(`Halls without owner: ${hallsWithoutOwner}`);
    console.log(`Halls with invalid owner: ${hallsWithInvalidOwner}`);
    console.log('='.repeat(80) + '\n');

    // Check for potential issues
    if (hallsWithoutOwner > 0 || hallsWithInvalidOwner > 0) {
      console.log('⚠️  WARNING: Some halls have ownership issues!');
      console.log('   These halls may cause problems in "My Halls" page.\n');
    } else {
      console.log('✅ All halls have valid owner references!\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

// Run the script
verifyHallOwnership();
