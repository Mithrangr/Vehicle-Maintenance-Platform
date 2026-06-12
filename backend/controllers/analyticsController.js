const Vehicle = require('../models/Vehicle');
const ServiceRecord = require('../models/ServiceRecord');
const MaintenancePrediction = require('../models/MaintenancePrediction');

// @desc    Get dashboard analytics metrics
// @route   GET /api/analytics/dashboard
// @access  Private
exports.getDashboardAnalytics = async (req, res, next) => {
  try {
    // 1. Get vehicles owned by user
    const vehicles = await Vehicle.find({ owner: req.user._id });
    const vehicleIds = vehicles.map(v => v._id);
    const totalVehicles = vehicles.length;

    if (totalVehicles === 0) {
      return res.json({
        success: true,
        data: {
          totalVehicles: 0,
          upcomingMaintenance: 0,
          overdueMaintenance: 0,
          averageHealthScore: 100,
          healthDistribution: { healthy: 0, dueSoon: 0, overdue: 0 },
          monthlyCosts: [],
          categoryCosts: [],
        },
      });
    }

    // 2. Fetch predictions
    const predictions = await MaintenancePrediction.find({ vehicle: { $in: vehicleIds } });
    
    let upcomingMaintenance = 0;
    let overdueMaintenance = 0;
    let sumHealthScore = 0;

    let healthyCount = 0;
    let dueSoonCount = 0;
    let overdueCount = 0;

    predictions.forEach((pred) => {
      sumHealthScore += pred.healthScore;

      // Group overall vehicle status based on its worst component
      let worstStatus = 'Healthy';
      pred.predictions.forEach((p) => {
        if (p.status === 'Critical') {
          overdueMaintenance++;
          worstStatus = 'Critical';
        } else if (p.status === 'Maintenance Due Soon') {
          upcomingMaintenance++;
          if (worstStatus !== 'Critical') {
            worstStatus = 'Maintenance Due Soon';
          }
        } else if (p.status === 'Attention Required') {
          upcomingMaintenance++;
          if (worstStatus === 'Healthy') {
            worstStatus = 'Attention Required';
          }
        }
      });

      if (worstStatus === 'Critical') overdueCount++;
      else if (worstStatus === 'Maintenance Due Soon' || worstStatus === 'Attention Required') dueSoonCount++;
      else healthyCount++;
    });

    const averageHealthScore = totalVehicles > 0 ? Math.round(sumHealthScore / totalVehicles) : 100;

    // 3. Fetch monthly service costs (past 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const serviceRecords = await ServiceRecord.find({
      vehicle: { $in: vehicleIds },
      serviceDate: { $gte: sixMonthsAgo },
    });

    // Generate month list for chronological charts
    const monthlyDataMap = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyDataMap[label] = { month: label, cost: 0, count: 0 };
    }

    // Aggregate cost and count into months
    serviceRecords.forEach((record) => {
      const recordDate = new Date(record.serviceDate);
      const label = recordDate.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (monthlyDataMap[label]) {
        monthlyDataMap[label].cost += record.cost;
        monthlyDataMap[label].count += 1;
      }
    });

    const monthlyCosts = Object.values(monthlyDataMap).reverse();

    // 4. Aggregate cost by category
    const categoryDataMap = {};
    const allRecords = await ServiceRecord.find({ vehicle: { $in: vehicleIds } });
    allRecords.forEach((record) => {
      const category = record.serviceCategory;
      if (!categoryDataMap[category]) {
        categoryDataMap[category] = 0;
      }
      categoryDataMap[category] += record.cost;
    });

    const categoryCosts = Object.keys(categoryDataMap).map(cat => ({
      category: cat,
      cost: categoryDataMap[cat],
    }));

    res.json({
      success: true,
      data: {
        totalVehicles,
        upcomingMaintenance,
        overdueMaintenance,
        averageHealthScore,
        healthDistribution: {
          healthy: healthyCount,
          dueSoon: dueSoonCount,
          overdue: overdueCount,
        },
        monthlyCosts,
        categoryCosts,
        // Maintenance cost forecast from prediction data
        costForecast: getCostForecast(predictions),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Compute the upcoming maintenance cost forecast from all vehicle predictions.
 */
const getCostForecast = (predictions) => {
  const forecast = [];

  predictions.forEach((pred) => {
    pred.predictions.forEach((p) => {
      if (p.status !== 'Healthy') {
        forecast.push({
          category: p.category,
          status: p.status,
          estimatedCost: p.estimatedCost,
          remainingDays: p.remainingDays,
          predictedDate: p.predictedDate,
          priorityLevel: p.priorityLevel,
        });
      }
    });
  });

  // Sort by urgency (priorityScore descending → remaining days ascending)
  forecast.sort((a, b) => a.remainingDays - b.remainingDays);

  const totalForecastCost = forecast.reduce((sum, f) => sum + f.estimatedCost, 0);

  return {
    items: forecast,
    totalEstimatedCost: totalForecastCost,
  };
};
