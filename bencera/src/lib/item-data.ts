import type { Item, ItemImageKey, StoredItem } from "@/types/item";

export const itemImageFieldMap: Record<ItemImageKey, keyof StoredItem> = {
  above: "imagesAbove",
  detailed: "imagesDetailed",
  background: "imagesBackground",
  howToUse: "imagesHowToUse",
};

const storedItemImageFieldNames = [
  "imagesAbove",
  "imagesDetailed",
  "imagesBackground",
  "imagesHowToUse",
] as const;

export function safeParseStringArray(value: string | null | undefined): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === "string")
      : [];
  } catch {
    return [];
  }
}

type StoredItemLike = Omit<StoredItem, "shopify"> & {
  shopify?: string | null;
};

export function parseStoredItem(record: StoredItemLike): Item {
  return {
    ...record,
    shopify: record.shopify?.trim() || "shopify.com",
    availableColors: safeParseStringArray(record.availableColors),
    matchingPalette: safeParseStringArray(record.matchingPalette),
    sizes: safeParseStringArray(record.sizes),
    images: {
      above: safeParseStringArray(record.imagesAbove),
      detailed: safeParseStringArray(record.imagesDetailed),
      background: safeParseStringArray(record.imagesBackground),
      howToUse: safeParseStringArray(record.imagesHowToUse),
    },
  };
}

export function parseStoredItems(records: StoredItemLike[]): Item[] {
  return records.map(parseStoredItem);
}

type StoredItemImageFields = {
  imagesAbove: string | null;
  imagesDetailed: string | null;
  imagesBackground: string | null;
  imagesHowToUse: string | null;
};

export function getStoredItemImageUrls(record: StoredItemImageFields): string[] {
  return storedItemImageFieldNames.flatMap((fieldName) =>
    safeParseStringArray(record[fieldName])
  );
}
