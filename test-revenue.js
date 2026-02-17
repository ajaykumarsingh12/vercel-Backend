// Test script to check revenue records
require('dotenv').config();
const mongoose = require('mongoose');
const OwnerRevenue = require('./models/OwnerRevenue');

async function testRevenue() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all revenue records
    const allRecords = await OwnerRevenue.find({}).lean();
    console.log('\n📊 TOTAL RECORDS IN DATABASE:', allRecords.length);

    // Group by hall owner
    const byOwner = {};
    allRecords.forEach(record => {
      const ownerId = record.hallOwner.toString();
      if (!byOwner[ownerId]) {
        byOwner[ownerId] = [];
      }
      byOwner[ownerId].push(record);
    });

    console.log('\n👥 RECORDS BY OWNER:');
    Object.keys(byOwner).forEach(ownerId => {
      const records = byOwner[ownerId];
      const total = records.reduce((sum, r) => sum + (r.hallOwnerCommission || 0), 0);
      const completed = records.filter(r => r.status === 'completed');
      
      console.log(`\n  Owner ID: ${ownerId}`);
      console.log(`  Total records: ${records.length}`);
      console.log(`  Completed records: ${completed.length}`);
      console.log(`  Total commission: ₹${total}`);
      console.log(`  Completed commission: ₹${completed.reduce((sum, r) => sum + (r.hallOwnerCommission || 0), 0)}`);
      
      console.log('\n  Record details:');
      records.forEach((r, i) => {
        console.log(`    ${i + 1}. ${r.hallName} - ₹${r.hallOwnerCommission} - Status: ${r.status} - Date: ${r.date.toISOString().split('T')[0]}`);
      });
    });

    // Test the query that the API uses
    console.log('\n\n🔍 TESTING API QUERY:');
    const firstOwnerId = Object.keys(byOwner)[0];
    
    // Query 1: With status filter (what /latest uses)
    const withStatus = await OwnerRevenue.find({
      hallOwner: firstOwnerId,
      status: 'completed'
    }).lean();
    
    console.log(`\n  Query with status='completed': ${withStatus.length} records`);
    console.log(`  Total: ₹${withStatus.reduce((sum, r) => sum + (r.hallOwnerCommission || 0), 0)}`);

    // Query 2: Without status filter (what /all-records uses)
    const withoutStatus = await OwnerRevenue.find({
      hallOwner: firstOwnerId
    }).lean();
    
    console.log(`\n  Query without status filter: ${withoutStatus.length} records`);
    console.log(`  Total: ₹${withoutStatus.reduce((sum, r) => sum + (r.hallOwnerCommission || 0), 0)}`);

    // Check for records with different statuses
    const statuses = {};
    allRecords.forEach(r => {
      statuses[r.status] = (statuses[r.status] || 0) + 1;
    });
    
    console.log('\n📋 RECORDS BY STATUS:');
    Object.keys(statuses).forEach(status => {
      console.log(`  ${status}: ${statuses[status]} records`);
    });

    mongoose.connection.close();
    console.log('\n✅ Test complete');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testRevenue();
