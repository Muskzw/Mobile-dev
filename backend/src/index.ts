import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createTables } from './database/schema';

// Routes
import authRoutes from './routes/auth';
import companyRoutes from './routes/companies';
import clientRoutes from './routes/clients';
import documentRoutes from './routes/documents';
import aiRoutes from './routes/ai';
import dashboardRoutes from './routes/dashboard';
import settingsRoutes from './routes/settings';
import savedItemsRoutes from './routes/saved-items';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://10.0.2.2:3000',
      'http://localhost:19006', // Expo web
      'exp://', // Expo Go
    ];

    // Allow any localhost or 10.0.2.2 origin for development
    if (origin.includes('localhost') || origin.includes('10.0.2.2') || origin.includes('192.168.')) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in development
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Initialize database
createTables().then(() => {
  console.log('Database initialized');
}).catch(err => {
  console.error('Database initialization error:', err);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/saved-items', savedItemsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

