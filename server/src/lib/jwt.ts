import jwt, { type SignOptions } from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function signToken(userId: string): string {
  const options: SignOptions = { expiresIn: EXPIRES_IN as any };
  return jwt.sign({ userId }, SECRET, options);
}

export function verifyToken(token: string): { userId: string } {
  return jwt.verify(token, SECRET) as { userId: string };
}
