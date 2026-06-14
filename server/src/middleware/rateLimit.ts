import rateLimit, { Options } from 'express-rate-limit';
import type { Request } from 'express';

// IP cliente réelle derrière Cloudflare Tunnel → Caddy. CF-Connecting-IP est posé
// par Cloudflare ; à défaut on retombe sur req.ip (avec trust proxy configuré).
function clientIp(req: Request): string {
  const cf = req.headers['cf-connecting-ip'];
  if (typeof cf === 'string' && cf.length > 0) return cf;
  return req.ip ?? 'unknown';
}

export function makeLimiter(opts: { windowMs: number; max: number; message?: string }) {
  return rateLimit({
    windowMs: opts.windowMs,
    max: opts.max,
    message: { error: opts.message ?? 'Trop de requêtes, réessayez plus tard.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: clientIp as Options['keyGenerator'],
  });
}
