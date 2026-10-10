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

app.use(cors({
  origin: '*',
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

app.listen(PORT, () => {
  console.log(`[AI Mail Backend] Server running on port ${PORT}`);
  console.log(`[AI Mail Backend] OAuth Client ID loaded: ${process.env.GMAIL_CLIENT_ID ? 'YES' : 'NO'}`);
});
