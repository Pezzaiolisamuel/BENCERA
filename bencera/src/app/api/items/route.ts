import { prisma } from "../../../lib/prism";
import { NextResponse } from "next/server";
import { ItemSchema } from "@/validators/item";

export async function GET() {
  console.log("🔥 GET /api/items HIT");

  const items = await prisma.item.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  console.log("🔥🔥🔥 POST /api/items HIT");

  try {
    // Parse formData (supports files)
    const formData = await req.formData();

    // Extract JSON fields
    const name = formData.get("name")?.toString() || "";
    const type = formData.get("type")?.toString() || "";
    const category = formData.get("category")?.toString() || "";
    const availableColors = formData.get("availableColors")?.toString().split(",").map(s => s.trim()) || [];
    const matchingPalette = formData.get("matchingPalette")?.toString().split(",").map(s => s.trim()) || [];
    const shortDescription = formData.get("shortDescription")?.toString() || "";
    const longDescription = formData.get("longDescription")?.toString() || "";
    const collectionName = formData.get("collectionName")?.toString() || "";
    const season = formData.get("season")?.toString() || "";
    const sizes = formData.get("sizes")?.toString().split(",").map(s => s.trim()) || [];
    const productsInCollection = Number(formData.get("productsInCollection") || 0);
    const unique = formData.get("unique") === "true" || formData.get("unique") === "on";
    const handmade = formData.get("handmade") === "true" || formData.get("handmade") === "on";
    const material = formData.get("material")?.toString() || "";

    // Helper to convert File to Base64 string
    const filesToBase64 = async (files: File[] | null) => {
      if (!files || files.length === 0) return [];
      const promises = files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        return `data:${file.type};base64,${Buffer.from(arrayBuffer).toString("base64")}`;
      });
      return Promise.all(promises);
    };

    // Extract files from formData
    const imagesAboveFiles = formData.getAll("imagesAbove") as File[];
    const imagesDetailedFiles = formData.getAll("imagesDetailed") as File[];
    const imagesBackgroundFiles = formData.getAll("imagesBackground") as File[];
    const imagesHowToUseFiles = formData.getAll("imagesHowToUse") as File[];

    // Convert to base64
    const [imagesAbove, imagesDetailed, imagesBackground, imagesHowToUse] = await Promise.all([
      filesToBase64(imagesAboveFiles),
      filesToBase64(imagesDetailedFiles),
      filesToBase64(imagesBackgroundFiles),
      filesToBase64(imagesHowToUseFiles),
    ]);

    // Validate with Zod
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

    console.log("✅ CREATED ITEM:", item.id);

    return NextResponse.json(item, { status: 201 });
  } catch (err: any) {
    console.error("❌ POST ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 400 });
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

    const deletedItem = await prisma.item.delete({
      where: { id },
    });

    console.log("✅ DELETED ITEM:", id);
    return NextResponse.json({ message: "Item deleted", item: deletedItem });
  } catch (err: any) {
    console.error("❌ DELETE ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
