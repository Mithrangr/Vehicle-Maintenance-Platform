const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const ServiceRecord = require('./models/ServiceRecord');
const MaintenancePrediction = require('./models/MaintenancePrediction');
const Appointment = require('./models/Appointment');
const Notification = require('./models/Notification');
const { calculatePrediction } = require('./services/predictionService');

dotenv.config();

const seedData = async (shouldExit = true) => {
  try {
    // Connect to database only if running standalone
    if (shouldExit) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vehicle_maintenance');
      console.log('Connected to MongoDB for seeding...');
    }

    // Clear existing data
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await ServiceRecord.deleteMany({});
    await MaintenancePrediction.deleteMany({});
    await Appointment.deleteMany({});
    await Notification.deleteMany({});
    console.log('Database cleared.');

    // 1. Create Users
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@fleet.com',
      password: 'password123',
      role: 'admin',
    });

    const user = await User.create({
      name: 'John Doe',
      email: 'user@fleet.com',
      password: 'password123',
      role: 'user',
    });

    console.log('Users created (Password: password123):');
    console.log(`- Admin: ${admin.email}`);
    console.log(`- User: ${user.email}`);

    // 2. Create Vehicles for John Doe
    const currentDate = new Date();
    
    // Vehicle 1: Tata Nexon (Older, high mileage - expected to have overdue items)
    const nexon = await Vehicle.create({
      owner: user._id,
      registrationNumber: 'MH-12-TX-7788',
      manufacturer: 'Tata',
      model: 'Nexon',
      variant: 'XZA Plus Diesel',
      year: 2019,
      fuelType: 'Diesel',
      purchaseDate: new Date('2019-09-15'),
      currentOdometer: 124000,
      vehicleType: 'SUV',
    });

    // Vehicle 2: Tata Nexon EV (Electric, mid age - moderate health)
    const nexonEv = await Vehicle.create({
      owner: user._id,
      registrationNumber: 'MH-12-EV-3333',
      manufacturer: 'Tata',
      model: 'Nexon EV',
      variant: 'Empowered Plus',
      year: 2021,
      fuelType: 'Electric',
      purchaseDate: new Date('2021-06-10'),
      currentOdometer: 45000,
      vehicleType: 'SUV',
    });

    // Vehicle 3: Maruti Suzuki Swift (New, low mileage - healthy)
    const swift = await Vehicle.create({
      owner: user._id,
      registrationNumber: 'MH-12-MS-9090',
      manufacturer: 'Maruti Suzuki',
      model: 'Swift',
      variant: 'ZXi+ CNG',
      year: 2023,
      fuelType: 'CNG',
      purchaseDate: new Date('2023-03-01'),
      currentOdometer: 16500,
      vehicleType: 'Hatchback',
    });

    console.log('Vehicles created.');

    // 3. Create Service Records
    // Nexon Service Logs
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const sevenMonthsAgo = new Date();
    sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);

    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    // Nexon: Oil changed 7 months ago (interval is 6 months -> Overdue)
    await ServiceRecord.create({
      vehicle: nexon._id,
      serviceCategory: 'Engine Oil',
      serviceDate: sevenMonthsAgo,
      odometerReading: 112000,
      serviceDescription: 'Standard synthetic engine oil and filter change',
      partsReplaced: ['Engine Oil Filter', 'Synthetic Oil 5W-30'],
      cost: 4500.00,
      serviceCenter: 'Tata Motors Authorized Service Center',
      notes: 'Oil looked dark, recommended checking again in 6 months.',
    });

    // Nexon: Brakes serviced 1 year ago (interval is 1 year -> Overdue)
    await ServiceRecord.create({
      vehicle: nexon._id,
      serviceCategory: 'Brake Pads',
      serviceDate: oneYearAgo,
      odometerReading: 94000,
      serviceDescription: 'Brake pad replacement and rotor resurfacing',
      partsReplaced: ['Front Brake Pads', 'Brake Fluid'],
      cost: 12000.00,
      serviceCenter: 'Pep Boys Mechanics Pune',
      notes: 'Brakes squeaking, pads replaced. Rear pads still have 40% life.',
    });

    // Nexon: Air filter replaced recently (10 days ago -> Healthy)
    await ServiceRecord.create({
      vehicle: nexon._id,
      serviceCategory: 'Air Filter',
      serviceDate: tenDaysAgo,
      odometerReading: 123500,
      serviceDescription: 'Cabin and engine air filter swap',
      partsReplaced: ['Cabin Air Filter', 'Engine Intake Filter'],
      cost: 1800.00,
      serviceCenter: 'Tata Motors Service Dealership',
    });

    // Nexon EV Service Logs
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Nexon EV: Tires replaced 6 months ago at 30,000 km (current is 45k, diff 15k, interval 60k -> Healthy)
    await ServiceRecord.create({
      vehicle: nexonEv._id,
      serviceCategory: 'Tires',
      serviceDate: sixMonthsAgo,
      odometerReading: 30000,
      serviceDescription: 'Tire rotation and alignment check',
      partsReplaced: ['Tires Rotated'],
      cost: 1200.00,
      serviceCenter: 'MRF Tyres Pune Hub',
    });

    // Nexon EV: Battery checked 6 months ago (interval 50,000 km or 2 years -> Healthy)
    await ServiceRecord.create({
      vehicle: nexonEv._id,
      serviceCategory: 'Battery',
      serviceDate: sixMonthsAgo,
      odometerReading: 30000,
      serviceDescription: '12V low voltage battery replaced and software diagnostics',
      partsReplaced: ['12V Aux Battery'],
      cost: 6500.00,
      serviceCenter: 'Tata Motors EV Service',
    });

    // Swift Service Logs
    // Swift: General Checkup 2 months ago (Healthy)
    await ServiceRecord.create({
      vehicle: swift._id,
      serviceCategory: 'General Vehicle Service',
      serviceDate: new Date(new Date().setMonth(new Date().getMonth() - 2)),
      odometerReading: 12000,
      serviceDescription: 'First scheduled Maruti Suzuki Care checkup',
      partsReplaced: ['Engine Oil', 'Oil Filter'],
      cost: 0.00, // Free under warranty
      serviceCenter: 'Maruti Suzuki Arena Pune',
      notes: 'All fluids topped off. Safety check passed.',
    });

    console.log('Service records created.');

    // 4. Run calculations to generate predictions and health scores
    console.log('Calculating initial predictions and health scores...');
    await calculatePrediction(nexon._id);
    await calculatePrediction(nexonEv._id);
    await calculatePrediction(swift._id);
    console.log('Predictions calculated successfully.');

    // 5. Create Appointments
    const fiveDaysInFuture = new Date();
    fiveDaysInFuture.setDate(fiveDaysInFuture.getDate() + 5);

    const fifteenDaysInFuture = new Date();
    fifteenDaysInFuture.setDate(fifteenDaysInFuture.getDate() + 15);

    await Appointment.create({
      user: user._id,
      vehicle: nexon._id,
      serviceCategory: 'Engine Oil',
      appointmentDate: fiveDaysInFuture,
      notes: 'Odometer is overdue for oil. Also please check the front brakes checkup.',
      status: 'Pending',
    });

    await Appointment.create({
      user: user._id,
      vehicle: nexonEv._id,
      serviceCategory: 'General Vehicle Service',
      appointmentDate: fifteenDaysInFuture,
      notes: 'Periodic service check and multi-point inspection.',
      status: 'Confirmed',
    });

    console.log('Appointments seeded.');
    console.log('Seeding process complete!');
    if (shouldExit) {
      process.exit(0);
    }
  } catch (error) {
    console.error(`Error seeding database: ${error.message}`);
    if (shouldExit) {
      process.exit(1);
    }
  }
};


// Run seeding if file is executed directly
if (require.main === module) {
  seedData();
}

module.exports = seedData;

