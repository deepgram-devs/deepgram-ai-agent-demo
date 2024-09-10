import { generateToken } from "@/app/lib/jwt";
import { NextResponse } from "next/server";

export async function POST() {
  const payload = { role: "anonymous" + Date.now() };

  const token = generateToken(payload);
  return NextResponse.json({ token });
}
