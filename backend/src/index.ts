import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import mailRoutes from './routes/mailRoutes';
import authRoutes from './routes/authRoutes';
import aiRoutes from './routes/aiRoutes';

// Load .env from root project directory or backend folder
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Explicit origin-validation allowlist
const allowedOrigins = new Set<string>();

if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(',').forEach(url => {
    const trimmed = url.trim().replace(/\/+$/, '');
    if (trimmed) allowedOrigins.add(trimmed);
  });
}

// Development origins (enabled outside production)
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.add('http://localhost:5173');
  allowedOrigins.add('http://127.0.0.1:5173');
} else if (allowedOrigins.size === 0) {
  console.warn('[CORS] Warning: FRONTEND_URL is not configured in production mode.');
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. server-to-server, curl) with no Origin header
    if (!origin) {
      return callback(null, true);
    }
    const normalizedOrigin = origin.replace(/\/+$/, '');
    if (allowedOrigins.has(normalizedOrigin)) {
      return callback(null, true);
    }
    return callback(new Error(`Not allowed by CORS: Origin ${origin} is not authorized.`));
  },
  credentials: true
}));
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/mail', mailRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);

// Global Error Handler (including CORS rejections)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err && err.message && err.message.startsWith('Not allowed by CORS')) {
    return res.status(403).json({
      success: false,
      error: err.message
    });
  }
  return res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`[AI Mail Backend] Server running on port ${PORT}`);
  console.log(`[AI Mail Backend] OAuth Client ID loaded: ${process.env.GMAIL_CLIENT_ID ? 'YES' : 'NO'}`);
});
