const pool = require('../config/database');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');


exports.createTenant = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;

  if (!name) {
    throw new AppError('Tenant name is required', 400);
  }

  const result = await pool.query(
    'INSERT INTO tenants (name, email, phone) VALUES ($1, $2, $3) RETURNING *',
    [name, email || null, phone || null]
  );

  res.status(201).json({
    success: true,
    data: result.rows[0]
  });
});


exports.getAllTenants = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT t.*, ta.id as assignment_id, ta.bed_id, b.status as bed_status, r.id as room_id, f.id as flat_id
     FROM tenants t
     LEFT JOIN tenant_assignments ta ON t.id = ta.tenant_id AND ta.removed_at IS NULL
     LEFT JOIN beds b ON ta.bed_id = b.id
     LEFT JOIN rooms r ON b.room_id = r.id
     LEFT JOIN flats f ON r.flat_id = f.id
     ORDER BY t.created_at DESC`
  );

  res.json({
    success: true,
    data: result.rows
  });
});


exports.getTenantById = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT t.*, ta.id as assignment_id, ta.bed_id, b.status as bed_status, r.id as room_id, f.id as flat_id
     FROM tenants t
     LEFT JOIN tenant_assignments ta ON t.id = ta.tenant_id AND ta.removed_at IS NULL
     LEFT JOIN beds b ON ta.bed_id = b.id
     LEFT JOIN rooms r ON b.room_id = r.id
     LEFT JOIN flats f ON r.flat_id = f.id
     WHERE t.id = $1`,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Tenant not found', 404);
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
});


exports.deleteTenant = asyncHandler(async (req, res) => {
  const { id } = req.params;

 
  const assignmentCheck = await pool.query(
    'SELECT * FROM tenant_assignments WHERE tenant_id = $1 AND removed_at IS NULL',
    [id]
  );

  if (assignmentCheck.rows.length > 0) {
    throw new AppError(
      'Cannot delete tenant while they are assigned to a bed. Please remove the assignment first.',
      400
    );
  }

 
  const tenantCheck = await pool.query('SELECT * FROM tenants WHERE id = $1', [id]);
  if (tenantCheck.rows.length === 0) {
    throw new AppError('Tenant not found', 404);
  }

  await pool.query('DELETE FROM tenants WHERE id = $1', [id]);

  res.json({
    success: true,
    message: 'Tenant deleted successfully'
  });
});


exports.updateTenant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;

  const result = await pool.query(
    'UPDATE tenants SET name = COALESCE($1, name), email = COALESCE($2, email), phone = COALESCE($3, phone), updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
    [name, email, phone, id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Tenant not found', 404);
  }

  res.json({
    success: true,
    data: result.rows[0]
  });
});


exports.assignTenantToBed = asyncHandler(async (req, res) => {
  const { tenant_id, bed_id } = req.body;

  if (!tenant_id || !bed_id) {
    throw new AppError('tenant_id and bed_id are required', 400);
  }

  
  const tenantCheck = await pool.query('SELECT * FROM tenants WHERE id = $1', [tenant_id]);
  if (tenantCheck.rows.length === 0) {
    throw new AppError('Tenant not found', 404);
  }


  const bedCheck = await pool.query('SELECT * FROM beds WHERE id = $1', [bed_id]);
  if (bedCheck.rows.length === 0) {
    throw new AppError('Bed not found', 404);
  }

  const bed = bedCheck.rows[0];

  
  if (bed.status === 'Under Maintenance') {
    throw new AppError('Cannot assign tenant to a bed that is Under Maintenance', 400);
  }

  
  if (bed.status === 'Occupied') {
    throw new AppError('Cannot assign tenant to an already Occupied bed', 400);
  }

  const activeTenantAssignment = await pool.query(
    'SELECT * FROM tenant_assignments WHERE tenant_id = $1 AND removed_at IS NULL',
    [tenant_id]
  );

  if (activeTenantAssignment.rows.length > 0) {
    throw new AppError('Tenant already has an active bed assignment', 400);
  }


  const assignmentResult = await pool.query(
    'INSERT INTO tenant_assignments (tenant_id, bed_id) VALUES ($1, $2) RETURNING *',
    [tenant_id, bed_id]
  );

  await pool.query(
    'UPDATE beds SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    ['Occupied', bed_id]
  );

  res.status(201).json({
    success: true,
    data: assignmentResult.rows[0],
    message: 'Tenant assigned to bed successfully'
  });
});

exports.removeTenantFromBed = asyncHandler(async (req, res) => {
  const { assignment_id } = req.params;

  const assignmentCheck = await pool.query(
    'SELECT * FROM tenant_assignments WHERE id = $1 AND removed_at IS NULL',
    [assignment_id]
  );

  if (assignmentCheck.rows.length === 0) {
    throw new AppError('Active assignment not found', 404);
  }

  const assignment = assignmentCheck.rows[0];

 
  const result = await pool.query(
    'UPDATE tenant_assignments SET removed_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
    [assignment_id]
  );

  await pool.query(
    'UPDATE beds SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    ['Available', assignment.bed_id]
  );

  res.json({
    success: true,
    data: result.rows[0],
    message: 'Tenant removed from bed successfully'
  });
});

exports.reassignTenant = asyncHandler(async (req, res) => {
  const { tenant_id, new_bed_id } = req.body;

  if (!tenant_id || !new_bed_id) {
    throw new AppError('tenant_id and new_bed_id are required', 400);
  }

  const newBedCheck = await pool.query('SELECT * FROM beds WHERE id = $1', [new_bed_id]);
  if (newBedCheck.rows.length === 0) {
    throw new AppError('New bed not found', 404);
  }

  const newBed = newBedCheck.rows[0];

 
  if (newBed.status === 'Under Maintenance') {
    throw new AppError('Cannot reassign to a bed that is Under Maintenance', 400);
  }

  if (newBed.status === 'Occupied') {
    throw new AppError('Cannot reassign to an already Occupied bed', 400);
  }


  const activeAssignment = await pool.query(
    'SELECT * FROM tenant_assignments WHERE tenant_id = $1 AND removed_at IS NULL',
    [tenant_id]
  );

  if (activeAssignment.rows.length === 0) {
    throw new AppError('Tenant has no active bed assignment to reassign', 404);
  }

  const oldAssignment = activeAssignment.rows[0];
  const oldBedId = oldAssignment.bed_id;

  
  await pool.query(
    'UPDATE tenant_assignments SET removed_at = CURRENT_TIMESTAMP WHERE id = $1',
    [oldAssignment.id]
  );

 
  await pool.query(
    'UPDATE beds SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    ['Available', oldBedId]
  );


  const newAssignment = await pool.query(
    'INSERT INTO tenant_assignments (tenant_id, bed_id) VALUES ($1, $2) RETURNING *',
    [tenant_id, new_bed_id]
  );

  
  await pool.query(
    'UPDATE beds SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    ['Occupied', new_bed_id]
  );

  res.status(201).json({
    success: true,
    data: newAssignment.rows[0],
    message: 'Tenant reassigned successfully',
    previous_bed_id: oldBedId
  });
});
