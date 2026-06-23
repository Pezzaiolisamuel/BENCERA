import type { ItemImageKey } from "@/types/item";

type StringArraySource = string | readonly unknown[] | null | undefined;

type NormalizedItemImages = Partial<Record<ItemImageKey, readonly string[]>>;

export type ItemImageSource = {
  images?: NormalizedItemImages | null;
  imagesAbove?: StringArraySource;
  imagesDetailed?: StringArraySource;
  imagesBackground?: StringArraySource;
  imagesHowToUse?: StringArraySource;
};

export function parseStringArray(value: StringArraySource): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }

  if (typeof value !== "string") return [];

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === "string")
      : [];
  } catch {
    return [];
  }
}

export function getItemThumbnail(item: ItemImageSource): string {
  const normalizedImages = item.images;
  const normalizedThumbnail =
    normalizedImages?.above?.[0] ||
    normalizedImages?.detailed?.[0] ||
    normalizedImages?.background?.[0] ||
    normalizedImages?.howToUse?.[0];

  if (normalizedThumbnail) return normalizedThumbnail;

  // Raw database records expose JSON strings instead of the normalized images object.
  const above = parseStringArray(item.imagesAbove);
  const detailed = parseStringArray(item.imagesDetailed);
  const background = parseStringArray(item.imagesBackground);
  const howToUse = parseStringArray(item.imagesHowToUse);

  return above[0] || detailed[0] || background[0] || howToUse[0] || "";
}
