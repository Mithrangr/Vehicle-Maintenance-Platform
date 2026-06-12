const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    serviceCategory: {
      type: String,
      required: [true, 'Service category is required'],
      enum: [
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
        'Other'
      ],
    },
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date and time are required'],
      min: [new Date(), 'Appointment date cannot be in the past'],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

AppointmentSchema.index({ user: 1, appointmentDate: 1 });
AppointmentSchema.index({ status: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);
