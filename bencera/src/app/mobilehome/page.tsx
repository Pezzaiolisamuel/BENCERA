import { fetchStoredCatalogItems } from "@/lib/catalog-items";
import { parseStoredItems } from "@/lib/item-data";
import MobileHomeViewport from "@/components/MobileHomeViewport";
import type { Item } from "@/types/item";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MobileHomePage() {
  let parsedItems: Item[] = [];

  try {
    const items = await fetchStoredCatalogItems();
    parsedItems = parseStoredItems(items);
  } catch (error) {
    console.error("MobileHomePage catalog fetch failed:", error);
  }

  return <MobileHomeViewport items={parsedItems} />;
}
