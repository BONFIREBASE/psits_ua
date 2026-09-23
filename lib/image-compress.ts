/**
 * Client-Side Image Compression Utility
 * Resizes and converts raster images (PNG, JPEG, WebP) to optimized WebP format
 * prior to direct cloud storage upload. Drastically cuts bandwidth consumption,
 * upload duration, and prevents client memory crashes during high-concurrency galleries.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export async function compressImageToWebP(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  // 1. Guard against non-browser environments or non-raster files
  if (typeof window === "undefined" || !file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return file;
  }

  const { maxWidth = 1600, maxHeight = 1600, quality = 0.85 } = options;

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // 2. Proportional aspect ratio scaling
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      // Smooth interpolation for downscaled image
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

          // If compression didn't save bytes and original is already WebP, keep original
          if (blob.size >= file.size && file.type === "image/webp") {
            resolve(file);
            return;
          }

          const baseName = file.name.replace(/\.[^/.]+$/, "");
          const compressedFile = new File([blob], `${baseName}.webp`, {
            type: "image/webp",
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // Fail-open: return original file on canvas decode error
      resolve(file);
    };

    img.src = objectUrl;
  });
}
