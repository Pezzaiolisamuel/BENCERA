import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { adminSessionCookieName, buildAdminSessionCookieValue } from "@/lib/admin-session";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "";
    const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";
    const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "";


    console.log("ADMIN_USERNAME:", process.env.ADMIN_USERNAME);
console.log("ADMIN_PASSWORD_HASH exists:", !!process.env.ADMIN_PASSWORD_HASH);
console.log("ADMIN_PASSWORD_HASH length:", (process.env.ADMIN_PASSWORD_HASH || "").length);
console.log("ADMIN_SESSION_SECRET exists:", !!process.env.ADMIN_SESSION_SECRET);

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

    const res = NextResponse.json({ ok: true });

    res.cookies.set(adminSessionCookieName, buildAdminSessionCookieValue(ADMIN_SESSION_SECRET), {
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
