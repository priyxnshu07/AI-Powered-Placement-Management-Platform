const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

const { createTables } = require('./database/schema');
const { seedData } = require('./database/seed');
const errorHandler = require('./middleware/errorHandler');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const recruiterRoutes = require('./routes/recruiterRoutes');
const officerRoutes = require('./routes/officerRoutes');
const adminRoutes = require('./routes/adminRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Logging Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/officer', officerRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    service: 'placement-platform-backend'
  });
});

// Database Initialization & Server Start
async function startServer() {
  try {
    await createTables();
    await seedData();
    
    app.use(errorHandler);

    app.listen(PORT, () => {
      console.log(`
🚀 Server running on port ${PORT}
🔗 Health Check: http://localhost:${PORT}/health
      `);
      console.log('Mounted Routes:');
      console.log('- /api/auth');
      console.log('- /api/student');
      console.log('- /api/recruiter');
      console.log('- /api/officer');
      console.log('- /api/admin');
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
