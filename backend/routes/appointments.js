const express = require('express');
const { body } = require('express-validator');
const {
  getAppointments,
  getAppointment,
  bookAppointment,
  rescheduleAppointment,
  cancelAppointment,
  updateAppointmentStatus,
} = require('../controllers/appointmentController');
const { protect, admin } = require('../middleware/auth');
const validate = require('../middleware/validation');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getAppointments)
  .post(
    [
      body('vehicle', 'Vehicle ID is required').isMongoId(),
      body('serviceCategory', 'Service category must be valid').isIn([
        'Engine Oil',
        'Brake Pads',
        'Brake Fluid',
        'Tires',
        'Battery',
        'Coolant',
        'Air Filter',
        'Wiper Blades',
        'First Aid Kit Expiry',
        'General Vehicle Service',
        'Brake System',
        'General Maintenance',
        'Other',
      ]),
      body('appointmentDate', 'Valid future appointment date is required').isISO8601(),
      validate,
    ],
    bookAppointment
  );

router.route('/:id').get(getAppointment);

router.put(
  '/:id/reschedule',
  [
    body('appointmentDate', 'Valid future appointment date is required').isISO8601(),
    validate,
  ],
  rescheduleAppointment
);

router.put('/:id/cancel', cancelAppointment);

// Admin-only route to update appointment status
router.put('/:id/status', admin, updateAppointmentStatus);

module.exports = router;
