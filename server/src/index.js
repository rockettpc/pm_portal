import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import equipmentRoutes from './routes/equipment.js';
import locationRoutes from './routes/locations.js';
import documentRoutes from './routes/documents.js';
import partsRoutes from './routes/parts.js';
import partsRequestsRoutes from './routes/partsRequests.js';
import pmSchedulesRoutes from './routes/pmSchedules.js';
import workOrdersRoutes from './routes/workOrders.js';
import dashboardRoutes from './routes/dashboard.js';
import auditRoutes from './routes/audit.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3001';

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman) or matching origin
    if (!origin || origin === CLIENT_ORIGIN || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    callback(null, true); // Permissive in development
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'pm-portal-backend',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/parts', partsRoutes);
app.use('/api/parts-requests', partsRequestsRoutes);
app.use('/api/pm-schedules', pmSchedulesRoutes);
app.use('/api/work-orders', workOrdersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit-log', auditRoutes);
app.use('/api', locationRoutes);
app.use('/api', documentRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[server error]', err.stack || err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[pm-backend] Server listening on http://0.0.0.0:${PORT}`);
});
