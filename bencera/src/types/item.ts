export type ItemImageKey = "above" | "detailed" | "background" | "howToUse";

export type ItemImages = {
  above: string[];
  detailed: string[];
  background: string[];
  howToUse: string[];
};

export type Item = {
  id: string;
  updatedAt: string | Date;
  name: string;
  shopify: string;
  type: string;
  category: string;
  availableColors: string[];
  matchingPalette: string[];
  images: ItemImages;
  shortDescription: string;
  longDescription: string;
  collectionName: string;
  season: string;
  sizes: string[];
  productsInCollection: number;
  unique: boolean;
  handmade: boolean;
  material: string;
};

export type StoredItem = Omit<
  Item,
  "availableColors" | "matchingPalette" | "images" | "sizes"
> & {
  availableColors: string | null;
  matchingPalette: string | null;
  shopify: string | null;
  imagesAbove: string | null;
  imagesDetailed: string | null;
  imagesBackground: string | null;
  imagesHowToUse: string | null;
  sizes: string | null;
};
