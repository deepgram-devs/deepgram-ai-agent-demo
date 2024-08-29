import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'deepgram-secret-123456';

interface JwtPayload {
  role: string;
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, secret, { expiresIn: '1h' });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error) {
    return null;
  }
}
