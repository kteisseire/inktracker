import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = parseInt(process.env.PORT || '3001');

// Derrière Cloudflare Tunnel → Caddy → 127.0.0.1 : sans cela, req.ip vaut
// 127.0.0.1 pour TOUS les clients et le rate-limiting devient global (DoS du
// login pour tout le monde). On fait confiance à un hop (Caddy local) ; l'IP
// cliente réelle est aussi disponible via l'en-tête CF-Connecting-IP.
app.set('trust proxy', 1);

app.use(helmet({
  // COOP requis pour le popup Google Sign-In (renderButton).
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  // CSP + en-têtes de sécurité posés par Caddy (couche de service self-host).
  contentSecurityPolicy: false,
}));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '5mb' }));

app.use('/api/v1', routes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
