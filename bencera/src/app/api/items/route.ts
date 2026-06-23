import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { deleteItem, createItemFromFormData, updateItemFromFormData } from "./_lib/item-service";
import { listItems } from "./_lib/item-repository";

function requireAdminSession(req: Request) {
  return isAdminAuthenticated(req, process.env.ADMIN_SESSION_SECRET || "");
}

export async function GET(req: Request) {
  if (!requireAdminSession(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const items = await listItems();
    return NextResponse.json(items);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch items";
    console.error("GET /api/items error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!requireAdminSession(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const result = await createItemFromFormData(await req.formData());
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create item";
    console.error("POST /api/items error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  if (!requireAdminSession(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing item id" }, { status: 400 });
    }

    const result = await deleteItem(id);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete item";
    console.error("DELETE /api/items error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  if (!requireAdminSession(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const result = await updateItemFromFormData(await req.formData());
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update item";
    console.error("PATCH /api/items error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
