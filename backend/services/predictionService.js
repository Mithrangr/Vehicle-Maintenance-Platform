const Vehicle = require('../models/Vehicle');
const ServiceRecord = require('../models/ServiceRecord');
const MaintenancePrediction = require('../models/MaintenancePrediction');
const Notification = require('../models/Notification');

// Maintenance Rules & Calibration Data
const MAINTENANCE_INTERVALS = {
  'Engine Oil': { distance: 10000, type: 'distance', cost: 4500 },
  'Brake Pads': { distance: 20000, type: 'distance', cost: 8500 },
  'Brake Fluid': { days: 730, type: 'time', cost: 1800 }, // 2 years
  'Tires': { distance: 15000, type: 'distance', cost: 24000 },
  'Battery': { days: 1095, type: 'time', cost: 5500 }, // 3 years
  'Coolant': { days: 730, type: 'time', cost: 2500 }, // 2 years
  'Air Filter': { days: 365, type: 'time', cost: 1200 }, // 1 year
  'Wiper Blades': { days: 180, type: 'time', cost: 800 }, // 6 months
  'First Aid Kit Expiry': { days: 1825, type: 'time', cost: 500 }, // 5 years
  'General Vehicle Service': { distance: 10000, days: 365, type: 'hybrid', cost: 6500 }, // 1 year or 10k km
};

/**
 * Calculates predictions for all components and the overall health score of a vehicle.
 * @param {string} vehicleId - The MongoDB ID of the vehicle.
 * @returns {Promise<Object>} - The updated or created MaintenancePrediction document.
 */
