const express = require('express');
const bedController = require('../controllers/bedController');

const router = express.Router();

router.post('/', bedController.createBed);
router.get('/', bedController.getAllBeds);
router.get('/room/:room_id', bedController.getBedsByRoom);
router.get('/:id', bedController.getBedById);
router.put('/:id/status', bedController.updateBedStatus);
router.delete('/:id', bedController.deleteBed);

module.exports = router;
