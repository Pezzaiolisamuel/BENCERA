import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export function cloudinaryPublicIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);

    const uploadIdx = parts.findIndex((p) => p === "upload");
    if (uploadIdx === -1) return null;

    const afterUpload = parts.slice(uploadIdx + 1);
    let idx = 0;

    while (idx < afterUpload.length && /[,=_]/.test(afterUpload[idx]) && !/^v\d+$/.test(afterUpload[idx])) {
      idx++;
    }

    if (idx < afterUpload.length && /^v\d+$/.test(afterUpload[idx])) {
      idx++;
    }

    const publicPathWithExt = afterUpload.slice(idx).join("/");
    if (!publicPathWithExt) return null;

    const publicId = publicPathWithExt.replace(/\.[a-zA-Z0-9]+$/, "");
    return publicId || null;
  } catch {
    return null;
  }
}

export async function deleteFromCloudinaryByUrl(url: string) {
  const publicId = cloudinaryPublicIdFromUrl(url);
  if (!publicId) throw new Error(`Could not extract public_id from url: ${url}`);

  return cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}
