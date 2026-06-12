const mongoose = require('mongoose');

const PredictionCategorySchema = new mongoose.Schema({
  category: {
    type: String,
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
      'General Vehicle Service'
    ],
    required: true,
  },
  status: {
    type: String,
    enum: ['Healthy', 'Attention Required', 'Maintenance Due Soon', 'Critical'],
    required: true,
    default: 'Healthy',
  },
  lastServiceDate: {
    type: Date,
  },
  lastServiceOdometer: {
    type: Number,
  },
  remainingDistance: {
    type: Number,
    required: true,
  },
  remainingDays: {
    type: Number,
    required: true,
  },
  priorityScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
  },
  healthPercent: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
    default: 100,
  },
  predictedDate: {
    type: Date,
  },
  priorityLevel: {
    type: String,
    enum: ['None', 'Low', 'Medium', 'High', 'Critical'],
    required: true,
    default: 'None',
  },
  estimatedCost: {
    type: Number,
    required: true,
    default: 0,
  },
  recommendedAction: {
    type: String,
  },
  serviceWindow: {
    type: String,
  },
});

const MaintenancePredictionSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
      unique: true, // One prediction record per vehicle
    },
    predictions: [PredictionCategorySchema],
    healthScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 100,
    },
  },
  {
    timestamps: true,
  }
);

MaintenancePredictionSchema.index({ vehicle: 1 });

module.exports = mongoose.model('MaintenancePrediction', MaintenancePredictionSchema);
