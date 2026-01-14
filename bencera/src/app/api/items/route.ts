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
    const body = await req.json();
    console.log("📦 BODY:", body);

    const data = ItemSchema.parse(body);

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
