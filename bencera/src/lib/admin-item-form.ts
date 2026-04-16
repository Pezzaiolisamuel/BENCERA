import type { ItemImageKey } from "@/types/item";

export interface ImagePreview {
  file: File;
  url: string;
}

export type ItemFormValues = {
  name: string;
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

export const initialItemFormValues: ItemFormValues = {
  name: "",
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

export function buildItemFormData(values: ItemFormValues, imageGroups: ImagePreviewGroups) {
  const formData = new FormData();

  formData.append("name", values.name);
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
