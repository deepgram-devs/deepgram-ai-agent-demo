import { config } from "@/app/config";
import { verifyJWT } from "@/app/lib/authMiddleware";
import { DeepgramError, createClient } from "@deepgram/sdk";
import { NextResponse, type NextRequest } from "next/server";

export const revalidate = 0;

export async function GET(request: NextRequest) {
  // verify jwt token
  const authResponse = verifyJWT(request);
  if (authResponse.status !== 200) {
    return authResponse;
  }
  
  // exit early so we don't request 70000000 keys while in devmode
  if (process.env.DEEPGRAM_ENV === "development") {
    return NextResponse.json({
      key: config.deepGramApiKey ?? "",
    });
  }

  // gotta use the request object to invalidate the cache every request :vomit:
  const url = request.url;
  const deepgram = createClient(config.deepGramApiKey ?? "");

  let { result: tokenResult, error: tokenError } =
    await deepgram.auth.grantToken();

  if (tokenError) {
    return NextResponse.json(tokenError);
  }

  if (!tokenResult) {
    return NextResponse.json(
      new DeepgramError(
        "Failed to generate temporary token. Make sure your API key is of scope Member or higher."
      )
    );
  }

  const response = NextResponse.json({
    key: tokenResult.access_token,
    expires_in: tokenResult.expires_in,
    url
  });
  response.headers.set("Surrogate-Control", "no-store");
  response.headers.set(
    "Cache-Control",
    "s-maxage=0, no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  response.headers.set("Expires", "0");

  return response;
}
