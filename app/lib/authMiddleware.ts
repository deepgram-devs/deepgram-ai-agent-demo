import { NextResponse, type NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { config } from '../config';

// verify token for protected route 
export function verifyJWT(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];

  try {
    jwt.verify(token, config.jwtSecret);
    return NextResponse.next();
  } catch (error) {
    return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
  }
}
