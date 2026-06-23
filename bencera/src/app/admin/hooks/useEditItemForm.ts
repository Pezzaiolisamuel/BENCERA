import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import {
  createItemFormValuesFromItem,
  initialItemFormValues,
  maxImagesPerItem,
  type ImagePreview,
  type ItemFormValues,
  validateItemForm,
} from "@/lib/admin-item-form";
import type { Item } from "@/types/item";
import {
  createImagePreviews,
  getOversizedImageError,
  getTotalImageUploadError,
  removePreviewAt,
  revokePreviewUrls,
} from "./admin-image-previews";
import { readResponsePayload } from "./admin-request";

type EditableImageKey = "above" | "detailed";

type UseEditItemFormOptions = {
  refreshItems: () => Promise<void>;
};

export function useEditItemForm({ refreshItems }: UseEditItemFormOptions) {
  const [selectedEditItem, setSelectedEditItem] = useState<Item | null>(null);
  const [editFormValues, setEditFormValues] = useState<ItemFormValues>(initialItemFormValues);
  const [editExistingAboveImages, setEditExistingAboveImages] = useState<string[]>([]);
  const [editExistingDetailedImages, setEditExistingDetailedImages] = useState<string[]>([]);
  const [editAboveImagePreviews, setEditAboveImagePreviews] = useState<ImagePreview[]>([]);
  const [editDetailedImagePreviews, setEditDetailedImagePreviews] = useState<ImagePreview[]>([]);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [isUpdatingItem, setIsUpdatingItem] = useState(false);
  const abovePreviewsRef = useRef(editAboveImagePreviews);
  const detailedPreviewsRef = useRef(editDetailedImagePreviews);
  abovePreviewsRef.current = editAboveImagePreviews;
  detailedPreviewsRef.current = editDetailedImagePreviews;

  useEffect(() => {
    return () => {
      // Closing normally performs this cleanup; unmount cleanup covers navigation mid-edit.
      revokePreviewUrls([...abovePreviewsRef.current, ...detailedPreviewsRef.current]);
    };
  }, []);

  const updateEditField = (fieldName: keyof ItemFormValues, value: string | boolean) => {
    setEditFormValues((currentValues) => ({
      ...currentValues,
      [fieldName]: value,
    }));
  };

  const openEditModal = (item: Item) => {
    revokePreviewUrls([...editAboveImagePreviews, ...editDetailedImagePreviews]);
    setSelectedEditItem(item);
    setEditFormValues(createItemFormValuesFromItem(item));
    setEditExistingAboveImages(item.images.above);
    setEditExistingDetailedImages(item.images.detailed);
    setEditAboveImagePreviews([]);
    setEditDetailedImagePreviews([]);
    setEditFormError(null);
  };

  const closeEditModal = () => {
    revokePreviewUrls([...editAboveImagePreviews, ...editDetailedImagePreviews]);
    setSelectedEditItem(null);
    setEditFormValues(initialItemFormValues);
    setEditExistingAboveImages([]);
    setEditExistingDetailedImages([]);
    setEditAboveImagePreviews([]);
    setEditDetailedImagePreviews([]);
    setEditFormError(null);
    setIsUpdatingItem(false);
  };

  const handleEditImagesChange = (
    event: ChangeEvent<HTMLInputElement>,
    imageKey: EditableImageKey
  ) => {
    if (!selectedEditItem) return;

    const files = event.target.files;
    if (!files) return;
    const selectedFiles = Array.from(files);

    const oversizedImageError = getOversizedImageError(selectedFiles);
    if (oversizedImageError) {
      setEditFormError(oversizedImageError);
      event.target.value = "";
      return;
    }

    const existingCount =
      imageKey === "above" ? editExistingAboveImages.length : editExistingDetailedImages.length;
    const previewCount =
      imageKey === "above" ? editAboveImagePreviews.length : editDetailedImagePreviews.length;
    const remainingSlots = maxImagesPerItem - (existingCount + previewCount);
    const acceptedFiles = selectedFiles.slice(0, Math.max(remainingSlots, 0));
    const totalImageUploadError = getTotalImageUploadError([
      ...editAboveImagePreviews.map((preview) => preview.file),
      ...editDetailedImagePreviews.map((preview) => preview.file),
      ...acceptedFiles,
    ]);

    if (totalImageUploadError) {
      setEditFormError(totalImageUploadError);
      event.target.value = "";
      return;
    }

    if (remainingSlots <= 0) {
      setEditFormError(`A piece can have a maximum of ${maxImagesPerItem} detailed images.`);
      event.target.value = "";
      return;
    }

    const nextPreviews = createImagePreviews(acceptedFiles);

    if (nextPreviews.length < files.length) {
      setEditFormError(`Only ${maxImagesPerItem} ${imageKey} images are allowed per piece.`);
    } else {
      setEditFormError(null);
    }

    if (imageKey === "above") {
      setEditAboveImagePreviews((currentPreviews) => [...currentPreviews, ...nextPreviews]);
    } else {
      setEditDetailedImagePreviews((currentPreviews) => [...currentPreviews, ...nextPreviews]);
    }
    event.target.value = "";
  };

  const removeEditExistingImage = (imageKey: EditableImageKey, index: number) => {
    const removeAt = (currentImages: string[]) =>
      currentImages.filter((_, imageIndex) => imageIndex !== index);

    if (imageKey === "above") {
      setEditExistingAboveImages(removeAt);
    } else {
      setEditExistingDetailedImages(removeAt);
    }
  };

  const removeEditPreview = (imageKey: EditableImageKey, index: number) => {
    if (imageKey === "above") {
      setEditAboveImagePreviews((currentPreviews) => removePreviewAt(currentPreviews, index));
    } else {
      setEditDetailedImagePreviews((currentPreviews) => removePreviewAt(currentPreviews, index));
    }
  };

  const handleUpdateItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedEditItem) return;

    setIsUpdatingItem(true);
    setEditFormError(null);

    try {
      const validationError = validateItemForm(editFormValues);
      if (validationError) {
        throw new Error(validationError);
      }

      const nextAboveCount = editExistingAboveImages.length + editAboveImagePreviews.length;
      const nextDetailedCount =
        editExistingDetailedImages.length + editDetailedImagePreviews.length;

      if (!nextAboveCount) {
        throw new Error("Please keep or add at least one Above image.");
      }

      if (!nextDetailedCount) {
        throw new Error("Please keep or add at least one Detailed image.");
      }

      const confirmed = window.confirm(
        `Are you sure you want to update "${selectedEditItem.name}" in the database?`
      );

      if (!confirmed) {
        setIsUpdatingItem(false);
        return;
      }

      const formData = new FormData();
      formData.append("id", selectedEditItem.id);
      formData.append("name", editFormValues.name);
      formData.append("shopify", editFormValues.shopify);
      formData.append("type", editFormValues.type);
      formData.append("category", editFormValues.category);
      formData.append("season", editFormValues.season);
      formData.append("collectionName", editFormValues.collectionName);
      formData.append("shortDescription", editFormValues.shortDescription);
      formData.append("longDescription", editFormValues.longDescription);
      formData.append("material", editFormValues.material);
      formData.append("productsInCollection", editFormValues.productsInCollection);
      formData.append("availableColors", editFormValues.availableColors);
      formData.append("matchingPalette", editFormValues.matchingPalette);
      formData.append("sizes", editFormValues.sizes);
      formData.append("unique", String(editFormValues.unique));
      formData.append("handmade", String(editFormValues.handmade));
      formData.append("existingImagesAbove", JSON.stringify(editExistingAboveImages));
      formData.append("existingImagesDetailed", JSON.stringify(editExistingDetailedImages));

      for (const preview of editAboveImagePreviews) {
        formData.append("imagesAbove", preview.file);
      }

      for (const preview of editDetailedImagePreviews) {
        formData.append("imagesDetailed", preview.file);
      }

      const response = await fetch("/api/items", {
        method: "PATCH",
        body: formData,
      });
      const data = await readResponsePayload(response);

      if (!response.ok) {
        throw new Error(data.error || "Failed to update item");
      }

      await refreshItems();
      closeEditModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update item";
      console.error(error);
      setEditFormError(message);
      setIsUpdatingItem(false);
    }
  };

  return {
    closeEditModal,
    editAboveImagePreviews,
    editDetailedImagePreviews,
    editExistingAboveImages,
    editExistingDetailedImages,
    editFormError,
    editFormValues,
    handleEditImagesChange,
    handleUpdateItem,
    isUpdatingItem,
    openEditModal,
    removeEditExistingImage,
    removeEditPreview,
    selectedEditItem,
    updateEditField,
  };
}
