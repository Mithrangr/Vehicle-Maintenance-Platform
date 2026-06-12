const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Load env vars
dotenv.config();

const app = express();

// CORS configuration - Support credentials (for http-only refresh cookies)
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Body parsers
app.use(express.json());
app.use(cookieParser());

// Request logger for development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
  });
}

// Mount routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/services', require('./routes/services'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/admin', require('./routes/admin'));

// Base Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Predictive Vehicle Maintenance API' });
});

// Centralized error handler
app.use(errorHandler);

const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Initialize Scheduled Cron Jobs
  try {
    const { initScheduledJobs } = require('./jobs/scheduledPredictions');
    initScheduledJobs();
  } catch (err) {
    console.error(`Failed to initialize scheduled jobs: ${err.message}`);
  }

  // Auto-seed in development if database is empty
  if (process.env.NODE_ENV === 'development') {
    try {
      const User = require('./models/User');
      const count = await User.countDocuments({});
      if (count === 0) {
        console.log('Database is empty. Running auto-seeder...');
        const seedData = require('./seed');
        await seedData(false);
        console.log('Database auto-seeded.');
      }
    } catch (err) {
      console.error(`Seeding check failed: ${err.message}`);
    }
  }

  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    console.error(`Unhandled Rejection Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
  });
};

startServer();
