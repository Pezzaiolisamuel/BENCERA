import type { Item, ItemImageKey, StoredItem } from "@/types/item";

export const itemImageFieldMap: Record<ItemImageKey, keyof StoredItem> = {
  above: "imagesAbove",
  detailed: "imagesDetailed",
  background: "imagesBackground",
  howToUse: "imagesHowToUse",
};

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

export function parseStoredItem(record: StoredItem): Item {
  return {
    ...record,
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

export function parseStoredItems(records: StoredItem[]): Item[] {
  return records.map(parseStoredItem);
}

export function getStoredItemImageUrls(record: Pick<StoredItem, keyof typeof itemImageFieldMap>): string[] {
  return Object.values(itemImageFieldMap).flatMap((fieldName) =>
    safeParseStringArray(record[fieldName])
  );
}
