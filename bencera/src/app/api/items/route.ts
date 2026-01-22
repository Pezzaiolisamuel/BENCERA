import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prism";
import { ItemSchema } from "@/validators/item";
import { uploadFileToCloudinary } from "@/lib/cloudinary";
import { deleteFromCloudinaryByUrl } from "@/lib/cloudinary-delete";


// Upload helper: files -> Cloudinary URLs
async function filesToCloudinaryUrls(files: File[] | null, folder: string) {
  if (!files || files.length === 0) return [];
  return Promise.all(files.map((f) => uploadFileToCloudinary(f, folder)));
}

export async function GET() {
  try {
    const items = await prisma.item.findMany({
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(items);
  } catch (err: any) {
    console.error("❌ GET /api/items ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  console.log("🔥 POST /api/items HIT");

  try {
    const formData = await req.formData();
    console.log("FORMDATA KEYS:", Array.from(formData.keys()));

const dbg = (key: string) =>
  formData.getAll(key).map((v) => {
    // v can be File or string
    if (typeof v === "string") return { kind: "string", len: v.length, head: v.slice(0, 30) };
    return { kind: "file", name: v.name, type: v.type, size: v.size };
  });

console.log("imagesDetailed:", dbg("imagesDetailed"));
console.log("imagesAbove:", dbg("imagesAbove"));
console.log("imagesBackground:", dbg("imagesBackground"));
console.log("imagesHowToUse:", dbg("imagesHowToUse"));


    // Text fields
    const name = formData.get("name")?.toString() || "";
    const type = formData.get("type")?.toString() || "";
    const category = formData.get("category")?.toString() || "";
    const shortDescription = formData.get("shortDescription")?.toString() || "";
    const longDescription = formData.get("longDescription")?.toString() || "";
    const collectionName = formData.get("collectionName")?.toString() || "";
    const season = formData.get("season")?.toString() || "";
    const productsInCollection = Number(formData.get("productsInCollection") || 0);
    const material = formData.get("material")?.toString() || "";

    // Arrays (stored as JSON strings in DB)
    const availableColors =
      formData
        .get("availableColors")
        ?.toString()
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean) || [];

    const matchingPalette =
      formData
        .get("matchingPalette")
        ?.toString()
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean) || [];

    const sizes =
      formData
        .get("sizes")
        ?.toString()
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean) || [];

    // Booleans
    const unique = formData.get("unique") === "true" || formData.get("unique") === "on";
    const handmade = formData.get("handmade") === "true" || formData.get("handmade") === "on";

    // Files
    const imagesAboveFiles = formData.getAll("imagesAbove") as File[];
    const imagesDetailedFiles = formData.getAll("imagesDetailed") as File[];
    const imagesBackgroundFiles = formData.getAll("imagesBackground") as File[];
    const imagesHowToUseFiles = formData.getAll("imagesHowToUse") as File[];

    // Upload to Cloudinary -> get URLs
    const [imagesAbove, imagesDetailed, imagesBackground, imagesHowToUse] = await Promise.all([
      filesToCloudinaryUrls(imagesAboveFiles, "bencera/items/above"),
      filesToCloudinaryUrls(imagesDetailedFiles, "bencera/items/detailed"),
      filesToCloudinaryUrls(imagesBackgroundFiles, "bencera/items/background"),
      filesToCloudinaryUrls(imagesHowToUseFiles, "bencera/items/howto"),
    ]);

    console.log("UPLOAD RESULT imagesAbove:", imagesAbove);
console.log("UPLOAD RESULT imagesDetailed:", imagesDetailed);
console.log("UPLOAD RESULT imagesBackground:", imagesBackground);
console.log("UPLOAD RESULT imagesHowToUse:", imagesHowToUse);


    // Validate (IMPORTANT: your ItemSchema should accept arrays of strings (URLs))
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

    // Save to DB (store arrays as JSON strings, like you already do)
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

    console.log("✅ CREATED ITEM:", item.id);
    return NextResponse.json(item, { status: 201 });
  } catch (err: any) {
    console.error("❌ POST /api/items ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

function safeJsonParseArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export async function DELETE(req: Request) {
  console.log("🗑️ DELETE /api/items HIT");

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing item id" }, { status: 400 });
    }

    // 1) Fetch item first to get image URLs
    const item = await prisma.item.findUnique({ where: { id } });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // 2) Collect all image URLs from the JSON-string columns
    const urls = [
      ...safeJsonParseArray(item.imagesAbove),
      ...safeJsonParseArray(item.imagesDetailed),
      ...safeJsonParseArray(item.imagesBackground),
      ...safeJsonParseArray(item.imagesHowToUse),
    ].filter(Boolean);

    // 3) Delete images in Cloudinary (best effort)
    // Only attempt delete for Cloudinary URLs
    const cloudinaryUrls = urls.filter((u) => u.includes("res.cloudinary.com"));

    const results = await Promise.allSettled(
      cloudinaryUrls.map(async (url) => {
        const res = await deleteFromCloudinaryByUrl(url);
        return { url, res };
      })
    );

    const deleted: any[] = [];
    const failed: any[] = [];

    for (const r of results) {
      if (r.status === "fulfilled") deleted.push(r.value);
      else failed.push({ error: String(r.reason) });
    }

    // 4) Delete DB row
    const deletedItem = await prisma.item.delete({ where: { id } });

    console.log("✅ DELETED ITEM:", id);
    if (failed.length) console.warn("⚠️ Cloudinary delete failures:", failed);

    return NextResponse.json({
      message: "Item deleted",
      item: deletedItem,
      cloudinary: {
        attempted: cloudinaryUrls.length,
        deleted: deleted.length,
        failed,
      },
    });
  } catch (err: any) {
    console.error("❌ DELETE /api/items ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

