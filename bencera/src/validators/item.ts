import { z } from "zod";

export const ItemSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  category: z.string().min(1),

  availableColors: z.array(z.string()),
  matchingPalette: z.array(z.string()),

  imagesAbove: z.array(z.string()),
  imagesDetailed: z.array(z.string()),
  imagesBackground: z.array(z.string()),
  imagesHowToUse: z.array(z.string()),

  shortDescription: z.string().min(1),
  longDescription: z.string().min(1),

  collectionName: z.string().min(1),
  season: z.string().min(1),

  sizes: z.array(z.string()),
  productsInCollection: z.number().int().min(0),

  unique: z.boolean(),
  handmade: z.boolean(),
  material: z.string().min(1),
});
