import { prisma } from "@/lib/prism";
import { parseStoredItems } from "@/lib/item-data";
import MobileHomeViewport from "@/components/MobileHomeViewport";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MobileHomePage() {
  const items = await prisma.item.findMany();

  return <MobileHomeViewport items={parseStoredItems(items)} />;
}
