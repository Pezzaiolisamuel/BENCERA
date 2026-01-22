import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

/**
 * Extracts Cloudinary public_id from a standard Cloudinary delivery URL.
 * Example URL:
 * https://res.cloudinary.com/<cloud>/image/upload/v123/bencera/items/above/abc.png
 * public_id => bencera/items/above/abc
 */
export function cloudinaryPublicIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);

    // Find the "upload" segment; public_id starts after it.
    const uploadIdx = parts.findIndex((p) => p === "upload");
    if (uploadIdx === -1) return null;

    // Everything after upload/ may include transformations + version + public_id
    // Common patterns:
    // /image/upload/v123/folder/file.png
    // /image/upload/c_fill,w_300/v123/folder/file.png
    const afterUpload = parts.slice(uploadIdx + 1);

    // Remove transformation segment(s) until we hit version "v123" OR folder path
    // We'll remove a leading segment if it contains commas or underscores typical of transforms.
    // Then remove version segment if present.
    let idx = 0;

    // Skip transformation segments (heuristic)
    while (idx < afterUpload.length && /[,=_]/.test(afterUpload[idx]) && !/^v\d+$/.test(afterUpload[idx])) {
      idx++;
    }

    // Skip version segment
    if (idx < afterUpload.length && /^v\d+$/.test(afterUpload[idx])) {
      idx++;
    }

    const publicPathWithExt = afterUpload.slice(idx).join("/");
    if (!publicPathWithExt) return null;

    // Remove extension
    const publicId = publicPathWithExt.replace(/\.[a-zA-Z0-9]+$/, "");
    return publicId || null;
  } catch {
    return null;
  }
}

export async function deleteFromCloudinaryByUrl(url: string) {
  const publicId = cloudinaryPublicIdFromUrl(url);
  if (!publicId) throw new Error(`Could not extract public_id from url: ${url}`);

  // destroy() returns { result: "ok" } or "not found"
  return cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}
