import { z } from "zod";

export const ItemSchema = z.object({
  name: z.string(),
  shopify: z.string().url(),
  type: z.string(),
  category: z.string(),

  availableColors: z.array(z.string()),
  matchingPalette: z.array(z.string()),

  imagesAbove: z.array(z.string()).min(1),
  imagesDetailed: z.array(z.string()).min(1),
  imagesBackground: z.array(z.string()),
  imagesHowToUse: z.array(z.string()),

  shortDescription: z.string(),
  longDescription: z.string(),

  collectionName: z.string(),
  season: z.string(),

  sizes: z.array(z.string()),
  productsInCollection: z.number().int().min(0),

  unique: z.boolean(),
  handmade: z.boolean(),
  material: z.string(),
});

export const ItemUpdateSchema = ItemSchema.extend({
  id: z.string().min(1),
});
