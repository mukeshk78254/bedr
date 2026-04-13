const pool = require('../config/database');

async function seedDatabase() {
  try {
    console.log(' Starting comprehensive database seed...\n');


    console.log(' Cleaning existing data...');
    await pool.query('DELETE FROM tenant_assignments');
    await pool.query('DELETE FROM beds');
    await pool.query('DELETE FROM rooms');
    await pool.query('DELETE FROM tenants');
    await pool.query('DELETE FROM flats');
    console.log('   ✓ Cleanup complete\n');

    console.log(' Creating Flats...');
    const flatRes = await pool.query(
      `INSERT INTO flats (name, address) VALUES 
       ($1, $2),
       ($3, $4),
       ($5, $6)
       RETURNING id, name`,
      [
        'Crystal Residency', '456 Oak Ave, Manhattan, NY',
        'Marina Towers', '789 Sea Blvd, Miami, FL',
        'Sunset Heights', '321 Golden Gate Ave, San Francisco, CA'
      ]
    );
    const flats = flatRes.rows;
    console.log(`   ✓ Created ${flats.length} flats`);
    flats.forEach(f => console.log(`     Flat#${f.id}: ${f.name}`));

 
    console.log('\n Creating Rooms...');
    const flatIds = flats.map(f => f.id);
    const roomRes = await pool.query(
      `INSERT INTO rooms (flat_id, name, max_bed_capacity) VALUES 
       ($1, $2, $3),
       ($4, $5, $6),
       ($7, $8, $9),
       ($10, $11, $12),
       ($13, $14, $15),
       ($16, $17, $18),
       ($19, $20, $21)
       RETURNING id, flat_id, name, max_bed_capacity`,
      [
        
        flatIds[0], 'Penthouse Suite', 4,
        flatIds[0], 'Premium Double', 2,
        flatIds[0], 'Standard Single', 1,
      
        flatIds[1], 'Oceanview Suite', 3,
        flatIds[1], 'Beachfront Room', 2,
    
        flatIds[2], 'Garden Suite', 3,
        flatIds[2], 'City View Room', 2
      ]
    );
    const rooms = roomRes.rows;
    console.log(`   ✓ Created ${rooms.length} rooms`);
    rooms.forEach(r => console.log(`     Room#${r.id}: ${r.name} (Flat#${r.flat_id}, Cap: ${r.max_bed_capacity})`));


    console.log('\n  Creating Beds...');
    const roomIds = rooms.map(r => r.id);
    const bedRes = await pool.query(
      `INSERT INTO beds (room_id, status) VALUES 
       ($1, $2), ($3, $4), ($5, $6), ($7, $8),
       ($9, $10), ($11, $12),
       ($13, $14),
       ($15, $16), ($17, $18), ($19, $20),
       ($21, $22), ($23, $24),
       ($25, $26), ($27, $28), ($29, $30), ($31, $32), ($33, $34)
       RETURNING id, room_id, status`,
      [
   
        roomIds[0], 'Occupied', roomIds[0], 'Occupied', roomIds[0], 'Available', roomIds[0], 'Available',

        roomIds[1], 'Occupied', roomIds[1], 'Under Maintenance',
       
        roomIds[2], 'Available',
     
        roomIds[3], 'Occupied', roomIds[3], 'Occupied', roomIds[3], 'Available',
        
        roomIds[4], 'Occupied', roomIds[4], 'Available',
     
        roomIds[5], 'Occupied', roomIds[5], 'Available', roomIds[5], 'Under Maintenance',
      
        roomIds[6], 'Available', roomIds[6], 'Available'
      ]
    );
    const beds = bedRes.rows;
    console.log(`   ✓ Created ${beds.length} beds`);
    
    // Group beds by status for summary
    const bedStats = {
      Occupied: beds.filter(b => b.status === 'Occupied').length,
      Available: beds.filter(b => b.status === 'Available').length,
      'Under Maintenance': beds.filter(b => b.status === 'Under Maintenance').length
    };
    console.log(`     Status: ${bedStats.Occupied} Occupied | ${bedStats.Available} Available | ${bedStats['Under Maintenance']} Under Maintenance`);

    // ===== TENANTS (12 TENANTS - MIX OF ASSIGNED AND UNASSIGNED) =====
    console.log('\n Creating Tenants...');
    const tenantRes = await pool.query(
      `INSERT INTO tenants (name, email, phone) VALUES 
       ($1, $2, $3), ($4, $5, $6), ($7, $8, $9), ($10, $11, $12),
       ($13, $14, $15), ($16, $17, $18), ($19, $20, $21), ($22, $23, $24),
       ($25, $26, $27), ($28, $29, $30), ($31, $32, $33), ($34, $35, $36)
       RETURNING id, name, email`,
      [
        
        'John Doe', 'john.doe@email.com', '555-0001',
        'Sarah Smith', 'sarah.smith@email.com', '555-0002',
        'Mike Johnson', 'mike.johnson@email.com', '555-0003',
        'Emma Wilson', 'emma.wilson@email.com', '555-0004',
        'David Brown', 'david.brown@email.com', '555-0005',
        'Lisa Garcia', 'lisa.garcia@email.com', '555-0006',
        'James Martinez', 'james.martinez@email.com', '555-0007',
        'Rachel Lee', 'rachel.lee@email.com', '555-0008',
    
        'Alex Chen', 'alex.chen@email.com', '555-0009',
        'Patricia Martin', 'patricia.martin@email.com', '555-0010',
        'Robert Taylor', 'robert.taylor@email.com', '555-0011',
        'Jessica Anderson', 'jessica.anderson@email.com', '555-0012'
      ]
    );
    const tenants = tenantRes.rows;
    console.log(`   ✓ Created ${tenants.length} tenants`);
    console.log(`     Assigned: 8 | Waiting: 4`);
    tenants.slice(0, 8).forEach(t => console.log(`     ✓ ${t.name}`));
    console.log('     ------ Waiting for Assignment ------');
    tenants.slice(8).forEach(t => console.log(`      ${t.name}`));

  
    console.log('\n Creating Tenant Assignments...');
    const tenantIds = tenants.slice(0, 8).map(t => t.id);
    const assignmentRes = await pool.query(
      `INSERT INTO tenant_assignments (tenant_id, bed_id) VALUES 
       ($1, $2), ($3, $4), ($5, $6), ($7, $8),
       ($9, $10), ($11, $12), ($13, $14), ($15, $16)
       RETURNING id, tenant_id, bed_id, assigned_at`,
      [
        tenantIds[0], beds[0].id,
        tenantIds[1], beds[1].id,   
        tenantIds[2], beds[4].id,    
        tenantIds[3], beds[7].id,    
        tenantIds[4], beds[8].id,    
        tenantIds[5], beds[10].id,   
        tenantIds[6], beds[12].id, 
        tenantIds[7], beds[15].id    
      ]
    );
    const assignments = assignmentRes.rows;
    console.log(`   ✓ Created ${assignments.length} assignments`);
    assignments.forEach(a => {
      const tenant = tenants.find(t => t.id === a.tenant_id);
      const bed = beds.find(b => b.id === a.bed_id);
      if (tenant && bed) {
        console.log(`     Tenant#${a.tenant_id}: ${tenant.name} → Bed#${a.bed_id} (Room#${bed.room_id})`);
      } else if (tenant) {
        console.log(`     Tenant#${a.tenant_id}: ${tenant.name} → Bed#${a.bed_id}`);
      }
    });

    // ===== DISPLAY COMPREHENSIVE SUMMARY =====
    console.log('\n' + '='.repeat(70));
    console.log('DATABASE SEED COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(70));

    // Get final stats
    const statsRes = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM flats) as flat_count,
        (SELECT COUNT(*) FROM rooms) as room_count,
        (SELECT COUNT(*) FROM beds) as bed_count,
        (SELECT COUNT(*) FROM tenants) as tenant_count,
        (SELECT COUNT(*) FROM tenant_assignments WHERE removed_at IS NULL) as active_assignments
    `);
    const stats = statsRes.rows[0];

    console.log('\n DATABASE SNAPSHOT:');
    console.log(`    Total Flats: ${stats.flat_count}`);
    console.log(`    Total Rooms: ${stats.room_count}`);
    console.log(`     Total Beds: ${stats.bed_count}`);
    console.log(`    Total Tenants: ${stats.tenant_count}`);
    console.log(`    Active Assignments: ${stats.active_assignments}`);

    // Detailed occupancy by flat
    console.log('\n\n OCCUPANCY BY FLAT:');
    const occupancyRes = await pool.query(`
      SELECT 
        f.id,
        f.name as flat_name,
        COUNT(b.id) as total_beds,
        SUM(CASE WHEN b.status = 'Occupied' THEN 1 ELSE 0 END) as occupied,
        SUM(CASE WHEN b.status = 'Available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN b.status = 'Under Maintenance' THEN 1 ELSE 0 END) as maintenance,
        ROUND(100.0 * SUM(CASE WHEN b.status = 'Occupied' THEN 1 ELSE 0 END) / COUNT(b.id)) as occupancy_percent
      FROM flats f
      LEFT JOIN rooms r ON f.id = r.flat_id
      LEFT JOIN beds b ON r.id = b.room_id
      GROUP BY f.id, f.name
      ORDER BY f.id
    `);

    occupancyRes.rows.forEach(row => {
      const bar = '█'.repeat(Math.round(row.occupancy_percent / 5)) + '░'.repeat(20 - Math.round(row.occupancy_percent / 5));
      console.log(`\n   Flat#${row.id}: ${row.flat_name}`);
      console.log(`   Beds: ${row.occupied + row.available + row.maintenance} | Occupied: ${row.occupied} | Available: ${row.available} | Maintenance: ${row.maintenance}`);
      console.log(`   Occupancy: [${bar}] ${row.occupancy_percent}%`);
    });


    console.log('\n\n OCCUPANCY BY ROOM:');
    const roomOccupancyRes = await pool.query(`
      SELECT 
        r.id,
        r.name as room_name,
        f.name as flat_name,
        r.max_bed_capacity,
        COUNT(b.id) as total_beds,
        SUM(CASE WHEN b.status = 'Occupied' THEN 1 ELSE 0 END) as occupied,
        SUM(CASE WHEN b.status = 'Available' THEN 1 ELSE 0 END) as available
      FROM rooms r
      LEFT JOIN flats f ON r.flat_id = f.id
      LEFT JOIN beds b ON r.id = b.room_id
      GROUP BY r.id, r.name, f.name, r.max_bed_capacity
      ORDER BY r.flat_id, r.id
    `);

    roomOccupancyRes.rows.forEach(row => {
      const capacity = row.max_bed_capacity;
      const used = row.occupied + row.available;
      console.log(`   Room#${row.id}: ${row.room_name} (${row.flat_name})`);
      console.log(`      Capacity: ${used}/${capacity} | Occupied: ${row.occupied} | Available: ${row.available}`);
    });

    console.log('\n\n TENANT ASSIGNMENTS:');
    const tenantAssignmentRes = await pool.query(`
      SELECT 
        t.id,
        t.name,
        b.id as bed_id,
        b.status as bed_status,
        r.name as room_name,
        f.name as flat_name
      FROM tenants t
      LEFT JOIN tenant_assignments ta ON t.id = ta.tenant_id AND ta.removed_at IS NULL
      LEFT JOIN beds b ON ta.bed_id = b.id
      LEFT JOIN rooms r ON b.room_id = r.id
      LEFT JOIN flats f ON r.flat_id = f.id
      ORDER BY t.id
    `);

    tenantAssignmentRes.rows.forEach(row => {
      if (row.bed_id) {
        console.log(`   Tenant#${row.id}: ${row.name} → Bed#${row.bed_id} | ${row.room_name} | ${row.flat_name}`);
      } else {
        console.log(`   Tenant#${row.id}: ${row.name} → ⏳ UNASSIGNED`);
      }
    });

 
    console.log('\n\n🌐 API ENDPOINTS TO TEST:');
    console.log('   GET  http://localhost:5000/api/flats');
    console.log('   GET  http://localhost:5000/api/flats/1');
    console.log('   GET  http://localhost:5000/api/rooms/flat/1');
    console.log('   GET  http://localhost:5000/api/beds/room/1');
    console.log('   GET  http://localhost:5000/api/tenants');
    console.log('   GET  http://localhost:5000/api/dashboard/occupancy');
    console.log('   POST http://localhost:5000/api/tenants/assign (with tenant_id & bed_id)');

    console.log('\nDatabase ready for testing!\n');
    process.exit(0);
  } catch (error) {
    console.error(' Seed failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedDatabase();
