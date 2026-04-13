const pool = require('../config/database');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');


exports.createFlat = asyncHandler(async (req, res) => {
  const { name, address } = req.body;

  if (!name || !address) {
    throw new AppError('Name and address are required', 400);
  }

  const result = await pool.query(
    'INSERT INTO flats (name, address) VALUES ($1, $2) RETURNING *',
    [name, address]
  );

  res.status(201).json({
    success: true,
    data: result.rows[0]
  });
});


exports.getAllFlats = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM flats ORDER BY created_at DESC');
  
  res.json({
    success: true,
    data: result.rows
  });
});


exports.getFlatById = asyncHandler(async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM flats WHERE id = $1',
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Flat not found', 404);
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
});


exports.deleteFlat = asyncHandler(async (req, res) => {
  const { id } = req.params;

  
  const assignmentCheck = await pool.query(
    `SELECT ta.id FROM tenant_assignments ta
     JOIN beds b ON ta.bed_id = b.id
     JOIN rooms r ON b.room_id = r.id
     WHERE r.flat_id = $1 AND ta.removed_at IS NULL`,
    [id]
  );

  if (assignmentCheck.rows.length > 0) {
    throw new AppError(
      'Cannot delete flat with active tenant assignments. Please remove all tenants first.',
      400
    );
  }

  const flatCheck = await pool.query('SELECT * FROM flats WHERE id = $1', [id]);
  if (flatCheck.rows.length === 0) {
    throw new AppError('Flat not found', 404);
  }

  
  await pool.query('DELETE FROM flats WHERE id = $1', [id]);

  res.json({
    success: true,
    message: 'Flat deleted successfully'
  });
});


exports.updateFlat = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, address } = req.body;

  const result = await pool.query(
    'UPDATE flats SET name = COALESCE($1, name), address = COALESCE($2, address), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
    [name, address, id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Flat not found', 404);
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
});
