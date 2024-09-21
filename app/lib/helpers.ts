import { CreateProjectKeyResponse } from "@deepgram/sdk";

const getApiKey = async (token: string): Promise<string> => {
  const result: CreateProjectKeyResponse = await (
    await fetch("/api/authenticate", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })
  ).json();

  return result.key;
};

export { getApiKey };
