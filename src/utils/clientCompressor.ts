import { CompressionSettings, CompressedResult, WatermarkSettings } from '../types/compressor';

/**
 * Format bytes to human readable format (KB, MB) with tabular numbers
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Calculate reduction percentage
 */
export function calculateReduction(original: number, compressed: number): { percent: number; isSmaller: boolean } {
  if (original <= 0) return { percent: 0, isSmaller: true };
  const diff = original - compressed;
  const percent = Math.round((diff / original) * 100);
  return {
    percent: Math.abs(percent),
    isSmaller: diff >= 0,
  };
}

/**
 * Read image metadata (dimensions & format)
 */
export function getImageDimensions(file: File | Blob): Promise<{ width: number; height: number; format: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const format = file.type ? file.type.replace('image/', '') : 'unknown';
      resolve({ width: img.naturalWidth, height: img.naturalHeight, format });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image metadata'));
    };
    img.src = url;
  });
}

/**
 * Calculate target dimensions based on maxWidth, maxHeight and keepAspectRatio
 */
export function calculateTargetDimensions(
  srcWidth: number,
  srcHeight: number,
  maxWidth: number | null,
  maxHeight: number | null,
  keepAspectRatio = true
): { width: number; height: number } {
  let width = srcWidth;
  let height = srcHeight;

  if (!maxWidth && !maxHeight) {
    return { width, height };
  }

  if (keepAspectRatio) {
    const ratio = srcWidth / srcHeight;
    if (maxWidth && width > maxWidth) {
      width = maxWidth;
      height = Math.round(width / ratio);
    }
    if (maxHeight && height > maxHeight) {
      height = maxHeight;
      width = Math.round(height * ratio);
    }
  } else {
    if (maxWidth) width = maxWidth;
    if (maxHeight) height = maxHeight;
  }

  return {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  };
}

/**
 * Compress an image file using browser Canvas / OffscreenCanvas pipeline
 * mirrors Sharp pipeline parameters: resize fit: 'inside', format encoding, quality factor
 */
export async function compressImage(
  file: File | Blob,
  settings: CompressionSettings,
  onProgress?: (progress: number) => void
): Promise<CompressedResult> {
  const startTime = performance.now();
  if (onProgress) onProgress(15);

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      try {
        if (onProgress) onProgress(35);
        const originalWidth = img.naturalWidth;
        const originalHeight = img.naturalHeight;

        const targetDims = calculateTargetDimensions(
          originalWidth,
          originalHeight,
          settings.maxWidth,
          settings.maxHeight,
          settings.keepAspectRatio
        );

        if (onProgress) onProgress(55);

        // Canvas creation with high smoothing
        const canvas = document.createElement('canvas');
        canvas.width = targetDims.width;
        canvas.height = targetDims.height;
        const ctx = canvas.getContext('2d', { alpha: true });

        if (!ctx) {
          throw new Error('Canvas 2D context could not be created');
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, targetDims.width, targetDims.height);
        if (onProgress) onProgress(65);

        // Apply Watermark if enabled and available
        if (settings.watermark && settings.watermark.enabled && settings.watermark.dataUrl) {
          try {
            await drawWatermark(ctx, settings.watermark, targetDims.width, targetDims.height);
          } catch (wmErr) {
            console.warn('Failed to apply watermark onto canvas:', wmErr);
          }
        }
        if (onProgress) onProgress(75);

        // Determine MIME type
        let mimeType = 'image/webp';
        let formatName = 'webp';

        if (settings.targetFormat === 'original') {
          mimeType = file.type || 'image/jpeg';
          formatName = mimeType.replace('image/', '');
        } else if (settings.targetFormat === 'jpeg') {
          mimeType = 'image/jpeg';
          formatName = 'jpeg';
        } else if (settings.targetFormat === 'png') {
          mimeType = 'image/png';
          formatName = 'png';
        } else if (settings.targetFormat === 'avif') {
          // Check if browser supports image/avif canvas export
          mimeType = 'image/avif';
          formatName = 'avif';
        } else {
          mimeType = 'image/webp';
          formatName = 'webp';
        }

        const qualityFactor = Math.min(Math.max(settings.quality / 100, 0.01), 1.0);

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);

            if (!blob) {
              // Fallback to webp or jpeg if specific format export failed
              canvas.toBlob(
                (fallbackBlob) => {
                  if (!fallbackBlob) {
                    reject(new Error('Image conversion failed'));
                    return;
                  }
                  if (onProgress) onProgress(100);
                  const resultUrl = URL.createObjectURL(fallbackBlob);
                  const durationMs = Math.round(performance.now() - startTime);

                  resolve({
                    blob: fallbackBlob,
                    url: resultUrl,
                    size: fallbackBlob.size,
                    width: targetDims.width,
                    height: targetDims.height,
                    format: 'jpeg',
                    durationMs,
                  });
                },
                'image/jpeg',
                qualityFactor
              );
              return;
            }

            if (onProgress) onProgress(100);
            const resultUrl = URL.createObjectURL(blob);
            const durationMs = Math.round(performance.now() - startTime);

            resolve({
              blob,
              url: resultUrl,
              size: blob.size,
              width: targetDims.width,
              height: targetDims.height,
              format: formatName,
              durationMs,
            });
          },
          mimeType,
          qualityFactor
        );
      } catch (err: unknown) {
        URL.revokeObjectURL(url);
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image file into memory'));
    };

    img.src = url;
  });
}

