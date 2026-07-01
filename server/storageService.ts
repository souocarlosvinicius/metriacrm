import fs from "fs";
import path from "path";
import crypto from "crypto";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// Ensure the local uploads directory exists
export function initStorage() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

/**
 * Service to handle property photo storage.
 * Easily swappable/configurable for Cloudinary, S3, Firebase Storage, etc.
 */
export async function uploadImage(base64DataUrl: string): Promise<string> {
  // If the data is not base64, return it directly (e.g. standard preset URLs)
  if (!base64DataUrl.startsWith("data:image/")) {
    return base64DataUrl;
  }

  // Extract content type and base64 string
  const matches = base64DataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Formato de imagem inválido.");
  }

  const contentType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, "base64");

  // Generate unique filename
  let extension = contentType.split("/")[1] || "jpg";
  // Handle jpeg extension edge case
  if (extension === "jpeg") extension = "jpg";
  
  const uniqueId = crypto.randomBytes(12).toString("hex");
  const filename = `${uniqueId}.${extension}`;
  const filePath = path.join(UPLOADS_DIR, filename);

  // Write file to local disk
  await fs.promises.writeFile(filePath, buffer);

  // Return the public URL path
  // Since we serve '/uploads' statically, this URL will work perfectly in development & production
  return `/uploads/${filename}`;
}

/**
 * Optional: Delete an uploaded image from local storage
 */
export async function deleteImage(imagePath: string): Promise<void> {
  if (!imagePath.startsWith("/uploads/")) {
    return; // Do not delete external preset or non-local images
  }

  const filename = imagePath.replace("/uploads/", "");
  // Simple check to prevent path traversal
  if (filename.includes("/") || filename.includes("..")) {
    return;
  }

  const filePath = path.join(UPLOADS_DIR, filename);
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (err) {
    console.error(`Erro ao deletar imagem local (${filePath}):`, err);
  }
}
