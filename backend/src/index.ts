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
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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

