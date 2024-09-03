import { verifyJWT } from '@/app/lib/authMiddleware';
import { generateToken, verifyToken } from '@/app/lib/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req:NextRequest) {
    // verify jwt token
  const authResponse = verifyJWT(req); verifyJWT
  if (authResponse.status !== 200) {
    return authResponse;
  }
}
