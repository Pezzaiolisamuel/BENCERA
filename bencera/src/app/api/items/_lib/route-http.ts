import "server-only";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-session";

type OperationResult = {
  body: unknown;
  status: number;
};

export function requireAdminSession(req: Request) {
  return isAdminAuthenticated(req, process.env.ADMIN_SESSION_SECRET || "");
}

export function unauthorizedItemsResponse() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
}

export function operationResultResponse(result: OperationResult) {
  return NextResponse.json(result.body, { status: result.status });
}

export function routeErrorResponse(
  operation: "GET" | "POST" | "DELETE" | "PATCH",
  error: unknown,
  fallbackMessage: string,
  status: number
) {
  const message = error instanceof Error ? error.message : fallbackMessage;
  console.error(`${operation} /api/items error:`, error);
  return NextResponse.json({ error: message }, { status });
}

export function getDeleteItemId(req: Request) {
  const { searchParams } = new URL(req.url);
  return searchParams.get("id");
}

export function missingItemIdResponse() {
  return NextResponse.json({ error: "Missing item id" }, { status: 400 });
}