const calculatePrediction = async (vehicleId) => {
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    throw new Error('Vehicle not found');
  }

  const serviceRecords = await ServiceRecord.find({ vehicle: vehicleId }).sort({ serviceDate: -1 });
  const predictions = [];
  const currentDate = new Date();

  const categories = Object.keys(MAINTENANCE_INTERVALS);

  for (const category of categories) {
    // Find the latest service record matching this category
    const lastService = serviceRecords.find(r => r.serviceCategory === category);

    let lastServiceDate = vehicle.purchaseDate;
    let lastServiceOdometer = 0;

    if (lastService) {
      lastServiceDate = lastService.serviceDate;
      lastServiceOdometer = lastService.odometerReading;
    }

    const interval = MAINTENANCE_INTERVALS[category];
    const distanceTravelled = vehicle.currentOdometer - lastServiceOdometer;
    const timeElapsedMs = currentDate - new Date(lastServiceDate);
    const daysElapsed = Math.floor(timeElapsedMs / (1000 * 60 * 60 * 24));

    let remainingDistance = 999999;
    let remainingDays = 999999;
    let healthPercent = 100;

    if (interval.type === 'distance' || interval.type === 'hybrid') {
      remainingDistance = Math.max(0, interval.distance - distanceTravelled);
    }
    if (interval.type === 'time' || interval.type === 'hybrid') {
      remainingDays = Math.max(0, interval.days - daysElapsed);
    }

    // 1. Calculate remaining useful life percentage (RUL)
    if (interval.type === 'distance') {
      healthPercent = Math.round((remainingDistance / interval.distance) * 100);
    } else if (interval.type === 'time') {
      healthPercent = Math.round((remainingDays / interval.days) * 100);
    } else if (interval.type === 'hybrid') {
      const distPercent = (remainingDistance / interval.distance) * 100;
      const timePercent = (remainingDays / interval.days) * 100;
      healthPercent = Math.round(Math.min(distPercent, timePercent));
    }
    healthPercent = Math.max(0, Math.min(100, healthPercent));

    // 2. Classify Health States
    let status = 'Healthy';
    if (healthPercent <= 10 || (interval.type === 'distance' && remainingDistance <= 0) || (interval.type === 'time' && remainingDays <= 0) || (interval.type === 'hybrid' && (remainingDistance <= 0 || remainingDays <= 0))) {
      status = 'Critical';
      healthPercent = 0; // force zero health if overdue/exceeded
    } else if (healthPercent <= 25) {
      status = 'Maintenance Due Soon';
    } else if (healthPercent <= 50) {
      status = 'Attention Required';
    }

    // 3. Telemetry and Connected Sensor Integrations (override status based on diagnostics)
    if (vehicle.telemetry) {
      const tel = vehicle.telemetry;
      if (category === 'Battery') {
        if (tel.batteryHealth < 50 || (tel.batteryVoltage !== undefined && tel.batteryVoltage < 11.5)) {
          status = 'Critical';
          healthPercent = Math.min(healthPercent, 5);
        } else if (tel.batteryHealth < 70 || (tel.batteryVoltage !== undefined && tel.batteryVoltage < 12.0)) {
          if (status === 'Healthy' || status === 'Attention Required') {
            status = 'Maintenance Due Soon';
            healthPercent = Math.min(healthPercent, 20);
          }
        }
      }
      if (category === 'Brake Pads') {
        if (tel.brakePadWear > 90) {
          status = 'Critical';
          healthPercent = Math.min(healthPercent, 5);
        } else if (tel.brakePadWear > 70) {
          if (status === 'Healthy' || status === 'Attention Required') {
            status = 'Maintenance Due Soon';
            healthPercent = Math.min(healthPercent, 20);
          }
        }
      }
      if (category === 'Coolant') {
        if (tel.coolantTemp > 105) {
          status = 'Critical';
          healthPercent = 0;
        } else if (tel.coolantTemp > 98) {
          if (status === 'Healthy') {
            status = 'Attention Required';
            healthPercent = Math.min(healthPercent, 45);
          }
        }
      }
      if (category === 'Tires') {
        // If low pressure detected
        const pressureIssue = tel.tirePressure && (
          tel.tirePressure.fl < 26 || tel.tirePressure.fr < 26 ||
          tel.tirePressure.rl < 26 || tel.tirePressure.rr < 26
        );
        if (pressureIssue) {
          if (status === 'Healthy') {
            status = 'Attention Required';
            healthPercent = Math.min(healthPercent, 40);
          }
        }
      }
    }

    // 4. Determine Priority Level
    let priorityLevel = 'None';
    let priorityScore = 0;

    if (status === 'Critical') {
      priorityLevel = 'Critical';
      priorityScore = 100;
    } else if (status === 'Maintenance Due Soon') {
      // Medium if distance is short or days are short
      const isShortDistance = (interval.type === 'distance' || interval.type === 'hybrid') && remainingDistance <= 1000;
      const isShortTime = (interval.type === 'time' || interval.type === 'hybrid') && remainingDays <= 30;

      if (isShortDistance || isShortTime) {
        priorityLevel = 'Medium';
        priorityScore = 75;
      } else {
        priorityLevel = 'Low';
        priorityScore = 50;
      }
    } else if (status === 'Attention Required') {
      priorityLevel = 'Low';
      priorityScore = 30;
    }

    // 5. Custom recommended action messages
    let recommendedAction = 'No action required at this time.';
    let message = `${category} is in normal operational status.`;
    let serviceWindow = 'Within standard interval';

    if (status === 'Critical') {
      serviceWindow = 'Immediate action';
      if (category === 'Engine Oil') {
        message = 'Engine Oil change is critical!';
        recommendedAction = 'Immediate workshop visit advised for oil change.';
      } else if (category === 'Brake Pads') {
        message = 'Brake pads worn out completely!';
        recommendedAction = 'Replace brake pads immediately. Squeaking noise reported.';
      } else if (category === 'Battery') {
        message = 'Battery failure imminent!';
        recommendedAction = 'Replace vehicle battery immediately to avoid ignition breakdown.';
      } else if (category === 'Coolant') {
        message = 'Engine coolant replacement overdue!';
        recommendedAction = 'Flush cooling system and replace coolant immediately to prevent overheating.';
      } else if (category === 'Tires') {
        message = 'Tire replacement required!';
        recommendedAction = 'Install new tires immediately. Tread wear exceeded safety limit.';
      } else {
        message = `${category} requires critical maintenance!`;
        recommendedAction = `Immediate service for ${category.toLowerCase()} is required.`;
      }
    } else if (status === 'Maintenance Due Soon') {
      serviceWindow = 'Within 2 weeks';
      if (category === 'Engine Oil') {
        message = 'Engine Oil Change Recommended';
        recommendedAction = 'Schedule oil change service with authorized dealership.';
      } else if (category === 'Brake Pads') {
        message = 'Brake Inspection Due Soon';
        recommendedAction = 'Schedule front brake inspection soon.';
      } else if (category === 'Battery') {
        message = 'Battery Health Degrading';
        recommendedAction = 'Get battery test and inspection done.';
      } else if (category === 'Tires') {
        message = 'Tire Rotation Recommended';
        recommendedAction = 'Rotate tires to ensure even wear patterns.';
      } else {
        message = `${category} service approaching threshold`;
        recommendedAction = `Schedule ${category.toLowerCase()} maintenance.`;
      }
    } else if (status === 'Attention Required') {
      serviceWindow = 'Within 1 month';
      message = `${category} approaching standard limits`;
      recommendedAction = `Inspect ${category.toLowerCase()} during your next vehicle checkup.`;
    }

    // Calculated predicted maintenance date
    const predictedDate = new Date();
    if (interval.type === 'distance' || interval.type === 'hybrid') {
      // estimate remaining days based on average of 40 km per day if odometer usage is normal
      const estDaysLeft = Math.round(remainingDistance / 40);
      predictedDate.setDate(predictedDate.getDate() + Math.min(365, estDaysLeft));
    } else {
      predictedDate.setDate(predictedDate.getDate() + remainingDays);
    }

    predictions.push({
      category,
      status,
      lastServiceDate,
      lastServiceOdometer,
      remainingDistance: remainingDistance === 999999 ? 0 : remainingDistance,
      remainingDays: remainingDays === 999999 ? 0 : remainingDays,
      priorityScore,
      healthPercent,
      predictedDate,
      priorityLevel,
      estimatedCost: interval.cost,
      recommendedAction,
      serviceWindow,
    });
  }

  // 6. Overall Health Score (0-100)
  let sumHealth = 0;
  let criticalCount = 0;
  let dueSoonCount = 0;
  let attentionCount = 0;

  predictions.forEach(p => {
    sumHealth += p.healthPercent;
    if (p.status === 'Critical') criticalCount++;
    if (p.status === 'Maintenance Due Soon') dueSoonCount++;
    if (p.status === 'Attention Required') attentionCount++;
  });

  let healthScore = Math.round(sumHealth / predictions.length);
  // Apply penalties to force scores into accurate bins
  healthScore -= (criticalCount * 20) + (dueSoonCount * 8) + (attentionCount * 3);
  healthScore = Math.max(0, Math.min(100, healthScore));

  // Save predictions
  let predictionRecord = await MaintenancePrediction.findOne({ vehicle: vehicleId });
  if (predictionRecord) {
    predictionRecord.predictions = predictions;
    predictionRecord.healthScore = healthScore;
    await predictionRecord.save();
  } else {
    predictionRecord = await MaintenancePrediction.create({
      vehicle: vehicleId,
      predictions,
      healthScore,
    });
  }

  // Trigger Notifications
  await checkAndCreateNotifications(vehicle, predictions);

  return predictionRecord;
};

