import jwt, { type SignOptions } from 'jsonwebtoken';

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is required');
  if (secret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');
  return secret;
}
const SECRET = getSecret();
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function signToken(userId: string): string {
  const options: SignOptions = { expiresIn: EXPIRES_IN as any };
  return jwt.sign({ userId }, SECRET, options);
}

export function verifyToken(token: string): { userId: string } {
  return jwt.verify(token, SECRET) as { userId: string };
}
