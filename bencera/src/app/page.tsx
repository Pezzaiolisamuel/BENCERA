import GalleryViewport from "@/components/GalleryViewport";
import { fetchStoredCatalogItems } from "@/lib/catalog-items";
import { parseStoredItems } from "@/lib/item-data";
import type { Item } from "@/types/item";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  let parsedItems: Item[] = [];

  try {
    const items = await fetchStoredCatalogItems();
    parsedItems = parseStoredItems(items);
  } catch (error) {
    console.error("HomePage catalog fetch failed:", error);
  }

  return <GalleryViewport items={parsedItems} />;
}
