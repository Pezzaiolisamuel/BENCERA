export function getFormString(formData: FormData, fieldName: string) {
  return formData.get(fieldName)?.toString() || "";
}

export function getImageFiles(formData: FormData, fieldName: string) {
  return formData
    .getAll(fieldName)
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

export function splitCommaSeparatedValue(value: unknown) {
  return String(value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function getJsonStringArrayFormValue(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === "string")
      : [];
  } catch {
    return [];
  }
}

export function parseCreateItemFormData(formData: FormData) {
  return {
    name: getFormString(formData, "name"),
    shopify: getFormString(formData, "shopify"),
    type: getFormString(formData, "type"),
    category: getFormString(formData, "category"),
    shortDescription: getFormString(formData, "shortDescription"),
    longDescription: getFormString(formData, "longDescription"),
    collectionName: getFormString(formData, "collectionName"),
    season: getFormString(formData, "season"),
    productsInCollection: Number(formData.get("productsInCollection") || 0),
    material: getFormString(formData, "material"),
    availableColors: splitCommaSeparatedValue(formData.get("availableColors")),
    matchingPalette: splitCommaSeparatedValue(formData.get("matchingPalette")),
    sizes: splitCommaSeparatedValue(formData.get("sizes")),
    unique: formData.get("unique") === "true" || formData.get("unique") === "on",
    handmade: formData.get("handmade") === "true" || formData.get("handmade") === "on",
    imagesAboveFiles: getImageFiles(formData, "imagesAbove"),
    imagesDetailedFiles: getImageFiles(formData, "imagesDetailed"),
    imagesBackgroundFiles: getImageFiles(formData, "imagesBackground"),
    imagesHowToUseFiles: getImageFiles(formData, "imagesHowToUse"),
  };
}

export function parseUpdateItemFormData(formData: FormData) {
  return {
    name: String(formData.get("name") || ""),
    shopify: String(formData.get("shopify") || ""),
    type: String(formData.get("type") || ""),
    category: String(formData.get("category") || ""),
    availableColors: splitCommaSeparatedValue(formData.get("availableColors")),
    matchingPalette: splitCommaSeparatedValue(formData.get("matchingPalette")),
    retainedImagesAbove: getJsonStringArrayFormValue(formData, "existingImagesAbove"),
    retainedImagesDetailed: getJsonStringArrayFormValue(formData, "existingImagesDetailed"),
    newAboveImageFiles: getImageFiles(formData, "imagesAbove"),
    newDetailedImageFiles: getImageFiles(formData, "imagesDetailed"),
    shortDescription: String(formData.get("shortDescription") || ""),
    longDescription: String(formData.get("longDescription") || ""),
    collectionName: String(formData.get("collectionName") || ""),
    season: String(formData.get("season") || ""),
    sizes: splitCommaSeparatedValue(formData.get("sizes")),
    productsInCollection: Number(formData.get("productsInCollection") || 0),
    unique: String(formData.get("unique") || "") === "true",
    handmade: String(formData.get("handmade") || "") === "true",
    material: String(formData.get("material") || ""),
  };
}

export type ParsedCreateItemForm = ReturnType<typeof parseCreateItemFormData>;
export type ParsedUpdateItemForm = ReturnType<typeof parseUpdateItemFormData>;
