let cachedToken: { token: string; expiresAt: number } | null = null;

async function getSandboxToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const res = await fetch("https://api.sandbox.co.in/authenticate", {
    method: "POST",
    headers: {
      "x-api-key": process.env.SANDBOX_API_KEY!,
      "x-api-secret": process.env.SANDBOX_API_SECRET!,
      "x-api-version": "1.0.0",
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) throw new Error("Failed to authenticate with Sandbox API");
  const data = await res.json();

  // Cache for 23 hours (token is valid 24h; refresh slightly early)
  cachedToken = {
    token: data.data.access_token,
    expiresAt: Date.now() + 23 * 60 * 60 * 1000,
  };
  return cachedToken.token;
}

export async function verifyPAN(pan: string, name: string, dob: string) {
  const token = await getSandboxToken();
  const res = await fetch("https://api.sandbox.co.in/kyc/pan/verify", {
    method: "POST",
    headers: {
      "x-api-key": process.env.SANDBOX_API_KEY!,
      authorization: token,
      "x-api-version": "1.0",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pan, name_as_per_pan: name, date_of_birth: dob }),
  });
  return res.json();
}

export async function searchGSTIN(gstin: string) {
  const token = await getSandboxToken();
  const res = await fetch("https://api.sandbox.co.in/gst/compliance/public/gstin/search", {
    method: "POST",
    headers: {
      "x-api-key": process.env.SANDBOX_API_KEY!,
      authorization: token,
      "x-api-version": "1.0",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ gstin }),
  });
  return res.json();
}