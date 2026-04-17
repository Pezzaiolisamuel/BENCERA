import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prism";
import type { StoredItem } from "@/types/item";

const catalogItemSelectBase = {
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

const catalogItemSelectWithShopify = {
  ...catalogItemSelectBase,
  shopify: true,
} as const;

type CatalogQueryOptions = {
  orderByUpdatedAtDesc?: boolean;
};

type CatalogItemWithoutShopify = Omit<StoredItem, "shopify">;

function isMissingShopifyColumnError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2022";
  }

  return error instanceof Error && /shopify/i.test(error.message);
}

export async function fetchStoredCatalogItems(
  options: CatalogQueryOptions = {}
): Promise<StoredItem[]> {
  const { orderByUpdatedAtDesc = false } = options;

  try {
    if (orderByUpdatedAtDesc) {
      return await prisma.item.findMany({
        orderBy: { updatedAt: "desc" },
        select: catalogItemSelectWithShopify,
      });
    }

    return await prisma.item.findMany({
      select: catalogItemSelectWithShopify,
    });
  } catch (error) {
    if (!isMissingShopifyColumnError(error)) {
      throw error;
    }

    const itemsWithoutShopify = orderByUpdatedAtDesc
      ? await prisma.item.findMany({
          orderBy: { updatedAt: "desc" },
          select: catalogItemSelectBase,
        })
      : await prisma.item.findMany({
          select: catalogItemSelectBase,
        });

    return itemsWithoutShopify.map((item) => ({
      ...(item as CatalogItemWithoutShopify),
      shopify: "shopify.com",
    }));
  }
}
