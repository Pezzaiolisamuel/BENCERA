import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import {
  buildItemFormData,
  createEmptyImagePreviewGroups,
  getImagePreviewCount,
  initialItemFormValues,
  maxImagesPerItem,
  type ImagePreviewGroups,
  type ItemFormValues,
  validateItemForm,
} from "@/lib/admin-item-form";
import type { ItemImageKey } from "@/types/item";
import {
  createImagePreviews,
  getOversizedImageError,
  getTotalImageUploadError,
  removePreviewAt,
  revokePreviewUrls,
} from "./admin-image-previews";
import { readResponsePayload } from "./admin-request";

type UseCreateItemFormOptions = {
  refreshItems: () => Promise<void>;
};

function getAllPreviews(groups: ImagePreviewGroups) {
  return [
    ...groups.above,
    ...groups.detailed,
    ...groups.background,
    ...groups.howToUse,
  ];
}

function getImageRequirementError(groups: ImagePreviewGroups) {
  if (!groups.above.length) return "Please add at least one Above image.";
  if (!groups.detailed.length) return "Please add at least one Detailed image.";
  return null;
}

export function useCreateItemForm({ refreshItems }: UseCreateItemFormOptions) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [itemFormValues, setItemFormValues] = useState<ItemFormValues>(initialItemFormValues);
  const [imagePreviewGroups, setImagePreviewGroups] = useState<ImagePreviewGroups>(
    createEmptyImagePreviewGroups
  );
  const previewGroupsRef = useRef(imagePreviewGroups);
  previewGroupsRef.current = imagePreviewGroups;

  useEffect(() => {
    return () => {
      // Unmounting can bypass the Clear button, so release every remaining object URL here.
      revokePreviewUrls(getAllPreviews(previewGroupsRef.current));
    };
  }, []);

  const updateField = (fieldName: keyof ItemFormValues, value: string | boolean) => {
    setItemFormValues((currentValues) => ({
      ...currentValues,
      [fieldName]: value,
    }));
  };

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
    imageKey: ItemImageKey
  ) => {
    const files = event.target.files;
    if (!files) return;
    const selectedFiles = Array.from(files);

    const oversizedImageError = getOversizedImageError(selectedFiles);
    if (oversizedImageError) {
      setFormError(oversizedImageError);
      event.target.value = "";
      return;
    }

    const currentImageCount = getImagePreviewCount(imagePreviewGroups);
    const remainingSlots = maxImagesPerItem - currentImageCount;
    const acceptedFiles = selectedFiles.slice(0, Math.max(remainingSlots, 0));
    const totalImageUploadError = getTotalImageUploadError([
      ...getAllPreviews(imagePreviewGroups).map((preview) => preview.file),
      ...acceptedFiles,
    ]);

    if (totalImageUploadError) {
      setFormError(totalImageUploadError);
      event.target.value = "";
      return;
    }

    if (remainingSlots <= 0) {
      setFormError(`You can upload a maximum of ${maxImagesPerItem} images per item.`);
      event.target.value = "";
      return;
    }

    const nextPreviews = createImagePreviews(acceptedFiles);

    if (nextPreviews.length < files.length) {
      setFormError(`Only ${maxImagesPerItem} images total are allowed per item.`);
    } else {
      setFormError(null);
    }

    setImagePreviewGroups((currentGroups) => ({
      ...currentGroups,
      [imageKey]: [...currentGroups[imageKey], ...nextPreviews],
    }));

    event.target.value = "";
  };

  const removePreview = (imageKey: ItemImageKey, index: number) => {
    setImagePreviewGroups((currentGroups) => ({
      ...currentGroups,
      [imageKey]: removePreviewAt(currentGroups[imageKey], index),
    }));
  };

  const clearForm = () => {
    revokePreviewUrls(getAllPreviews(imagePreviewGroups));
    setItemFormValues(initialItemFormValues);
    setImagePreviewGroups(createEmptyImagePreviewGroups());
    setFormError(null);
    setShowSuccess(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setShowSuccess(false);

    try {
      const validationError = validateItemForm(itemFormValues);
      if (validationError) {
        throw new Error(validationError);
      }

      const imageRequirementError = getImageRequirementError(imagePreviewGroups);
      if (imageRequirementError) {
        throw new Error(imageRequirementError);
      }

      const response = await fetch("/api/items", {
        method: "POST",
        body: buildItemFormData(itemFormValues, imagePreviewGroups),
      });
      const data = await readResponsePayload(response);

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setShowSuccess(true);
      clearForm();
      await refreshItems();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create item";
      console.error(error);
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    clearForm,
    formError,
    handleFileChange,
    handleSubmit,
    hideSuccess: () => setShowSuccess(false),
    imagePreviewGroups,
    isSubmitting,
    itemFormValues,
    removePreview,
    showSuccess,
    updateField,
  };
}
