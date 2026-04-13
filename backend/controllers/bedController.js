const pool = require('../config/database');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// CREATE bed
exports.createBed = asyncHandler(async (req, res) => {
  const { room_id } = req.body;

  if (!room_id) {
    throw new AppError('room_id is required', 400);
  }

  // Check if room exists
  const roomCheck = await pool.query('SELECT * FROM rooms WHERE id = $1', [room_id]);
  if (roomCheck.rows.length === 0) {
    throw new AppError('Room not found', 404);
  }

  const room = roomCheck.rows[0];

  // Check bed capacity
  const bedCountResult = await pool.query(
    'SELECT COUNT(*) as bed_count FROM beds WHERE room_id = $1',
    [room_id]
  );
  const bedCount = parseInt(bedCountResult.rows[0].bed_count);

  if (bedCount >= room.max_bed_capacity) {
    throw new AppError(
      `Room has reached maximum bed capacity (${room.max_bed_capacity})`,
      400
    );
  }

  const result = await pool.query(
    'INSERT INTO beds (room_id, status) VALUES ($1, $2) RETURNING *',
    [room_id, 'Available']
  );

  res.status(201).json({
    success: true,
    data: result.rows[0]
  });
});

// GET all beds
exports.getAllBeds = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT b.*, r.name as room_name, f.id as flat_id, f.name as flat_name 
     FROM beds b 
     LEFT JOIN rooms r ON b.room_id = r.id 
     LEFT JOIN flats f ON r.flat_id = f.id 
     ORDER BY b.room_id, b.created_at DESC`
  );

  res.json({
    success: true,
    data: result.rows
  });
});

// GET all beds of a room
exports.getBedsByRoom = asyncHandler(async (req, res) => {
  const { room_id } = req.params;

  // Check if room exists
  const roomCheck = await pool.query('SELECT * FROM rooms WHERE id = $1', [room_id]);
  if (roomCheck.rows.length === 0) {
    throw new AppError('Room not found', 404);
  }

  const result = await pool.query(
    'SELECT b.*, ta.tenant_id FROM beds b LEFT JOIN tenant_assignments ta ON b.id = ta.bed_id AND ta.removed_at IS NULL WHERE b.room_id = $1 ORDER BY b.created_at',
    [room_id]
  );

  res.json({
    success: true,
    data: result.rows
  });
});

// GET single bed
exports.getBedById = asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT b.*, ta.tenant_id FROM beds b LEFT JOIN tenant_assignments ta ON b.id = ta.bed_id AND ta.removed_at IS NULL WHERE b.id = $1',
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Bed not found', 404);
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
});

// DELETE bed
exports.deleteBed = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if bed has active assignment
  const assignmentCheck = await pool.query(
    'SELECT * FROM tenant_assignments WHERE bed_id = $1 AND removed_at IS NULL',
    [id]
  );

  if (assignmentCheck.rows.length > 0) {
    throw new AppError('Cannot delete bed with active tenant assignment', 400);
  }

  // Check if bed exists
  const bedCheck = await pool.query('SELECT * FROM beds WHERE id = $1', [id]);
  if (bedCheck.rows.length === 0) {
    throw new AppError('Bed not found', 404);
  }

  await pool.query('DELETE FROM beds WHERE id = $1', [id]);

  res.json({
    success: true,
    message: 'Bed deleted successfully'
  });
});

// UPDATE bed status
exports.updateBedStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['Available', 'Occupied', 'Under Maintenance'].includes(status)) {
    throw new AppError('Valid status required: Available, Occupied, or Under Maintenance', 400);
  }

  // Check if bed exists
  const bedCheck = await pool.query('SELECT * FROM beds WHERE id = $1', [id]);
  if (bedCheck.rows.length === 0) {
    throw new AppError('Bed not found', 404);
  }

  // if bed is being marked as available, cannot have active assignment
  if (status === 'Available') {
    const assignmentCheck = await pool.query(
      'SELECT * FROM tenant_assignments WHERE bed_id = $1 AND removed_at IS NULL',
      [id]
    );
    if (assignmentCheck.rows.length > 0) {
      throw new AppError('Cannot mark bed as available while it has an active tenant assignment', 400);
    }
  }

  const result = await pool.query(
    'UPDATE beds SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
    [status, id]
  );

  res.json({
    success: true,
    data: result.rows[0]
  });
});
