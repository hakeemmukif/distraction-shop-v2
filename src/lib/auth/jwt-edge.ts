import { jwtVerify } from 'jose';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'superadmin';
}

export async function verifyJWTEdge(token: string): Promise<JWTPayload | null> {
  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error('NEXTAUTH_SECRET is not defined');
      return null;
    }

    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as 'admin' | 'superadmin',
    };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}
