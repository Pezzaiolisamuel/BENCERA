import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prism";
import { ItemSchema } from "@/validators/item";
import { uploadFileToCloudinary } from "@/lib/cloudinary";
import { deleteFromCloudinaryByUrl } from "@/lib/cloudinary-delete";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { getStoredItemImageUrls } from "@/lib/item-data";

async function filesToCloudinaryUrls(files: File[], folder: string) {
  if (!files.length) return [];
  return Promise.all(files.map((file) => uploadFileToCloudinary(file, folder)));
}

function requireAdminSession(req: Request) {
  return isAdminAuthenticated(req, process.env.ADMIN_SESSION_SECRET || "");
}

export async function GET(req: Request) {
  if (!requireAdminSession(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const items = await prisma.item.findMany({
      orderBy: { updatedAt: "desc" },
    });

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
    const formData = await req.formData();

    const name = formData.get("name")?.toString() || "";
    const type = formData.get("type")?.toString() || "";
    const category = formData.get("category")?.toString() || "";
    const shortDescription = formData.get("shortDescription")?.toString() || "";
    const longDescription = formData.get("longDescription")?.toString() || "";
    const collectionName = formData.get("collectionName")?.toString() || "";
    const season = formData.get("season")?.toString() || "";
    const productsInCollection = Number(formData.get("productsInCollection") || 0);
    const material = formData.get("material")?.toString() || "";

    const availableColors =
      formData
        .get("availableColors")
        ?.toString()
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean) || [];

    const matchingPalette =
      formData
        .get("matchingPalette")
        ?.toString()
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean) || [];

    const sizes =
      formData
        .get("sizes")
        ?.toString()
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean) || [];

    const unique = formData.get("unique") === "true" || formData.get("unique") === "on";
    const handmade = formData.get("handmade") === "true" || formData.get("handmade") === "on";

    const imagesAboveFiles = formData.getAll("imagesAbove") as File[];
    const imagesDetailedFiles = formData.getAll("imagesDetailed") as File[];
    const imagesBackgroundFiles = formData.getAll("imagesBackground") as File[];
    const imagesHowToUseFiles = formData.getAll("imagesHowToUse") as File[];

    const [imagesAbove, imagesDetailed, imagesBackground, imagesHowToUse] = await Promise.all([
      filesToCloudinaryUrls(imagesAboveFiles, "bencera/items/above"),
      filesToCloudinaryUrls(imagesDetailedFiles, "bencera/items/detailed"),
      filesToCloudinaryUrls(imagesBackgroundFiles, "bencera/items/background"),
      filesToCloudinaryUrls(imagesHowToUseFiles, "bencera/items/howto"),
    ]);

    const data = ItemSchema.parse({
      name,
      type,
      category,
      availableColors,
      matchingPalette,
      imagesAbove,
      imagesDetailed,
      imagesBackground,
      imagesHowToUse,
      shortDescription,
      longDescription,
      collectionName,
      season,
      sizes,
      productsInCollection,
      unique,
      handmade,
      material,
    });

    const item = await prisma.item.create({
      data: {
        name: data.name,
        type: data.type,
        category: data.category,
        availableColors: JSON.stringify(data.availableColors),
        matchingPalette: JSON.stringify(data.matchingPalette),
        imagesAbove: JSON.stringify(data.imagesAbove),
        imagesDetailed: JSON.stringify(data.imagesDetailed),
        imagesBackground: JSON.stringify(data.imagesBackground),
        imagesHowToUse: JSON.stringify(data.imagesHowToUse),
        shortDescription: data.shortDescription,
        longDescription: data.longDescription,
        collectionName: data.collectionName,
        season: data.season,
        sizes: JSON.stringify(data.sizes),
        productsInCollection: data.productsInCollection,
        unique: data.unique,
        handmade: data.handmade,
        material: data.material,
      },
    });

    return NextResponse.json(item, { status: 201 });
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

    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const cloudinaryUrls = getStoredItemImageUrls(item).filter((url) =>
      url.includes("res.cloudinary.com")
    );

    const results = await Promise.allSettled(
      cloudinaryUrls.map(async (url) => ({
        url,
        result: await deleteFromCloudinaryByUrl(url),
      }))
    );

    const deleted: Array<{ url: string; result: unknown }> = [];
    const failed: Array<{ error: string }> = [];

    for (const result of results) {
      if (result.status === "fulfilled") {
        deleted.push(result.value);
      } else {
        failed.push({ error: String(result.reason) });
      }
    }

    const deletedItem = await prisma.item.delete({ where: { id } });

    return NextResponse.json({
      message: "Item deleted",
      item: deletedItem,
      cloudinary: {
        attempted: cloudinaryUrls.length,
        deleted: deleted.length,
        failed,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete item";
    console.error("DELETE /api/items error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
