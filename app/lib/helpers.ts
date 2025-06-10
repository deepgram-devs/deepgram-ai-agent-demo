interface TokenResponse {
  key: string;
  expires_in?: number;
  url?: string;
}

const getToken = async (token: string): Promise<string> => {
  const result: TokenResponse = await (
    await fetch("/api/authenticate", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })
  ).json();

  return result.key;
};

export { getToken };
