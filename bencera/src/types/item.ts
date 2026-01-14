export type Item = {
  id: string;
  updatedAt: string;
  name: string;
  type: string;
  category: string;
  availableColors: string[];
  matchingPalette: string[];
  images: {
    above: string[];
    detailed: string[];
    background: string[];
    howToUse: string[];
  };
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
