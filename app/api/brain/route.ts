import { StreamingTextResponse, AWSBedrockAnthropicMessagesStream } from "ai";
import {
  BedrockRuntimeClient,
  InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { systemContent } from "@/app/lib/constants";

// Optional, but recommended: run on the edge runtime.
// See https://vercel.com/docs/concepts/functions/edge-functions
export const runtime = "edge";

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const start = Date.now();

  try {
    const response = await client.send(
      new InvokeModelWithResponseStreamCommand({
        modelId: "anthropic.claude-3-haiku-20240307-v1:0",
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 600,
          system: systemContent,
          messages: [
            // antrhopic doesn't allow the assistant message to be the first message
            { role: "user", content: "Hi" },
            ...messages,
          ],
        }),
      })
    );

    const stream = AWSBedrockAnthropicMessagesStream(response);

    return new StreamingTextResponse(stream, {
      headers: {
        "X-LLM-Start": `${start}`,
        "X-LLM-Response": `${Date.now()}`,
      },
    });
  } catch (error) {
    console.error("test", error);
  }
}
