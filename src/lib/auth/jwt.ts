import jwt from 'jsonwebtoken';

const envSecret = process.env.NEXTAUTH_SECRET;
if (!envSecret) {
  throw new Error('NEXTAUTH_SECRET must be defined in environment variables');
}
const JWT_SECRET: string = envSecret;

const JWT_EXPIRY = '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'superadmin';
}

export function signJWT(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  });
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('JWT verification failed:', error);
    }
    return null;
  }
}
