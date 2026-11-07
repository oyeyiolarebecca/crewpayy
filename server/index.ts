import 'dotenv/config';
import express, { Request, Response } from 'express';
import { authRouter } from './routes/auth.js';
import { blaaizRouter } from './routes/blaaiz.js';
import { payrollRouter } from './routes/payroll.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// CORS configuration for local development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Request logger
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/blaaiz', blaaizRouter);
app.use('/api/payroll', payrollRouter);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'CrewPay Backend API',
    provider: 'Blaaiz Platform Remittance-as-a-Service',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 CrewPay Backend running on http://localhost:${PORT}`);
  console.log(`⚡ Blaaiz RaaS Integration initialized`);
});
