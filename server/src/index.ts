import 'dotenv/config';

console.log('[BOOT] Starting server...');
console.log('[BOOT] NODE_ENV:', process.env.NODE_ENV);
console.log('[BOOT] PORT:', process.env.PORT);
console.log('[BOOT] CLIENT_URL:', process.env.CLIENT_URL);
console.log('[BOOT] JWT_SECRET length:', process.env.JWT_SECRET?.length);
console.log('[BOOT] DATABASE_URL set:', !!process.env.DATABASE_URL);

try {
  const { default: express } = await import('express');
  const { default: cors } = await import('cors');
  const { default: helmet } = await import('helmet');
  console.log('[BOOT] Express, cors, helmet loaded');

  const { default: routes } = await import('./routes/index.js');
  console.log('[BOOT] Routes loaded');

  const { errorHandler } = await import('./middleware/errorHandler.js');
  console.log('[BOOT] Error handler loaded');

  const app = express();
  const PORT = parseInt(process.env.PORT || '3001');

  app.use(helmet());
  app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
  app.use(express.json({ limit: '1mb' }));

  app.use('/api/v1', routes);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`[BOOT] Server running on http://localhost:${PORT}`);
  });
} catch (err) {
  console.error('[BOOT] FATAL ERROR:', err);
  process.exit(1);
}
