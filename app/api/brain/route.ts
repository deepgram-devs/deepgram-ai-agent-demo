import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { verifyJWT } from "@/app/lib/authMiddleware";
import { NextRequest, NextResponse } from "next/server";

// Optional, but recommended: run on the edge runtime.
// See https://vercel.com/docs/concepts/functions/edge-functions
// export const runtime = "edge";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  // verify jwt token
  const authResponse = verifyJWT(req);
  if (authResponse.status !== 200) {
    return authResponse;
  }
  // Extract the `messages` from the body of the request
  const { messages} = await req.json();
  const start = Date.now();

  // Request the OpenAI API for the response based on the prompt
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-0125",
      stream: true,
      messages: messages,
    });

    const stream = OpenAIStream(response);

    return new StreamingTextResponse(stream, {
      headers: {
        "X-LLM-Start": `${start}`,
        "X-LLM-Response": `${Date.now()}`,
      },
    });
  } catch (error) {
    return NextResponse.json(error,{status:500})
  }
}
