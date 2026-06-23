export const maxImagesPerItem = 5;
export const maxImageFileSizeBytes = 4 * 1024 * 1024;
export const maxTotalImageUploadBytes = 4 * 1024 * 1024;

export function formatFileSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
