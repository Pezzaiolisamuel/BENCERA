import { prisma } from "../lib/prism";
import GalleryViewport from "@/components/GalleryViewport";

export default async function HomePage() {
  const items = await prisma.item.findMany();

  return <GalleryViewport items={items} />;
}
