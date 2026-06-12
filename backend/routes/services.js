const express = require('express');
const { body } = require('express-validator');
const {
  getServices,
  getVehicleServices,
  getService,
  addService,
  editService,
  deleteService,
} = require('../controllers/serviceController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validation');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getServices)
  .post(
    [
      body('vehicle', 'Vehicle ID is required').isMongoId(),
      body('serviceDate', 'Service date is required').isISO8601(),
      body('odometerReading', 'Odometer reading is required and must be non-negative').isInt({ min: 0 }),
      body('serviceCategory', 'Service category must be a valid component or maintenance classification').isIn([
        'Engine Oil',
        'Brake Pads',
        'Brake Fluid',
        'Battery',
        'Coolant',
        'Air Filter',
        'Tires',
        'Wiper Blades',
        'First Aid Kit Expiry',
        'General Vehicle Service',
        'Other',
      ]),
      body('serviceDescription', 'Service description is required').notEmpty(),
      body('cost', 'Cost is required and must be non-negative').isFloat({ min: 0 }),
      body('serviceCenter', 'Service center is required').notEmpty(),
      validate,
    ],
    addService
  );

router.get('/vehicle/:vehicleId', getVehicleServices);

router
  .route('/:id')
  .get(getService)
  .put(
    [
      body('odometerReading', 'Odometer reading must be non-negative').optional().isInt({ min: 0 }),
      body('cost', 'Cost must be non-negative').optional().isFloat({ min: 0 }),
      validate,
    ],
    editService
  )
  .delete(deleteService);

module.exports = router;
