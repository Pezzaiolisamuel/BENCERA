import { NextResponse } from "next/server";
import { deleteItem, createItemFromFormData, updateItemFromFormData } from "./_lib/item-service";
import { listItems } from "./_lib/item-repository";
import {
  getDeleteItemId,
  missingItemIdResponse,
  operationResultResponse,
  requireAdminSession,
  routeErrorResponse,
  unauthorizedItemsResponse,
} from "./_lib/route-http";

export async function GET(req: Request) {
  if (!requireAdminSession(req)) {
    return unauthorizedItemsResponse();
  }

  try {
    const items = await listItems();
    return NextResponse.json(items);
  } catch (error) {
    return routeErrorResponse("GET", error, "Failed to fetch items", 500);
  }
}

export async function POST(req: Request) {
  if (!requireAdminSession(req)) {
    return unauthorizedItemsResponse();
  }

  try {
    const result = await createItemFromFormData(await req.formData());
    return operationResultResponse(result);
  } catch (error) {
    return routeErrorResponse("POST", error, "Failed to create item", 400);
  }
}

export async function DELETE(req: Request) {
  if (!requireAdminSession(req)) {
    return unauthorizedItemsResponse();
  }

  try {
    const id = getDeleteItemId(req);

    if (!id) {
      return missingItemIdResponse();
    }

    const result = await deleteItem(id);
    return operationResultResponse(result);
  } catch (error) {
    return routeErrorResponse("DELETE", error, "Failed to delete item", 400);
  }
}

export async function PATCH(req: Request) {
  if (!requireAdminSession(req)) {
    return unauthorizedItemsResponse();
  }

  try {
    const result = await updateItemFromFormData(await req.formData());
    return operationResultResponse(result);
  } catch (error) {
    return routeErrorResponse("PATCH", error, "Failed to update item", 400);
  }
}
