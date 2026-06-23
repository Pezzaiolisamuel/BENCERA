import {
  type ImagePreview,
} from "@/lib/admin-item-form";
export {
  getOversizedImageError,
  getTotalImageUploadError,
} from "@/lib/item-image-validation";

export function createImagePreviews(files: File[]): ImagePreview[] {
  return files.map((file) => ({ file, url: URL.createObjectURL(file) }));
}

export function revokePreviewUrls(previews: ImagePreview[]) {
  // Browser-created object URLs retain their blobs until explicitly released.
  previews.forEach((preview) => URL.revokeObjectURL(preview.url));
}

export function removePreviewAt(previews: ImagePreview[], index: number) {
  const nextPreviews = [...previews];
  const [removedPreview] = nextPreviews.splice(index, 1);

  if (removedPreview) {
    URL.revokeObjectURL(removedPreview.url);
  }

  return nextPreviews;
}
