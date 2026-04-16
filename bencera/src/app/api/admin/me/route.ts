import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-session";

export async function GET(req: Request) {
  const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "";
  if (!ADMIN_SESSION_SECRET) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  return NextResponse.json(
    { authenticated: isAdminAuthenticated(req, ADMIN_SESSION_SECRET) },
    { status: 200 }
  );
}
