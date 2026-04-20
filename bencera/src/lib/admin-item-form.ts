import type { Item, ItemImageKey } from "@/types/item";

export interface ImagePreview {
  file: File;
  url: string;
}

export type ItemFormValues = {
  name: string;
  shopify: string;
  type: string;
  category: string;
  season: string;
  collectionName: string;
  shortDescription: string;
  longDescription: string;
  material: string;
  productsInCollection: string;
  availableColors: string;
  matchingPalette: string;
  sizes: string;
  unique: boolean;
  handmade: boolean;
};

export type ImagePreviewGroups = Record<ItemImageKey, ImagePreview[]>;
export type ImageUploadFieldName = "imagesAbove" | "imagesDetailed" | "imagesBackground" | "imagesHowToUse";
export const maxImagesPerItem = 5;
export const maxImageFileSizeBytes = 4 * 1024 * 1024;
export const maxTotalImageUploadBytes = 4 * 1024 * 1024;

export function formatFileSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const initialItemFormValues: ItemFormValues = {
  name: "",
  shopify: "shopify.com",
  type: "",
  category: "",
  season: "",
  collectionName: "",
  shortDescription: "",
  longDescription: "",
  material: "",
  productsInCollection: "",
  availableColors: "",
  matchingPalette: "",
  sizes: "",
  unique: false,
  handmade: false,
};

export const emptyImagePreviewGroups: ImagePreviewGroups = {
  above: [],
  detailed: [],
  background: [],
  howToUse: [],
};

export function createEmptyImagePreviewGroups(): ImagePreviewGroups {
  return {
    above: [],
    detailed: [],
    background: [],
    howToUse: [],
  };
}

export const requiredItemFormFields: Array<keyof ItemFormValues> = [
  "name",
  "shopify",
  "type",
  "category",
  "season",
  "collectionName",
  "shortDescription",
  "longDescription",
  "material",
  "productsInCollection",
];

export const imageUploadSections: Array<{
  key: ItemImageKey;
  label: string;
  fieldName: ImageUploadFieldName;
}> = [
  { key: "above", label: "Above", fieldName: "imagesAbove" },
  { key: "detailed", label: "Detailed", fieldName: "imagesDetailed" },
  { key: "background", label: "Background", fieldName: "imagesBackground" },
  { key: "howToUse", label: "HowToUse", fieldName: "imagesHowToUse" },
];

export function validateItemForm(values: ItemFormValues) {
  for (const fieldName of requiredItemFormFields) {
    const value = values[fieldName];
    if (typeof value === "string" && !value.trim()) {
      return "Please fill in all required fields.";
    }
  }

  return null;
}

export function createItemFormValuesFromItem(item: Item): ItemFormValues {
  return {
    name: item.name,
    shopify: item.shopify || "shopify.com",
    type: item.type,
    category: item.category,
    season: item.season,
    collectionName: item.collectionName,
    shortDescription: item.shortDescription,
    longDescription: item.longDescription,
    material: item.material,
    productsInCollection: String(item.productsInCollection),
    availableColors: item.availableColors.join(", "),
    matchingPalette: item.matchingPalette.join(", "),
    sizes: item.sizes.join(", "),
    unique: item.unique,
    handmade: item.handmade,
  };
}

export function getImagePreviewCount(groups: ImagePreviewGroups) {
  return groups.above.length + groups.detailed.length + groups.background.length + groups.howToUse.length;
}

export function buildItemFormData(values: ItemFormValues, imageGroups: ImagePreviewGroups) {
  const formData = new FormData();

  formData.append("name", values.name);
  formData.append("shopify", values.shopify);
  formData.append("type", values.type);
  formData.append("category", values.category);
  formData.append("season", values.season);
  formData.append("collectionName", values.collectionName);
  formData.append("shortDescription", values.shortDescription);
  formData.append("longDescription", values.longDescription);
  formData.append("material", values.material);
  formData.append("productsInCollection", values.productsInCollection);
  formData.append("availableColors", values.availableColors);
  formData.append("matchingPalette", values.matchingPalette);
  formData.append("sizes", values.sizes);
  formData.append("unique", String(values.unique));
  formData.append("handmade", String(values.handmade));

  for (const section of imageUploadSections) {
    for (const image of imageGroups[section.key]) {
      formData.append(section.fieldName, image.file);
    }
  }

  return formData;
}
