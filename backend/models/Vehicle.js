const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    manufacturer: {
      type: String,
      required: [true, 'Manufacturer is required'],
      trim: true,
    },
    model: {
      type: String,
      required: [true, 'Model is required'],
      trim: true,
    },
    variant: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [1900, 'Year must be after 1900'],
      max: [new Date().getFullYear() + 1, 'Year cannot be in the far future'],
    },
    fuelType: {
      type: String,
      required: [true, 'Fuel type is required'],
      enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'],
    },
    purchaseDate: {
      type: Date,
      required: [true, 'Purchase date is required'],
    },
    currentOdometer: {
      type: Number,
      required: [true, 'Odometer reading is required'],
      min: [0, 'Odometer reading cannot be negative'],
    },
    vehicleType: {
      type: String,
      required: [true, 'Vehicle type is required'],
      enum: ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Minivan', 'Pickup Truck', 'Truck', 'Van', 'Motorcycle', 'Other'],
    },
    telemetry: {
      batteryHealth: { type: Number, default: 100 },
      batteryVoltage: { type: Number, default: 12.6 },
      brakePadWear: { type: Number, default: 0 },
      coolantTemp: { type: Number, default: 90 },
      tirePressure: {
        fl: { type: Number, default: 33 },
        fr: { type: Number, default: 33 },
        rl: { type: Number, default: 33 },
        rr: { type: Number, default: 33 },
      },
      obdDtc: { type: [String], default: [] },
      sensorAlerts: { type: [String], default: [] },
      lastUpdated: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster lookups
VehicleSchema.index({ owner: 1 });
VehicleSchema.index({ registrationNumber: 1 });

module.exports = mongoose.model('Vehicle', VehicleSchema);
