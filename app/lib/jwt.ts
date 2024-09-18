import jwt from "jsonwebtoken";
import { config } from "../config";

interface JwtPayload {
  role: string;
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: "4h" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, config.jwtSecret) as JwtPayload;
  } catch (error) {
    return null;
  }
}
