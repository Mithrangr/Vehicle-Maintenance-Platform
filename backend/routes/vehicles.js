const express = require('express');
const { body } = require('express-validator');
const {
  getVehicles,
  getVehicle,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  updateVehicleTelemetry,
} = require('../controllers/vehicleController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validation');

const router = express.Router();

router.use(protect);

router.post('/:id/telemetry', updateVehicleTelemetry);

router
  .route('/')
  .get(getVehicles)
  .post(
    [
      body('registrationNumber', 'Registration number is required').notEmpty(),
      body('manufacturer', 'Manufacturer is required').notEmpty(),
      body('model', 'Model is required').notEmpty(),
      body('year', 'Valid year is required').isInt({ min: 1900, max: new Date().getFullYear() + 1 }),
      body('fuelType', 'Fuel type must be Petrol, Diesel, Electric, Hybrid, or CNG').isIn([
        'Petrol',
        'Diesel',
        'Electric',
        'Hybrid',
        'CNG',
      ]),
      body('purchaseDate', 'Purchase date is required').isISO8601(),
      body('currentOdometer', 'Current odometer reading is required and must be non-negative').isInt({ min: 0 }),
      body('vehicleType', 'Valid vehicle type is required').isIn([
        'Sedan',
        'SUV',
        'Hatchback',
        'Coupe',
        'Convertible',
        'Minivan',
        'Pickup Truck',
        'Truck',
        'Van',
        'Motorcycle',
        'Other',
      ]),
      validate,
    ],
    addVehicle
  );

router
  .route('/:id')
  .get(getVehicle)
  .put(
    [
      body('registrationNumber', 'Registration number cannot be empty').optional().notEmpty(),
      body('year', 'Valid year is required').optional().isInt({ min: 1900, max: new Date().getFullYear() + 1 }),
      body('currentOdometer', 'Odometer must be non-negative').optional().isInt({ min: 0 }),
      validate,
    ],
    updateVehicle
  )
  .delete(deleteVehicle);

module.exports = router;
