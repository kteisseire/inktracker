import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001');

app.use(helmet());

const corsOrigin = process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:5173');
app.use(cors({ origin: corsOrigin }));

app.use(express.json({ limit: '1mb' }));

// Global rate limiter: 100 requests per minute per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Trop de requêtes, réessayez dans une minute' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/v1', globalLimiter);

app.use('/api/v1', routes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
