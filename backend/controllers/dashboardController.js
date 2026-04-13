const pool = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');

// GET occupancy dashboard
exports.getOccupancyDashboard = asyncHandler(async (req, res) => {
  // Occupancy per flat
  const flatOccupancy = await pool.query(
    `SELECT 
      f.id,
      f.name,
      COUNT(b.id) as total_beds,
      SUM(CASE WHEN b.status = 'Occupied' THEN 1 ELSE 0 END) as occupied_beds,
      SUM(CASE WHEN b.status = 'Under Maintenance' THEN 1 ELSE 0 END) as maintenance_beds,
      SUM(CASE WHEN b.status = 'Available' THEN 1 ELSE 0 END) as available_beds
    FROM flats f
    LEFT JOIN rooms r ON f.id = r.flat_id
    LEFT JOIN beds b ON r.id = b.room_id
    GROUP BY f.id, f.name
    ORDER BY f.name`
  );

  // Occupancy per room
  const roomOccupancy = await pool.query(
    `SELECT 
      r.id,
      r.name,
      r.flat_id,
      r.max_bed_capacity,
      COUNT(b.id) as total_beds,
      SUM(CASE WHEN b.status = 'Occupied' THEN 1 ELSE 0 END) as occupied_beds,
      SUM(CASE WHEN b.status = 'Under Maintenance' THEN 1 ELSE 0 END) as maintenance_beds,
      SUM(CASE WHEN b.status = 'Available' THEN 1 ELSE 0 END) as available_beds
    FROM rooms r
    LEFT JOIN beds b ON r.id = b.room_id
    GROUP BY r.id, r.name, r.flat_id, r.max_bed_capacity
    ORDER BY r.flat_id, r.name`
  );

  // Format response with occupancy percentages
  const flatSummary = flatOccupancy.rows.map(flat => ({
    ...flat,
    total_beds: parseInt(flat.total_beds),
    occupied_beds: parseInt(flat.occupied_beds),
    maintenance_beds: parseInt(flat.maintenance_beds),
    available_beds: parseInt(flat.available_beds),
    occupancy_percentage: flat.total_beds > 0 ? Math.round((parseInt(flat.occupied_beds) / parseInt(flat.total_beds)) * 100) : 0
  }));

  const roomSummary = roomOccupancy.rows.map(room => ({
    ...room,
    total_beds: parseInt(room.total_beds),
    occupied_beds: parseInt(room.occupied_beds),
    maintenance_beds: parseInt(room.maintenance_beds),
    available_beds: parseInt(room.available_beds),
    max_bed_capacity: parseInt(room.max_bed_capacity),
    occupancy_percentage: room.total_beds > 0 ? Math.round((parseInt(room.occupied_beds) / parseInt(room.total_beds)) * 100) : 0
  }));

  res.json({
    success: true,
    data: {
      flat_occupancy: flatSummary,
      room_occupancy: roomSummary
    }
  });
});
