import "server-only";
import { maxImagesPerItem } from "@/lib/item-image-policy";
import { cleanupDeletedItemImages } from "./deleted-image-cleanup";
import {
  getFormString,
  parseCreateItemFormData,
  parseUpdateItemFormData,
} from "./form-data";
import {
  uploadCreateItemImages,
  uploadUpdateItemImages,
  validateImageUploadSize,
} from "./image-upload";
import { buildCreateItemData, buildUpdateItemData } from "./item-data-builders";
import { createItem, deleteItemById, findItemById, updateItem } from "./item-repository";

type OperationResult = {
  body: unknown;
  status: number;
};

export async function createItemFromFormData(formData: FormData): Promise<OperationResult> {
  const parsedForm = parseCreateItemFormData(formData);
  const imageUploadSizeError = validateImageUploadSize([
    ...parsedForm.imagesAboveFiles,
    ...parsedForm.imagesDetailedFiles,
    ...parsedForm.imagesBackgroundFiles,
    ...parsedForm.imagesHowToUseFiles,
  ]);

  if (imageUploadSizeError) {
    return { body: { error: imageUploadSizeError }, status: 413 };
  }

  const imageUrls = await uploadCreateItemImages(parsedForm);
  const data = buildCreateItemData(parsedForm, imageUrls);
  const item = await createItem(data);

  return { body: item, status: 201 };
}

export async function updateItemFromFormData(formData: FormData): Promise<OperationResult> {
  const id = getFormString(formData, "id");

  if (!id) {
    return { body: { error: "Missing item id" }, status: 400 };
  }

  const existingItem = await findItemById(id);
  if (!existingItem) {
    return { body: { error: "Item not found" }, status: 404 };
  }

  const existingImagesBackground = JSON.parse(existingItem.imagesBackground || "[]");
  const existingImagesHowToUse = JSON.parse(existingItem.imagesHowToUse || "[]");
  const parsedForm = parseUpdateItemFormData(formData);
  const imageUploadSizeError = validateImageUploadSize([
    ...parsedForm.newAboveImageFiles,
    ...parsedForm.newDetailedImageFiles,
  ]);

  if (imageUploadSizeError) {
    return { body: { error: imageUploadSizeError }, status: 413 };
  }

  const { newAboveImageUrls, newDetailedImageUrls } = await uploadUpdateItemImages(parsedForm);
  const nextAboveImages = [...parsedForm.retainedImagesAbove, ...newAboveImageUrls];
  const nextDetailedImages = [...parsedForm.retainedImagesDetailed, ...newDetailedImageUrls];

  if (!nextAboveImages.length) {
    return { body: { error: "A piece must have at least one above image." }, status: 400 };
  }

  if (!nextDetailedImages.length) {
    return { body: { error: "A piece must have at least one detailed image." }, status: 400 };
  }

  if (nextAboveImages.length > maxImagesPerItem) {
    return {
      body: { error: `A piece can have a maximum of ${maxImagesPerItem} above images.` },
      status: 400,
    };
  }

  if (nextDetailedImages.length > maxImagesPerItem) {
    return {
      body: { error: `A piece can have a maximum of ${maxImagesPerItem} detailed images.` },
      status: 400,
    };
  }

  const data = buildUpdateItemData(id, parsedForm, {
    imagesAbove: nextAboveImages,
    imagesDetailed: nextDetailedImages,
    imagesBackground: existingImagesBackground,
    imagesHowToUse: existingImagesHowToUse,
  });
  const updatedItem = await updateItem(data);

  return { body: updatedItem, status: 200 };
}

export async function deleteItem(id: string): Promise<OperationResult> {
  const item = await findItemById(id);
  if (!item) {
    return { body: { error: "Item not found" }, status: 404 };
  }

  const cloudinary = await cleanupDeletedItemImages(item);
  const deletedItem = await deleteItemById(id);

  return {
    body: {
      message: "Item deleted",
      item: deletedItem,
      cloudinary,
    },
    status: 200,
  };
}
