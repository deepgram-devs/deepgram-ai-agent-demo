import { verifyJWT } from "@/app/lib/authMiddleware";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  // verify jwt token
  const authResponse = verifyJWT(req);
  verifyJWT;
  if (authResponse.status !== 200) {
    return authResponse;
  }
}
