import {
  formatFileSize,
  maxImageFileSizeBytes,
  maxTotalImageUploadBytes,
} from "@/lib/item-image-policy";

export type ImageFileLike = {
  name: string;
  size: number;
};

export function getOversizedImageFiles<T extends ImageFileLike>(files: readonly T[]) {
  return files.filter((file) => file.size > maxImageFileSizeBytes);
}

export function getTotalImageUploadSize(files: readonly ImageFileLike[]) {
  return files.reduce((sum, file) => sum + file.size, 0);
}

export function getOversizedImageError(files: readonly ImageFileLike[]) {
  const oversizedFiles = getOversizedImageFiles(files);

  if (!oversizedFiles.length) return null;

  const names = oversizedFiles.map((file) => `${file.name} (${formatFileSize(file.size)})`);
  return `Image upload is too large. Each image must be ${formatFileSize(maxImageFileSizeBytes)} or smaller: ${names.join(", ")}.`;
}

export function getSingleOversizedImageError(files: readonly ImageFileLike[]) {
  const oversizedFile = getOversizedImageFiles(files)[0];

  if (!oversizedFile) return null;

  return `Image upload is too large. Each image must be ${formatFileSize(maxImageFileSizeBytes)} or smaller: ${oversizedFile.name} is ${formatFileSize(oversizedFile.size)}.`;
}

export function getTotalImageUploadError(files: readonly ImageFileLike[]) {
  const totalSize = getTotalImageUploadSize(files);

  if (totalSize <= maxTotalImageUploadBytes) return null;

  return `Image upload is too large. The selected images are ${formatFileSize(totalSize)} total, but one upload request can be at most ${formatFileSize(maxTotalImageUploadBytes)}.`;
}
