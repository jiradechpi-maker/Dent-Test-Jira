import "server-only";
import { createSign } from "node:crypto";
import { SourceError } from "@/lib/schedule/bundle";

const SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

export interface ServiceAccount {
  clientEmail: string;
  privateKey: string;
}

/**
 * Reads the service account from GOOGLE_SERVICE_ACCOUNT_JSON (the downloaded key file, raw or base64) or
 * from GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY.
 */
export function serviceAccountFromEnv(env: NodeJS.ProcessEnv = process.env): ServiceAccount | null {
  const json = env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (json) {
    const text = json.startsWith("{") ? json : Buffer.from(json, "base64").toString("utf8");
    const parsed = JSON.parse(text) as { client_email?: string; private_key?: string };
    if (parsed.client_email && parsed.private_key) return { clientEmail: parsed.client_email, privateKey: parsed.private_key };
    throw new SourceError({
      th: "GOOGLE_SERVICE_ACCOUNT_JSON ไม่มี client_email หรือ private_key",
      en: "GOOGLE_SERVICE_ACCOUNT_JSON has no client_email or private_key",
    });
  }
  const clientEmail = env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  return clientEmail && privateKey ? { clientEmail, privateKey } : null;
}

let cached: { email: string; token: string; expiresAt: number } | null = null;

export async function accessToken(account: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.email === account.clientEmail && cached.expiresAt - 60 > now) return cached.token;

  const base64url = (value: string | Buffer) => Buffer.from(value).toString("base64url");
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(JSON.stringify({ iss: account.clientEmail, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const assertion = `${header}.${claims}.${base64url(signer.sign(account.privateKey))}`;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new SourceError({
      th: `ขอ access token จาก Google ไม่สำเร็จ (HTTP ${response.status}): ${detail}`,
      en: `Could not get an access token from Google (HTTP ${response.status}): ${detail}`,
    });
  }
  const body = (await response.json()) as { access_token: string; expires_in: number };
  cached = { email: account.clientEmail, token: body.access_token, expiresAt: now + body.expires_in };
  return body.access_token;
}
