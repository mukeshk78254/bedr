const express = require('express');
const tenantController = require('../controllers/tenantController');

const router = express.Router();

router.post('/', tenantController.createTenant);
router.get('/', tenantController.getAllTenants);
router.post('/assign', tenantController.assignTenantToBed);
router.post('/reassign', tenantController.reassignTenant);
router.put('/assignment/:assignment_id/remove', tenantController.removeTenantFromBed);
router.get('/:id', tenantController.getTenantById);
router.put('/:id', tenantController.updateTenant);
router.delete('/:id', tenantController.deleteTenant);

module.exports = router;
