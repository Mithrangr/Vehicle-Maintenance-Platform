const cron = require('node-cron');
const Vehicle = require('../models/Vehicle');
const { calculatePrediction } = require('../services/predictionService');

/**
 * Initializes scheduled cron jobs for the platform
 */
const initScheduledJobs = () => {
  // Run daily at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Running scheduled nightly prediction refresh...');
    try {
      const vehicles = await Vehicle.find({});
      console.log(`[Cron] Found ${vehicles.length} vehicles to process.`);
      
      let successCount = 0;
      for (const vehicle of vehicles) {
        try {
          await calculatePrediction(vehicle._id);
          successCount++;
        } catch (err) {
          console.error(`[Cron] Failed prediction for vehicle ${vehicle._id}: ${err.message}`);
        }
      }
      console.log(`[Cron] Completed prediction refresh. Success: ${successCount}/${vehicles.length}`);
    } catch (err) {
      console.error(`[Cron] Nightly prediction job failed: ${err.message}`);
    }
  });

  console.log('[Cron] Nightly prediction refresh job scheduled.');
};

module.exports = { initScheduledJobs };