/**
 * Checks predictions and generates Notification alerts.
 */
const checkAndCreateNotifications = async (vehicle, predictions) => {
  for (const pred of predictions) {
    if (pred.status === 'Healthy' || pred.status === 'Attention Required') continue;

    const notifType = pred.status === 'Critical' ? 'Maintenance Overdue' : 'Maintenance Due';
    const notifTitle = `${pred.status === 'Critical' ? 'CRITICAL' : 'Alert'}: ${pred.category} is ${pred.status.toLowerCase()}`;
    const notifMessage = `${vehicle.manufacturer} ${vehicle.model} (${vehicle.registrationNumber}) needs its ${pred.category} serviced. ` +
      (pred.remainingDistance > 0 && pred.remainingDistance < 999999
        ? `${pred.remainingDistance} km remaining. `
        : '') +
      (pred.remainingDays > 0 && pred.remainingDays < 999999
        ? `${pred.remainingDays} days remaining. `
        : '') +
      `Recommended action: ${pred.recommendedAction}`;

    const existingNotif = await Notification.findOne({
      user: vehicle.owner,
      vehicle: vehicle._id,
      type: notifType,
      title: notifTitle,
      isRead: false,
    });

    if (!existingNotif) {
      await Notification.create({
        user: vehicle.owner,
        vehicle: vehicle._id,
        type: notifType,
        title: notifTitle,
        message: notifMessage,
        link: `/vehicles/${vehicle._id}`,
      });
    }
  }
};

module.exports = {
  calculatePrediction,
  MAINTENANCE_INTERVALS,
};
