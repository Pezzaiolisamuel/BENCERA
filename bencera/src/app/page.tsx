import { prisma } from "../lib/prism";
import GalleryViewport from "@/components/GalleryViewport";
import { parseStoredItems } from "@/lib/item-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const items = await prisma.item.findMany();
  return <GalleryViewport items={parseStoredItems(items)} />;
}
