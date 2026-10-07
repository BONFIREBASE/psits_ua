export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
    img.src = objectUrl;
  });
}

/**
 * Compresses an image to WebP with EXIF orientation correction and proportional scaling.
 */
export async function compressImageToWebP(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  if (typeof window === "undefined" || !file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return file;
  }

  const { maxWidth = 1600, maxHeight = 1600, quality = 0.85 } = options;

  try {
    let sourceWidth: number;
    let sourceHeight: number;
    let drawable: ImageBitmap | HTMLImageElement;

    // Use createImageBitmap with EXIF auto-orientation if supported (fixes iOS/Android inverted photos)
    if (typeof createImageBitmap === "function") {
      try {
        const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
        sourceWidth = bitmap.width;
        sourceHeight = bitmap.height;
        drawable = bitmap;
      } catch {
        const img = await loadImageElement(file);
        sourceWidth = img.width;
        sourceHeight = img.height;
        drawable = img;
      }
    } else {
      const img = await loadImageElement(file);
      sourceWidth = img.width;
      sourceHeight = img.height;
      drawable = img;
    }

    let width = sourceWidth;
    let height = sourceHeight;

    // Proportional aspect ratio scaling
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
      if (typeof (drawable as ImageBitmap).close === "function") {
        (drawable as ImageBitmap).close();
      }
      return file;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(drawable, 0, 0, width, height);

    if (typeof (drawable as ImageBitmap).close === "function") {
      (drawable as ImageBitmap).close();
    }

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }

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
    });
  } catch {
    return file;
  }
}

/**
 * Generates an ultra-lightweight 16x16 base64 LQIP (Low Quality Image Placeholder) blur thumbnail.
 */
export async function generateLQIP(file: File): Promise<string> {
  if (typeof window === "undefined" || !file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return "";
  }
  try {
    const img = await loadImageElement(file);
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, 0, 0, 16, 16);
    return canvas.toDataURL("image/webp", 0.25);
  } catch {
    return "";
  }
}
