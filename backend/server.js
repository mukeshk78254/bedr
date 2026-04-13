const express = require('express');
const cors = require('cors');
require('dotenv').config();

const flatRoutes = require('./routes/flatRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bedRoutes = require('./routes/bedRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();


const allowedOrigins = [
  'https://bedr-frontend.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001'
];

app.use(express.json());
app.use(cors({
  origin: function(origin, callback) {
   
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

app.use('/api/flats', flatRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/beds', bedRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      status: 404,
      message: 'Route not found'
    }
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ Allowed CORS origins: ${allowedOrigins.join(', ')}`);
});
