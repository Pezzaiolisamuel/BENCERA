import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";

function signSession(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "";
    const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";
    const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "";

    if (!ADMIN_USERNAME || !ADMIN_PASSWORD_HASH || !ADMIN_SESSION_SECRET) {
      return NextResponse.json(
        { error: "Server auth not configured" },
        { status: 500 }
      );
    }

    if (username !== ADMIN_USERNAME) {
      return NextResponse.json({ error: "Invalid 1 credentials" }, { status: 401 });
    }

    console.log("ENV username:", process.env.ADMIN_USERNAME);
console.log("HASH length:", (process.env.ADMIN_PASSWORD_HASH || "").length);
console.log("HASH starts:", (process.env.ADMIN_PASSWORD_HASH || "").slice(0, 4));


    const ok = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (!ok) {
      return NextResponse.json({ error: "Invalid 2 credentials" }, { status: 401 });
    }

    // Create a simple signed cookie value: "admin|timestamp|signature"
    const ts = Date.now().toString();
    const payload = `admin|${ts}`;
    const sig = signSession(payload, ADMIN_SESSION_SECRET);
    const value = `${payload}|${sig}`;

    const res = NextResponse.json({ ok: true });

    // HttpOnly cookie prevents JS from reading it
    res.cookies.set("admin_session", value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return res;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
