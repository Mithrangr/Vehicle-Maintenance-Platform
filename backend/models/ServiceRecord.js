const mongoose = require('mongoose');

const ServiceRecordSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    serviceDate: {
      type: Date,
      required: [true, 'Service date is required'],
      default: Date.now,
    },
    odometerReading: {
      type: Number,
      required: [true, 'Odometer reading is required'],
      min: [0, 'Odometer reading cannot be negative'],
    },
    serviceCategory: {
      type: String,
      required: [true, 'Service category is required'],
      enum: [
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
      ],
    },
    serviceDescription: {
      type: String,
      required: [true, 'Service description is required'],
      trim: true,
    },
    partsReplaced: {
      type: [String],
      default: [],
    },
    cost: {
      type: Number,
      required: [true, 'Cost is required'],
      min: [0, 'Cost cannot be negative'],
    },
    serviceCenter: {
      type: String,
      required: [true, 'Service center name is required'],
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ServiceRecordSchema.index({ vehicle: 1, serviceDate: -1 });

module.exports = mongoose.model('ServiceRecord', ServiceRecordSchema);
