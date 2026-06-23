import { ItemSchema, ItemUpdateSchema } from "@/validators/item";
import type { ParsedCreateItemForm, ParsedUpdateItemForm } from "./form-data";

type CreateImageUrls = {
  imagesAbove: string[];
  imagesDetailed: string[];
  imagesBackground: string[];
  imagesHowToUse: string[];
};

type UpdateImageValues = {
  imagesAbove: string[];
  imagesDetailed: string[];
  imagesBackground: unknown;
  imagesHowToUse: unknown;
};

export function buildCreateItemData(
  formValues: ParsedCreateItemForm,
  imageUrls: CreateImageUrls
) {
  return ItemSchema.parse({
    name: formValues.name,
    shopify: formValues.shopify,
    type: formValues.type,
    category: formValues.category,
    availableColors: formValues.availableColors,
    matchingPalette: formValues.matchingPalette,
    imagesAbove: imageUrls.imagesAbove,
    imagesDetailed: imageUrls.imagesDetailed,
    imagesBackground: imageUrls.imagesBackground,
    imagesHowToUse: imageUrls.imagesHowToUse,
    shortDescription: formValues.shortDescription,
    longDescription: formValues.longDescription,
    collectionName: formValues.collectionName,
    season: formValues.season,
    sizes: formValues.sizes,
    productsInCollection: formValues.productsInCollection,
    unique: formValues.unique,
    handmade: formValues.handmade,
    material: formValues.material,
  });
}

export function buildUpdateItemData(
  id: string,
  formValues: ParsedUpdateItemForm,
  images: UpdateImageValues
) {
  return ItemUpdateSchema.parse({
    id,
    name: formValues.name,
    shopify: formValues.shopify,
    type: formValues.type,
    category: formValues.category,
    availableColors: formValues.availableColors,
    matchingPalette: formValues.matchingPalette,
    imagesAbove: images.imagesAbove,
    imagesDetailed: images.imagesDetailed,
    imagesBackground: images.imagesBackground,
    imagesHowToUse: images.imagesHowToUse,
    shortDescription: formValues.shortDescription,
    longDescription: formValues.longDescription,
    collectionName: formValues.collectionName,
    season: formValues.season,
    sizes: formValues.sizes,
    productsInCollection: formValues.productsInCollection,
    unique: formValues.unique,
    handmade: formValues.handmade,
    material: formValues.material,
  });
}

export type CreateItemData = ReturnType<typeof buildCreateItemData>;
export type UpdateItemData = ReturnType<typeof buildUpdateItemData>;