/**
 * Draw watermark onto canvas context based on opacity, size, position and padding
 */
export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  watermark: WatermarkSettings,
  canvasWidth: number,
  canvasHeight: number
): Promise<void> {
  return new Promise((resolve) => {
    if (!watermark.dataUrl) {
      resolve();
      return;
    }

    const wmImg = new Image();
    wmImg.onload = () => {
      try {
        const naturalW = wmImg.naturalWidth || 100;
        const naturalH = wmImg.naturalHeight || 100;
        const aspect = naturalW / naturalH;

        // Desired width as percentage of target canvas width (clamped)
        const percent = (watermark.sizePercent || 20) / 100;
        let targetW = Math.max(20, Math.round(canvasWidth * percent));
        let targetH = Math.round(targetW / aspect);

        // In case targetH exceeds canvas height proportionally
        if (targetH > canvasHeight * 0.8) {
          targetH = Math.round(canvasHeight * 0.8);
          targetW = Math.round(targetH * aspect);
        }

        const margin = Math.round(watermark.margin ?? 24);

        let x = margin;
        let y = margin;

        switch (watermark.position) {
          case 'top-left':
            x = margin;
            y = margin;
            break;
          case 'top-right':
            x = Math.max(0, canvasWidth - targetW - margin);
            y = margin;
            break;
          case 'bottom-left':
            x = margin;
            y = Math.max(0, canvasHeight - targetH - margin);
            break;
          case 'bottom-right':
            x = Math.max(0, canvasWidth - targetW - margin);
            y = Math.max(0, canvasHeight - targetH - margin);
            break;
          case 'center':
          default:
            x = Math.max(0, Math.round((canvasWidth - targetW) / 2));
            y = Math.max(0, Math.round((canvasHeight - targetH) / 2));
            break;
        }

        ctx.save();
        ctx.globalAlpha = Math.min(Math.max(watermark.opacity ?? 0.7, 0.01), 1);
        ctx.drawImage(wmImg, x, y, targetW, targetH);
        ctx.restore();
      } catch (e) {
        console.error('Error drawing watermark:', e);
      } finally {
        resolve();
      }
    };

    wmImg.onerror = () => {
      console.warn('Failed to load watermark image for rendering');
      resolve();
    };

    wmImg.src = watermark.dataUrl;
  });
}

