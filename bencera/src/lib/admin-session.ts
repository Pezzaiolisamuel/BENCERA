import crypto from "crypto";

const ADMIN_ROLE = "admin";
const SESSION_COOKIE_NAME = "admin_session";

export function signAdminSession(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function buildAdminSessionCookieValue(secret: string) {
  const timestamp = Date.now().toString();
  const payload = `${ADMIN_ROLE}|${timestamp}`;
  const signature = signAdminSession(payload, secret);

  return `${payload}|${signature}`;
}

export function isAdminAuthenticated(req: Request, secret: string) {
  if (!secret) return false;

  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
  if (!match) return false;

  const rawCookieValue = decodeURIComponent(match[1]);
  const [role, timestamp, signature] = rawCookieValue.split("|");

  if (!role || !timestamp || !signature) return false;

  const payload = `${role}|${timestamp}`;
  const expectedSignature = signAdminSession(payload, secret);

  return expectedSignature === signature && role === ADMIN_ROLE;
}

export const adminSessionCookieName = SESSION_COOKIE_NAME;
