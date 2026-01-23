import { NextResponse } from "next/server";
import crypto from "crypto";

console.log("ENV_TEST:", process.env.ENV_TEST);

function signSession(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export async function GET(req: Request) {
  const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "";
  if (!ADMIN_SESSION_SECRET) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/admin_session=([^;]+)/);
  if (!match) return NextResponse.json({ authenticated: false }, { status: 200 });

  const raw = decodeURIComponent(match[1]);

  // expected format: "admin|timestamp|signature"
  const parts = raw.split("|");
  if (parts.length !== 3) return NextResponse.json({ authenticated: false }, { status: 200 });

  const payload = `${parts[0]}|${parts[1]}`;
  const sig = parts[2];

  const expected = signSession(payload, ADMIN_SESSION_SECRET);
  const authenticated = expected === sig && parts[0] === "admin";

  return NextResponse.json({ authenticated }, { status: 200 });
}
