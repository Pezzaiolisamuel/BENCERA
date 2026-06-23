import { useCallback, useState } from "react";
import { parseStoredItems } from "@/lib/item-data";
import type { Item } from "@/types/item";

export function useAdminCatalog() {
  const [catalogItems, setCatalogItems] = useState<Item[]>([]);

  const fetchItems = useCallback(async () => {
    try {
      const response = await fetch("/api/items", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setCatalogItems(parseStoredItems(data));
    } catch (error) {
      console.error(error);
    }
  }, []);

  const handleDeleteItem = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/items?id=${id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Delete failed");
      }

      setCatalogItems((currentItems) => currentItems.filter((item) => item.id !== id));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Delete failed";
      console.error(error);
      alert(message);
    }
  }, []);

  return { catalogItems, fetchItems, handleDeleteItem };
}
