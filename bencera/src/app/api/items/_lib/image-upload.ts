import "server-only";
import { uploadFileToCloudinary } from "@/lib/cloudinary";
import {
  formatFileSize,
  maxImageFileSizeBytes,
  maxTotalImageUploadBytes,
} from "@/lib/item-image-policy";

async function filesToCloudinaryUrls(files: File[], folder: string) {
  if (!files.length) return [];
  return Promise.all(files.map((file) => uploadFileToCloudinary(file, folder)));
}

export function validateImageUploadSize(files: File[]) {
  const oversizedFile = files.find((file) => file.size > maxImageFileSizeBytes);

  if (oversizedFile) {
    return `Image upload is too large. Each image must be ${formatFileSize(maxImageFileSizeBytes)} or smaller: ${oversizedFile.name} is ${formatFileSize(oversizedFile.size)}.`;
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  if (totalSize > maxTotalImageUploadBytes) {
    return `Image upload is too large. The selected images are ${formatFileSize(totalSize)} total, but one upload request can be at most ${formatFileSize(maxTotalImageUploadBytes)}.`;
  }

  return null;
}

export async function uploadCreateItemImages(files: {
  imagesAboveFiles: File[];
  imagesDetailedFiles: File[];
  imagesBackgroundFiles: File[];
  imagesHowToUseFiles: File[];
}) {
  const [imagesAbove, imagesDetailed, imagesBackground, imagesHowToUse] = await Promise.all([
    filesToCloudinaryUrls(files.imagesAboveFiles, "bencera/items/above"),
    filesToCloudinaryUrls(files.imagesDetailedFiles, "bencera/items/detailed"),
    filesToCloudinaryUrls(files.imagesBackgroundFiles, "bencera/items/background"),
    filesToCloudinaryUrls(files.imagesHowToUseFiles, "bencera/items/howto"),
  ]);

  return { imagesAbove, imagesDetailed, imagesBackground, imagesHowToUse };
}

export async function uploadUpdateItemImages(files: {
  newAboveImageFiles: File[];
  newDetailedImageFiles: File[];
}) {
  const [newAboveImageUrls, newDetailedImageUrls] = await Promise.all([
    filesToCloudinaryUrls(files.newAboveImageFiles, "bencera/items/above"),
    filesToCloudinaryUrls(files.newDetailedImageFiles, "bencera/items/detailed"),
  ]);

  return { newAboveImageUrls, newDetailedImageUrls };
}
