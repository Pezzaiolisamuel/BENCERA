import "server-only";
import { deleteFromCloudinaryByUrl } from "@/lib/cloudinary-delete";
import { getStoredItemImageUrls } from "@/lib/item-data";
import type { ItemWithoutShopify } from "./item-repository";

export async function cleanupDeletedItemImages(item: ItemWithoutShopify) {
  const cloudinaryUrls = getStoredItemImageUrls(item).filter((url) =>
    url.includes("res.cloudinary.com")
  );

  const results = await Promise.allSettled(
    cloudinaryUrls.map(async (url) => ({
      url,
      result: await deleteFromCloudinaryByUrl(url),
    }))
  );

  const deleted: Array<{ url: string; result: unknown }> = [];
  const failed: Array<{ error: string }> = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      deleted.push(result.value);
    } else {
      failed.push({ error: String(result.reason) });
    }
  }

  return {
    attempted: cloudinaryUrls.length,
    deleted: deleted.length,
    failed,
  };
}
