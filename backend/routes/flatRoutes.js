const express = require('express');
const flatController = require('../controllers/flatController');

const router = express.Router();

router.post('/', flatController.createFlat);
router.get('/', flatController.getAllFlats);
router.get('/:id', flatController.getFlatById);
router.put('/:id', flatController.updateFlat);
router.delete('/:id', flatController.deleteFlat);

module.exports = router;
