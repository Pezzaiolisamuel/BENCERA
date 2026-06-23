import {
  formatFileSize,
  maxImageFileSizeBytes,
  maxTotalImageUploadBytes,
  type ImagePreview,
} from "@/lib/admin-item-form";

export function getOversizedImageError(files: File[]) {
  const oversizedFiles = files.filter((file) => file.size > maxImageFileSizeBytes);

  if (!oversizedFiles.length) return null;

  const names = oversizedFiles.map((file) => `${file.name} (${formatFileSize(file.size)})`);
  return `Image upload is too large. Each image must be ${formatFileSize(maxImageFileSizeBytes)} or smaller: ${names.join(", ")}.`;
}

export function getTotalImageUploadError(files: File[]) {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  if (totalSize <= maxTotalImageUploadBytes) return null;

  return `Image upload is too large. The selected images are ${formatFileSize(totalSize)} total, but one upload request can be at most ${formatFileSize(maxTotalImageUploadBytes)}.`;
}

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
