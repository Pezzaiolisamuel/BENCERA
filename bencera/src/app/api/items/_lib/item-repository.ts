import "server-only";
import { randomUUID } from "crypto";
import { fetchStoredCatalogItems } from "@/lib/catalog-items";
import { prisma } from "@/lib/prism";
import type { StoredItem } from "@/types/item";
import type { CreateItemData, UpdateItemData } from "./item-data-builders";

const itemSelectWithoutShopify = {
  id: true,
  updatedAt: true,
  name: true,
  type: true,
  category: true,
  availableColors: true,
  matchingPalette: true,
  imagesAbove: true,
  imagesDetailed: true,
  imagesBackground: true,
  imagesHowToUse: true,
  shortDescription: true,
  longDescription: true,
  collectionName: true,
  season: true,
  sizes: true,
  productsInCollection: true,
  unique: true,
  handmade: true,
  material: true,
} as const;

async function ensureShopifyColumn() {
  await prisma.$executeRaw`
    ALTER TABLE "Item"
    ADD COLUMN IF NOT EXISTS "shopify" TEXT NOT NULL DEFAULT ''
  `;
}

export function listItems() {
  return fetchStoredCatalogItems({ orderByUpdatedAtDesc: true });
}

export function findItemById(id: string) {
  return prisma.item.findUnique({
    where: { id },
    select: itemSelectWithoutShopify,
  });
}

export async function createItem(data: CreateItemData) {
  const id = randomUUID();
  const updatedAt = new Date();
  await ensureShopifyColumn();

  const [item] = await prisma.$queryRaw<StoredItem[]>`
    INSERT INTO "Item" (
      "id",
      "updatedAt",
      "name",
      "shopify",
      "type",
      "category",
      "availableColors",
      "matchingPalette",
      "imagesAbove",
      "imagesDetailed",
      "imagesBackground",
      "imagesHowToUse",
      "shortDescription",
      "longDescription",
      "collectionName",
      "season",
      "sizes",
      "productsInCollection",
      "unique",
      "handmade",
      "material"
    )
    VALUES (
      ${id},
      ${updatedAt},
      ${data.name},
      ${data.shopify},
      ${data.type},
      ${data.category},
      ${JSON.stringify(data.availableColors)},
      ${JSON.stringify(data.matchingPalette)},
      ${JSON.stringify(data.imagesAbove)},
      ${JSON.stringify(data.imagesDetailed)},
      ${JSON.stringify(data.imagesBackground)},
      ${JSON.stringify(data.imagesHowToUse)},
      ${data.shortDescription},
      ${data.longDescription},
      ${data.collectionName},
      ${data.season},
      ${JSON.stringify(data.sizes)},
      ${data.productsInCollection},
      ${data.unique},
      ${data.handmade},
      ${data.material}
    )
    RETURNING
      "id",
      "updatedAt",
      "name",
      "shopify",
      "type",
      "category",
      "availableColors",
      "matchingPalette",
      "imagesAbove",
      "imagesDetailed",
      "imagesBackground",
      "imagesHowToUse",
      "shortDescription",
      "longDescription",
      "collectionName",
      "season",
      "sizes",
      "productsInCollection",
      "unique",
      "handmade",
      "material"
  `;

  if (!item) {
    throw new Error("Failed to create item");
  }

  return item;
}

export async function updateItem(data: UpdateItemData) {
  await ensureShopifyColumn();

  const [updatedItem] = await prisma.$queryRaw<StoredItem[]>`
    UPDATE "Item"
    SET
      "name" = ${data.name},
      "updatedAt" = ${new Date()},
      "shopify" = ${data.shopify},
      "type" = ${data.type},
      "category" = ${data.category},
      "availableColors" = ${JSON.stringify(data.availableColors)},
      "matchingPalette" = ${JSON.stringify(data.matchingPalette)},
      "imagesAbove" = ${JSON.stringify(data.imagesAbove)},
      "imagesDetailed" = ${JSON.stringify(data.imagesDetailed)},
      "shortDescription" = ${data.shortDescription},
      "longDescription" = ${data.longDescription},
      "collectionName" = ${data.collectionName},
      "season" = ${data.season},
      "sizes" = ${JSON.stringify(data.sizes)},
      "productsInCollection" = ${data.productsInCollection},
      "unique" = ${data.unique},
      "handmade" = ${data.handmade},
      "material" = ${data.material}
    WHERE "id" = ${data.id}
    RETURNING
      "id",
      "updatedAt",
      "name",
      "shopify",
      "type",
      "category",
      "availableColors",
      "matchingPalette",
      "imagesAbove",
      "imagesDetailed",
      "imagesBackground",
      "imagesHowToUse",
      "shortDescription",
      "longDescription",
      "collectionName",
      "season",
      "sizes",
      "productsInCollection",
      "unique",
      "handmade",
      "material"
  `;

  if (!updatedItem) {
    throw new Error("Failed to update item");
  }

  return updatedItem;
}

export function deleteItemById(id: string) {
  return prisma.item.delete({
    where: { id },
    select: itemSelectWithoutShopify,
  });
}

export type ItemWithoutShopify = NonNullable<Awaited<ReturnType<typeof findItemById>>>;
