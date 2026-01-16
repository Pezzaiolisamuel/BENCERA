import { prisma } from "../lib/prism";
import GalleryViewport from "@/components/GalleryViewport";

export default async function HomePage() {
  const items = await prisma.item.findMany();

  // Parse JSON fields
  const parsedItems = items.map((item) => ({
    ...item,
    availableColors: JSON.parse(item.availableColors || "[]"),
    matchingPalette: JSON.parse(item.matchingPalette || "[]"),
    sizes: JSON.parse(item.sizes || "[]"),
    images: {
      above: JSON.parse(item.imagesAbove || "[]"),
      detailed: JSON.parse(item.imagesDetailed || "[]"),
      background: JSON.parse(item.imagesBackground || "[]"),
      howToUse: JSON.parse(item.imagesHowToUse || "[]"),
    },
  }));

  return <GalleryViewport items={parsedItems} />;
}
