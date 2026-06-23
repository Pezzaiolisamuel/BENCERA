import "server-only";
import { uploadFileToCloudinary } from "@/lib/cloudinary";
import {
  getSingleOversizedImageError,
  getTotalImageUploadError,
} from "@/lib/item-image-validation";

async function filesToCloudinaryUrls(files: File[], folder: string) {
  if (!files.length) return [];
  return Promise.all(files.map((file) => uploadFileToCloudinary(file, folder)));
}

export function validateImageUploadSize(files: File[]) {
  return getSingleOversizedImageError(files) || getTotalImageUploadError(files);
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
