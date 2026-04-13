const pool = require('../config/database');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');


exports.createRoom = asyncHandler(async (req, res) => {
  const { flat_id, name, max_bed_capacity } = req.body;

  if (!flat_id || !name || !max_bed_capacity || max_bed_capacity <= 0) {
    throw new AppError('flat_id, name, and valid max_bed_capacity are required', 400);
  }

 
  const flatCheck = await pool.query('SELECT * FROM flats WHERE id = $1', [flat_id]);
  if (flatCheck.rows.length === 0) {
    throw new AppError('Flat not found', 404);
  }

  const result = await pool.query(
    'INSERT INTO rooms (flat_id, name, max_bed_capacity) VALUES ($1, $2, $3) RETURNING *',
    [flat_id, name, max_bed_capacity]
  );

  res.status(201).json({
    success: true,
    data: result.rows[0]
  });
});


exports.getAllRooms = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT r.*, f.name as flat_name 
     FROM rooms r 
     LEFT JOIN flats f ON r.flat_id = f.id 
     ORDER BY r.flat_id, r.created_at DESC`
  );

  res.json({
    success: true,
    data: result.rows
  });
});


exports.getRoomsByFlat = asyncHandler(async (req, res) => {
  const { flat_id } = req.params;

  const flatCheck = await pool.query('SELECT * FROM flats WHERE id = $1', [flat_id]);
  if (flatCheck.rows.length === 0) {
    throw new AppError('Flat not found', 404);
  }

  const result = await pool.query(
    'SELECT * FROM rooms WHERE flat_id = $1 ORDER BY created_at DESC',
    [flat_id]
  );

  res.json({
    success: true,
    data: result.rows
  });
});


exports.getRoomById = asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM rooms WHERE id = $1',
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Room not found', 404);
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
});


exports.deleteRoom = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const roomCheck = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);
  if (roomCheck.rows.length === 0) {
    throw new AppError('Room not found', 404);
  }

  
  await pool.query('DELETE FROM rooms WHERE id = $1', [id]);

  res.json({
    success: true,
    message: 'Room deleted successfully'
  });
});


exports.updateRoom = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, max_bed_capacity } = req.body;

 
  if (max_bed_capacity) {
    const bedCountResult = await pool.query(
      'SELECT COUNT(*) as bed_count FROM beds WHERE room_id = $1',
      [id]
    );
    const bedCount = parseInt(bedCountResult.rows[0].bed_count);

    if (bedCount > max_bed_capacity) {
      throw new AppError(
        `Cannot reduce capacity below current bed count (${bedCount} beds)`,
        400
      );
    }
  }

  const result = await pool.query(
    'UPDATE rooms SET name = COALESCE($1, name), max_bed_capacity = COALESCE($2, max_bed_capacity), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
    [name, max_bed_capacity, id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Room not found', 404);
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
});
