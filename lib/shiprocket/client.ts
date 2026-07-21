import type { ShipRocketAuthResponse, ShipRocketError } from "./types";

const BASE_URL = "https://apiv2.shiprocket.in/v1/external";

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

function getCredentials() {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) {
    throw new Error("SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD must be set in .env.local");
  }
  return { email, password };
}

async function authenticate(): Promise<string> {
  const { email, password } = getCredentials();
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json() as ShipRocketError;
    throw new Error(`ShipRocket auth failed: ${err.message ?? res.statusText}`);
  }
  const data = await res.json() as ShipRocketAuthResponse;
  cachedToken = data.token;
  tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000;
  return data.token;
}

async function getToken(): Promise<string> {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }
  return authenticate();
}

export async function shiprocketFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string>),
    },
  });

  if (res.status === 401) {
    cachedToken = null;
    tokenExpiry = null;
    const freshToken = await authenticate();
    const retryRes = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${freshToken}`,
        ...(options.headers as Record<string, string>),
      },
    });
    if (!retryRes.ok) {
      const err = await retryRes.json() as ShipRocketError;
      throw new Error(`ShipRocket API error: ${err.message ?? retryRes.statusText}`);
    }
    return retryRes.json() as Promise<T>;
  }

  if (!res.ok) {
    const err = await res.json() as ShipRocketError;
    throw new Error(`ShipRocket API error: ${err.message ?? res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export function resetToken(): void {
  cachedToken = null;
  tokenExpiry = null;
}
