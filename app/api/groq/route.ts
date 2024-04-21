import { Response } from "node-fetch"; // Ensure this is the correct import path
import Groq from "groq-sdk"; // Assuming default export is available

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Optional, but recommended: run on the edge runtime.
export const runtime = "edge";

export async function POST(req: Request) {
  try {
    // Extract the `chatMessages` from the body of the request
    const { messages } = await req.json();
    const start = Date.now();

    // Initiate the chat completions with Groq
    const response = await groq.chat.completions.create({
      messages: messages,
      model: "mixtral-8x7b-32768",
      temperature: 1.0,
      max_tokens: 1024,
      top_p: 1,
      stop: null,//", 6",
      stream: false // Assuming streaming is not necessary
    });

    // Check response structure and serialize as needed
    const textResponse = JSON.stringify(response.choices[0]?.message?.content); // Convert the response to a JSON string if it's an object

    return new Response(textResponse, {
      status: 200, // OK status
      headers: {
        "Content-Type": "application/json",
        "X-LLM-Start": `${start}`,
        "X-LLM-Response": `${Date.now()}`
      }
    });

  } catch (error) {
    console.error("Error processing the request:", error);
    return new Response(JSON.stringify({ error: "Error processing the request" }), {
      status: 500, // Internal Server Error
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
}
